const fs = require('fs');
let aiService = fs.readFileSync('src/modules/ai/ai.service.ts', 'utf8');

// 1. Add generateAIResponseStream to gemini.js import
aiService = aiService.replace("import { generateAIResponse } from '../../lib/gemini.js'", "import { generateAIResponse, generateAIResponseStream } from '../../lib/gemini.js'");

// 2. Add ai.tools.ts imports
aiService = aiService.replace("import type { ChatInput } from './ai.schema.js'", "import type { ChatInput } from './ai.schema.js'\nimport { getAITools, getAIToolHandlers } from './ai.tools.js'");

// 3. Remove inline tools and use getAITools inside chat()
const toolsRegex = /    const tools: any = \[\s*\{\s*functionDeclarations: \[\s*\{\s*name: 'createTask'[\s\S]*?    const startTime = Date\.now\(\)\n    const \{ text: replyText, toolCalls, tokenUsage, modelUsed \} = await generateAIResponse\(userMessagePayload as any, history, systemPrompt, tools, toolHandlers\)/m;
aiService = aiService.replace(toolsRegex, `    const tools = getAITools()
    const toolHandlers = getAIToolHandlers(data as ChatInput, userId)

    const startTime = Date.now()
    const { text: replyText, toolCalls, tokenUsage, modelUsed } = await generateAIResponse(userMessagePayload as any, history, systemPrompt, tools, toolHandlers)`);

// 4. Update the DB insert in chat() to save metadata
const insertRegex = /      await tx\.insert\(aiMessages\)\.values\(\[\s*\{\s*conversationId,\s*role: 'user',\s*content: data\.message,\s*\},\s*\{\s*conversationId,\s*role: 'model',\s*content: replyText,\s*\},\s*\]\)/m;
aiService = aiService.replace(insertRegex, `      await tx.insert(aiMessages).values([
        {
          conversationId,
          role: 'user',
          content: data.message,
        },
        {
          conversationId,
          role: 'model',
          content: replyText,
          metadata: {
            tokenUsage,
            modelUsed,
            latencyMs: Date.now() - startTime,
            toolCalls,
            isAgentMessage: toolCalls.length > 0
          }
        },
      ])`);

// 5. Add chatStream method
if (!aiService.includes('async chatStream')) {
  // It's easiest to just replace the end of the file with the full chatStream method.
  // The file ends with `}`.
  const chatStreamCode = `

  async chatStream(userId: number, data: ChatInput, reply: import('fastify').FastifyReply) {
    const _workspaceId = data.scope === 'workspace' ? data.scopeId : undefined
    let resolvedWorkspaceId: number

    if (data.scope === 'project') {
      const project = await db.query.projects.findFirst({ where: eq(projects.id, data.scopeId) })
      if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found')
      resolvedWorkspaceId = project.workspaceId
    } else {
      resolvedWorkspaceId = data.scopeId
    }

    await workspacesService.checkPermission(resolvedWorkspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    let conversationId = data.conversationId
    let _isNewConversation = false

    if (!conversationId) {
      _isNewConversation = true
      const title = data.message.length > 60 ? data.message.slice(0, 60) + '…' : data.message

      const [conv] = await db
        .insert(aiConversations)
        .values({ userId, workspaceId: resolvedWorkspaceId, title })
        .returning()
      conversationId = conv.id
    } else {
      const conv = await db.query.aiConversations.findFirst({ where: eq(aiConversations.id, conversationId) })
      if (!conv || conv.userId !== userId) throw new AppError(404, 'NOT_FOUND', 'Conversation not found')
    }

    const previousMessages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conversationId),
      orderBy: (aiMessages, { asc }) => [asc(aiMessages.createdAt)],
    })

    const history = previousMessages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    const contextContext = await this.buildContext(data.scope, data.scopeId, userId)
    const systemPrompt = \`You are an AI assistant in DevCollab.\\n\\nContext:\\n\${contextContext}\`

    const userMessagePayload = {
      role: 'user',
      parts: [{ text: data.message }],
    }

    const tools = getAITools()
    const toolHandlers = getAIToolHandlers(data as ChatInput, userId)

    const startTime = Date.now()
    const stream = generateAIResponseStream(userMessagePayload as any, history, systemPrompt, tools, toolHandlers)
    
    let fullReplyText = ''
    const executedToolCalls: any[] = []
    let finalTokenUsage = null
    let finalModelUsed = null

    reply.raw.write(\`data: \${JSON.stringify({ type: 'init', conversationId })}\\n\\n\`)

    for await (const chunk of stream) {
      reply.raw.write(\`data: \${JSON.stringify(chunk)}\\n\\n\`)
      
      if (chunk.type === 'text') {
        fullReplyText += chunk.content
      } else if (chunk.type === 'tool_call') {
        executedToolCalls.push({ name: chunk.name, args: chunk.args })
      } else if (chunk.type === 'metadata') {
        finalTokenUsage = chunk.tokenUsage
        finalModelUsed = chunk.modelUsed
      }
    }

    await db.transaction(async (tx) => {
      await tx.insert(aiMessages).values([
        { conversationId, role: 'user', content: data.message },
        { 
          conversationId, 
          role: 'model', 
          content: fullReplyText,
          metadata: {
            tokenUsage: finalTokenUsage,
            modelUsed: finalModelUsed,
            latencyMs: Date.now() - startTime,
            toolCalls: executedToolCalls,
            isAgentMessage: executedToolCalls.length > 0
          }
        },
      ])
      await tx.update(aiConversations).set({ updatedAt: new Date() }).where(eq(aiConversations.id, conversationId))
    })
  },
`
  // Replace the last closing brace with the chatStreamCode and a closing brace.
  aiService = aiService.replace(/}\s*$/, chatStreamCode + '\n}');
}

fs.writeFileSync('src/modules/ai/ai.service.ts', aiService, 'utf8');
