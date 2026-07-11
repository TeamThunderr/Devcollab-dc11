const fs = require('fs');

const original = fs.readFileSync('src/modules/ai/ai.service.ts', 'utf8');
const topPartEndIndex = original.indexOf('export const aiService = {');

const topPart = original.slice(0, topPartEndIndex);

const aiServiceText = `export const aiService = {
  async chat(userId: number, data: ChatInput) {
    // Verify workspace access
    const _workspaceId = data.scope === 'workspace' ? data.scopeId : undefined
    let resolvedWorkspaceId: number

    if (data.scope === 'project') {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, data.scopeId),
      })
      if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found')
      resolvedWorkspaceId = project.workspaceId
    } else {
      resolvedWorkspaceId = data.scopeId
    }

    await workspacesService.checkPermission(resolvedWorkspaceId, userId, [
      'OWNER', 'ADMIN', 'MEMBER',
    ])

    // Create or resume conversation
    let conversationId = data.conversationId
    let _isNewConversation = false

    if (!conversationId) {
      _isNewConversation = true
      // Use first 60 chars of the message as title
      const title = data.message.length > 60
        ? data.message.slice(0, 60) + '…'
        : data.message

      const [conv] = await db
        .insert(aiConversations)
        .values({
          userId,
          workspaceId: resolvedWorkspaceId,
          projectId: data.scope === 'project' ? data.scopeId : null,
          title,
        })
        .returning()

      if (!conv) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to create conversation')
      conversationId = conv.id
    } else {
      // Verify user owns this conversation
      const conv = await db.query.aiConversations.findFirst({
        where: and(
          eq(aiConversations.id, conversationId),
          eq(aiConversations.userId, userId),
        ),
      })
      if (!conv) throw new AppError(404, 'NOT_FOUND', 'Conversation not found')
    }

    // Load previous messages for history context (last 20 messages)
    const previousMessages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conversationId),
      orderBy: (m, { asc }) => [asc(m.createdAt)],
      limit: 20,
    })

    const history = previousMessages.map((m) => ({
      role: m.role as 'user' | 'model',
      content: m.content,
    }))

    // Build system prompt with live workspace context
    const systemPrompt = await buildSystemPrompt(data.scope, data.scopeId, userId)

    // Call Gemini with multimodal support
    const userMessagePayload = data.attachment 
      ? [
          data.message, 
          { inlineData: { data: data.attachment.data.includes(',') ? data.attachment.data.split(',')[1] : data.attachment.data, mimeType: data.attachment.type } }
        ]
      : data.message

    const tools = getAITools()
    const toolHandlers = getAIToolHandlers(data as ChatInput, userId)

    const startTime = Date.now()
    const aiResponse = await generateAIResponse(userMessagePayload as any, history, systemPrompt, tools, toolHandlers)

    // Persist messages (don't save base64 to DB to avoid bloat)
    const dbMessageContent = data.attachment 
      ? \`\${data.message}\\n\\n[Attached File: \${data.attachment.name}]\` 
      : data.message

    await db.insert(aiMessages).values([
      { conversationId, role: 'user', content: dbMessageContent },
      { 
        conversationId, 
        role: 'model', 
        content: aiResponse.text,
        metadata: {
          tokenUsage: aiResponse.tokenUsage,
          modelUsed: aiResponse.modelUsed,
          latencyMs: Date.now() - startTime,
          toolCalls: aiResponse.toolCalls || [],
          isAgentMessage: aiResponse.toolCalls ? aiResponse.toolCalls.length > 0 : false
        }
      },
    ])

    // Update conversation updatedAt
    await db
      .update(aiConversations)
      .set({ updatedAt: new Date() })
      .where(eq(aiConversations.id, conversationId))

    // Get the last inserted message id
    const lastMsg = await db.query.aiMessages.findFirst({
      where: and(
        eq(aiMessages.conversationId, conversationId),
        eq(aiMessages.role, 'model'),
      ),
      orderBy: (m, { desc }) => [desc(m.createdAt)],
    })

    return {
      conversationId,
      messageId: lastMsg?.id ?? 0,
      reply: aiResponse.text,
    }
  },

  async getConversations(userId: number, workspaceId: number) {
    await workspacesService.checkPermission(workspaceId, userId, [
      'OWNER', 'ADMIN', 'MEMBER', 'VIEWER',
    ])

    const convs = await db.query.aiConversations.findMany({
      where: and(
        eq(aiConversations.userId, userId),
        eq(aiConversations.workspaceId, workspaceId),
      ),
      orderBy: (c, { desc }) => [desc(c.updatedAt)],
      limit: 50,
    })

    return convs.map((c) => ({
      id: c.id,
      title: c.title,
      scope: c.projectId ? 'project' : 'workspace',
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }))
  },

  async getMessages(userId: number, conversationId: number) {
    const conv = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.userId, userId),
      ),
    })
    if (!conv) throw new AppError(404, 'NOT_FOUND', 'Conversation not found')

    const msgs = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conversationId),
      orderBy: (m, { asc }) => [asc(m.createdAt)],
    })

    return msgs.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }))
  },

  async deleteConversation(userId: number, conversationId: number) {
    const conv = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.userId, userId),
      ),
    })
    if (!conv) throw new AppError(404, 'NOT_FOUND', 'Conversation not found')

    await db.delete(aiConversations).where(eq(aiConversations.id, conversationId))
    return { success: true }
  },

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
        .values({ userId, workspaceId: resolvedWorkspaceId, title, projectId: data.scope === 'project' ? data.scopeId : null })
        .returning()
      if (!conv) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to create conversation')
      conversationId = conv.id
    } else {
      const conv = await db.query.aiConversations.findFirst({ where: eq(aiConversations.id, conversationId) })
      if (!conv || conv.userId !== userId) throw new AppError(404, 'NOT_FOUND', 'Conversation not found')
    }

    const previousMessages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conversationId),
      orderBy: (m, { asc }) => [asc(m.createdAt)],
    })

    const history = previousMessages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      content: msg.content,
    }))

    const systemPrompt = await buildSystemPrompt(data.scope, data.scopeId, userId)

    const userMessagePayload = {
      role: 'user',
      parts: [{ text: data.message }],
    }

    const tools = getAITools()
    const toolHandlers = getAIToolHandlers(data as ChatInput, userId)

    const startTime = Date.now()
    const stream = generateAIResponseStream(userMessagePayload as any, history as any, systemPrompt, tools, toolHandlers)
    
    let fullReplyText = ''
    const executedToolCalls: any[] = []
    let finalTokenUsage: any = null
    let finalModelUsed: any = null

    reply.raw.write(\`data: \${JSON.stringify({ type: 'init', conversationId })}\\n\\n\`)

    for await (const chunk of stream) {
      reply.raw.write(\`data: \${JSON.stringify(chunk)}\\n\\n\`)
      
      if (chunk.type === 'text') {
        fullReplyText += chunk.content
      } else if (chunk.type === 'tool_call') {
        executedToolCalls.push({ name: chunk.tool, args: chunk.args })
      } else if (chunk.type === 'done') {
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
}
`;

let topPartReplaced = topPart.replace(
  "import { eq, desc, and } from 'drizzle-orm'",
  "import { eq, desc, and } from 'drizzle-orm'"
).replace(
  "import { generateAIResponse } from '../../lib/gemini.js'",
  "import { generateAIResponse, generateAIResponseStream } from '../../lib/gemini.js'"
).replace(
  "import type { ChatInput } from './ai.schema.js'",
  "import type { ChatInput } from './ai.schema.js'\\nimport { getAITools, getAIToolHandlers } from './ai.tools.js'"
).replace(
  "import { tasksService } from '../tasks/tasks.service.js'\\nimport { SchemaType } from '@google/generative-ai'\\n",
  ""
).replace(
  "userId: number,",
  "_userId: number,"
);

fs.writeFileSync('src/modules/ai/ai.service.ts', topPartReplaced + aiServiceText, 'utf8');
console.log('ai.service.ts rewritten successfully');
