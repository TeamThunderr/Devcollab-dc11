import { GoogleGenerativeAI, type Content, type Part, type Tool } from '@google/generative-ai'
import { env } from '../config/env.js'
import { createLogger } from './logger.js'

const logger = createLogger('gemini')

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export type ToolHandler = (args: any) => Promise<any>

export interface AIResponseWithMetadata {
  text: string
  toolCalls: Array<{ name: string; args: any }>
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    total: number
  }
  modelUsed: string
}

export type StreamChunk =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; tool: string; args: any }
  | { type: 'done'; tokenUsage?: { inputTokens: number; outputTokens: number; total: number }; modelUsed: string }

/**
 * Generate a response from Gemini using the configured model.
 * Automatically falls back to GEMINI_FALLBACK_MODEL on error.
 */
export async function generateAIResponse(
  userMessage: string | Array<string | Part>,
  history: ChatMessage[],
  systemInstruction: string,
  tools?: Tool[],
  toolHandlers?: Record<string, ToolHandler>,
): Promise<AIResponseWithMetadata> {
  if (process.env.MOCK_GEMINI === 'true') {
    const prompt = typeof userMessage === 'string' ? userMessage : JSON.stringify(userMessage)
    const executedToolCalls: Array<{ name: string; args: any }> = []
    let responseText = ''

    if (prompt.includes('Create 3 tasks')) {
      const call = {
        name: 'createMultipleTasks',
        args: {
          projectId: undefined,
          tasks: [
            { title: 'Design UI', priority: 'P1' },
            { title: 'Setup backend auth', priority: 'P1' },
            { title: 'Write integration tests', priority: 'P1' }
          ]
        }
      }
      executedToolCalls.push(call)
      const handler = toolHandlers ? toolHandlers[call.name] : undefined
      if (handler) {
        await handler(call.args)
      }
      responseText = 'I have successfully created those 3 tasks for the login feature.'
    } else if (prompt.includes('Assign all unassigned tasks')) {
      const getCall = { name: 'getTasks', args: { unassigned: true } }
      executedToolCalls.push(getCall)
      const getHandler = toolHandlers ? toolHandlers[getCall.name] : undefined
      let tasksList: any = { tasks: [] }
      if (getHandler) {
        tasksList = await getHandler(getCall.args)
      }

      const updateHandler = toolHandlers ? toolHandlers['updateTask'] : undefined
      if (updateHandler && tasksList.tasks) {
        for (const t of tasksList.tasks) {
          const rajIdMatch = prompt.match(/his ID is (\d+)/)
          const rajId = rajIdMatch ? parseInt(rajIdMatch[1]!, 10) : 2
          const updateCall = { name: 'updateTask', args: { taskId: t.id, assigneeId: rajId } }
          executedToolCalls.push(updateCall)
          await updateHandler(updateCall.args)
        }
      }
      responseText = 'I have successfully assigned all unassigned tasks to Raj.'
    } else if (prompt.includes('Write release notes')) {
      const getCall = { name: 'getTasks', args: { completedAfter: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString() } }
      executedToolCalls.push(getCall)
      const getHandler = toolHandlers ? toolHandlers[getCall.name] : undefined
      let tasksList: any = { tasks: [] }
      if (getHandler) {
        tasksList = await getHandler(getCall.args)
      }

      const createCall = {
        name: 'createDoc',
        args: {
          title: 'Release Notes v1.0',
          content: 'Here are the completed tasks: ' + (tasksList.tasks || []).map((t: any) => t.title).join(', ')
        }
      }
      executedToolCalls.push(createCall)
      const createHandler = toolHandlers ? toolHandlers[createCall.name] : undefined
      if (createHandler) {
        await createHandler(createCall.args)
      }
      responseText = 'I have successfully generated the release notes and saved them as a wiki doc.'
    }

    return {
      text: responseText,
      toolCalls: executedToolCalls,
      tokenUsage: { inputTokens: 100, outputTokens: 50, total: 150 },
      modelUsed: 'gemini-2.0-flash-mock'
    }
  }

  // Convert our message format to Gemini Content format
  const geminiHistory: Content[] = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }))

  const tryGenerate = async (modelName: string): Promise<AIResponseWithMetadata> => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
      tools,
    })

    const chat = model.startChat({ history: geminiHistory })
    const executedToolCalls: Array<{ name: string; args: any }> = []

    let result = await chat.sendMessage(userMessage)
    let response = result.response

    let functionCalls = response.functionCalls()
    while (functionCalls && functionCalls.length > 0) {
      const functionResponses: Part[] = []

      for (const call of functionCalls) {
        executedToolCalls.push({ name: call.name, args: call.args })
        const handler = toolHandlers ? toolHandlers[call.name] : undefined
        if (handler) {
          try {
            logger.debug({ name: call.name, args: call.args }, 'Executing AI tool call')
            const handlerResult = await handler(call.args)
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: handlerResult,
              },
            })
          } catch (err: any) {
            logger.error({ name: call.name, err }, 'AI tool call failed')
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { error: err.message || 'Tool execution failed' },
              },
            })
          }
        } else {
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { error: `Tool ${call.name} not found` },
            },
          })
        }
      }

      // Send the function responses back to the model
      result = await chat.sendMessage(functionResponses)
      response = result.response
      functionCalls = response.functionCalls()
    }

    const usage = response.usageMetadata
    const tokenUsage = usage ? {
      inputTokens: usage.promptTokenCount,
      outputTokens: usage.candidatesTokenCount,
      total: usage.totalTokenCount,
    } : undefined

    return {
      text: response.text(),
      toolCalls: executedToolCalls,
      tokenUsage,
      modelUsed: modelName,
    }
  }

  try {
    logger.debug({ model: env.GEMINI_MODEL }, 'Generating AI response')
    return await tryGenerate(env.GEMINI_MODEL)
  } catch (primaryErr) {
    logger.warn(
      { err: primaryErr, fallback: env.GEMINI_FALLBACK_MODEL },
      'Primary model failed, falling back',
    )
    try {
      return await tryGenerate(env.GEMINI_FALLBACK_MODEL)
    } catch (fallbackErr) {
      logger.error({ err: fallbackErr }, 'Fallback model also failed')
      throw new Error('AI service is currently unavailable. Please try again.')
    }
  }
}

/**
 * Generate a streaming response from Gemini using the configured model.
 */
export async function* generateAIResponseStream(
  userMessage: string | Array<string | Part>,
  history: ChatMessage[],
  systemInstruction: string,
  tools?: Tool[],
  toolHandlers?: Record<string, ToolHandler>,
): AsyncGenerator<StreamChunk, void, unknown> {
  const modelName = env.GEMINI_MODEL
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    tools,
  })

  const geminiHistory: Content[] = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }))

  const chat = model.startChat({ history: geminiHistory })
  let userMsg: string | Array<string | Part> | Part[] = userMessage

  while (true) {
    const resultStream = await chat.sendMessageStream(userMsg as any)

    for await (const chunk of resultStream.stream) {
      const text = chunk.text()
      if (text) {
        yield { type: 'text', content: text }
      }
    }

    const response = await resultStream.response
    const functionCalls = response.functionCalls()

    if (functionCalls && functionCalls.length > 0) {
      const functionResponses: Part[] = []

      for (const call of functionCalls) {
        yield { type: 'tool_call', tool: call.name, args: call.args }
        const handler = toolHandlers ? toolHandlers[call.name] : undefined
        if (handler) {
          try {
            logger.debug({ name: call.name, args: call.args }, 'Executing AI tool call (stream)')
            const handlerResult = await handler(call.args)
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: handlerResult,
              },
            })
          } catch (err: any) {
            logger.error({ name: call.name, err }, 'AI tool call failed (stream)')
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { error: err.message || 'Tool execution failed' },
              },
            })
          }
        } else {
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { error: `Tool ${call.name} not found` },
            },
          })
        }
      }

      userMsg = functionResponses
    } else {
      const usage = response.usageMetadata
      const tokenUsage = usage ? {
        inputTokens: usage.promptTokenCount,
        outputTokens: usage.candidatesTokenCount,
        total: usage.totalTokenCount,
      } : undefined

      yield {
        type: 'done',
        tokenUsage,
        modelUsed: modelName,
      }
      break
    }
  }
}
