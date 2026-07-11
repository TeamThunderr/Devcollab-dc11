import { eq, and, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  aiConversations,
  aiMessages,
  tasks,
  projects,
  workspaceMembers,
  users,
  codeSnippets,
  docs,
} from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import { generateAIResponse, generateAIResponseStream } from '../../lib/gemini.js'
import { workspacesService } from '../workspaces/workspaces.service.js'
import type { ChatInput } from './ai.schema.js'
import { getAITools, getAIToolHandlers } from './ai.tools.js'
import { embeddingsService } from './embeddings.service.js'

async function buildSystemPrompt(
  scope: 'workspace' | 'project',
  scopeId: number,
  _userId: number,
  latestQuery: string = '',
): Promise<string> {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  let contextBlock = ''

  if (scope === 'workspace') {
    // Fetch workspace-level context: all projects + members
    const [allProjects, members] = await Promise.all([
      db.query.projects.findMany({ where: eq(projects.workspaceId, scopeId) }),
      db
        .select({ id: users.id, name: users.name, email: users.email, role: workspaceMembers.role })
        .from(workspaceMembers)
        .innerJoin(users, eq(users.id, workspaceMembers.userId))
        .where(eq(workspaceMembers.workspaceId, scopeId)),
    ])

    // Fetch tasks for all projects
    const projectIds = allProjects.map((p) => p.id)
    const allTasks = projectIds.length
      ? await db.query.tasks.findMany({
          where: (t, { inArray }) => inArray(t.projectId, projectIds),
          orderBy: (t, { desc }) => [desc(t.createdAt)],
          limit: 50,
        })
      : []

    contextBlock = `
WORKSPACE CONTEXT
=================
Date: ${today}

Projects (${allProjects.length}):
${allProjects.map((p) => `- ${p.name}${p.description ? ': ' + p.description : ''}`).join('\n') || 'No projects yet.'}

Members (${members.length}):
${members.map((m) => `- ID: ${m.id} | ${m.name} <${m.email}> [${m.role}]`).join('\n') || 'No members yet.'}

Recent Tasks (${allTasks.length}):
${allTasks.map((t) => `- [${t.status}][${t.priority}] ${t.title}${t.assigneeId ? ' (assigned)' : ''}`).join('\n') || 'No tasks yet.'}
`
  } else {
    // Fetch project-level context: tasks, members, snippets, docs
    const project = await db.query.projects.findFirst({ where: eq(projects.id, scopeId) })
    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found')

    const queryEmbedding = latestQuery ? await embeddingsService.generateEmbedding(latestQuery) : []
    const hasEmbedding = queryEmbedding.length > 0
    const queryVector = JSON.stringify(queryEmbedding)

    const [projectTasks, snippets, projectDocs, members] = await Promise.all([
      db.query.tasks.findMany({
        where: eq(tasks.projectId, scopeId),
        orderBy: (t, { asc, desc }) => hasEmbedding ? [asc(sql`${t.embedding} <=> ${queryVector}`)] : [desc(t.updatedAt)],
        limit: 10,
      }),
      db.query.codeSnippets.findMany({
        where: eq(codeSnippets.projectId, scopeId),
        orderBy: (s, { asc, desc }) => hasEmbedding ? [asc(sql`${s.embedding} <=> ${queryVector}`)] : [desc(s.createdAt)],
        limit: 5,
      }),
      db.query.docs.findMany({
        where: eq(docs.projectId, scopeId),
        orderBy: (d, { asc, desc }) => hasEmbedding ? [asc(sql`${d.embedding} <=> ${queryVector}`)] : [desc(d.updatedAt)],
        limit: 5,
      }),
      db
        .select({ id: users.id, name: users.name, email: users.email, role: workspaceMembers.role })
        .from(workspaceMembers)
        .innerJoin(users, eq(users.id, workspaceMembers.userId))
        .where(eq(workspaceMembers.workspaceId, project.workspaceId)),
    ])

    contextBlock = `
PROJECT CONTEXT: ${project.name}
${'='.repeat(project.name.length + 17)}
Date: ${today}
Description: ${project.description || 'No description.'}

Tasks (${projectTasks.length}):
${projectTasks.map((t) => `- [${t.status}][${t.priority}] ${t.title}${t.dueDate ? ' due:' + t.dueDate.toDateString() : ''}`).join('\n') || 'No tasks yet.'}

Members (${members.length}):
${members.map((m) => `- ID: ${m.id} | ${m.name} <${m.email}> [${m.role}]`).join('\n') || 'No members yet.'}

Code Snippets (${snippets.length}):
${snippets.map((s) => `- ${s.title} [${s.language}]${s.description ? ': ' + s.description : ''}`).join('\n') || 'No snippets yet.'}

Wiki Docs (${projectDocs.length}):
${projectDocs.map((d) => `- ${d.title}`).join('\n') || 'No docs yet.'}
`
  }

  return `You are DevCollab AI, an intelligent assistant deeply integrated into the DevCollab project management platform.
You help developers and teams understand their workspace, manage tasks, find information, and make better decisions.

${contextBlock}

GUIDELINES:
- Always ground your answers in the context data above.
- If asked about tasks, members, or data not in the context, say so honestly.
- Format your responses clearly using markdown (bold, bullet points, code blocks).
- Be concise but thorough.
- Never make up task details, names, or statuses that aren't in the context.
`
}

// ── Service ──────────────────────────────────────────────────────────────────

export const aiService = {
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
    const systemPrompt = await buildSystemPrompt(data.scope, data.scopeId, userId, data.message)

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
      ? `${data.message}\n\n[Attached File: ${data.attachment.name}]` 
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

  async *chatStream(userId: number, data: ChatInput): AsyncGenerator<string, void, unknown> {
    try {
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

      const systemPrompt = await buildSystemPrompt(data.scope, data.scopeId, userId, data.message)

      const userMessagePayload = data.attachment 
        ? [
            { text: data.message },
            { inlineData: { data: data.attachment.data.split(',')[1], mimeType: data.attachment.type } }
          ]
        : data.message

      const tools = getAITools()
      const toolHandlers = getAIToolHandlers(data as ChatInput, userId)

      const startTime = Date.now()
      const stream = generateAIResponseStream(userMessagePayload as any, history as any, systemPrompt, tools, toolHandlers)
      
      let fullReplyText = ''
      const executedToolCalls: any[] = []
      let finalTokenUsage: any = null
      let finalModelUsed: any = null
      yield `data: ${JSON.stringify({ type: 'init', conversationId })}\n\n`

      for await (const chunk of stream) {
        yield `data: ${JSON.stringify(chunk)}\n\n`
        
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
    } catch (err: any) {
      yield `data: ${JSON.stringify({ type: 'error', message: err.message || 'Stream error' })}\n\n`
    }
  },
}
