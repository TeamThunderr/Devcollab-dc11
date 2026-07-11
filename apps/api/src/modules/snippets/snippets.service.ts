import { eq, and } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { codeSnippets, projects, attachments } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import { workspacesService } from '../workspaces/workspaces.service.js'
import { embeddingsService } from '../ai/embeddings.service.js'
import { emitToProject } from '../../socket/emit.js'
import { activityService } from '../activity/activity.service.js'

import type { CreateSnippetInput, UpdateSnippetInput } from './snippets.schema.js'

export const snippetsService = {
  async getProjectWorkspaceId(projectId: number) {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found')
    return project.workspaceId
  },

  async createSnippet(projectId: number, userId: number, data: CreateSnippetInput) {
    const workspaceId = await this.getProjectWorkspaceId(projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER'])

    const [snippet] = await db
      .insert(codeSnippets)
      .values({
        projectId,
        title: data.title,
        description: data.description ?? null,
        language: data.language,
        code: data.code,
        tags: data.tags ?? null,
        createdBy: userId,
      })
      .returning()

    if (!snippet) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to create snippet')

    // Generate and store embedding (fire-and-forget)
    embeddingsService.generateSnippetEmbedding(snippet.title, snippet.language, snippet.description, snippet.code).then((embedding) => {
      if (embedding.length > 0) {
        db.update(codeSnippets).set({ embedding }).where(eq(codeSnippets.id, snippet.id)).execute().catch(console.error)
      }
    }).catch(console.error)

    // Emit real-time event
    emitToProject(projectId, 'snippet:created', {
      snippetId: snippet.id,
      projectId,
      workspaceId,
      data: snippet as unknown as Record<string, unknown>,
    })


    activityService.logActivity({
      workspaceId,
      projectId,
      userId,
      actionType: 'created a code snippet',
      metadata: { snippetId: snippet.id, title: snippet.title },
    }).catch(() => {})


    return snippet
  },

  async getSnippets(projectId: number, userId: number) {
    const workspaceId = await this.getProjectWorkspaceId(projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    return await db.query.codeSnippets.findMany({
      where: eq(codeSnippets.projectId, projectId),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    })
  },

  async getSnippet(snippetId: number, userId: number) {
    const snippet = await db.query.codeSnippets.findFirst({
      where: eq(codeSnippets.id, snippetId),
    })
    if (!snippet) throw new AppError(404, 'NOT_FOUND', 'Snippet not found')

    const workspaceId = await this.getProjectWorkspaceId(snippet.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    return snippet
  },

  async updateSnippet(snippetId: number, userId: number, data: UpdateSnippetInput) {
    const snippet = await db.query.codeSnippets.findFirst({
      where: eq(codeSnippets.id, snippetId),
    })
    if (!snippet) throw new AppError(404, 'NOT_FOUND', 'Snippet not found')

    const workspaceId = await this.getProjectWorkspaceId(snippet.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER'])

    const [updated] = await db
      .update(codeSnippets)
      .set({
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.language && { language: data.language }),
        ...(data.code && { code: data.code }),
        ...(data.tags !== undefined && { tags: data.tags }),
        updatedAt: new Date(),
      })
      .where(eq(codeSnippets.id, snippetId))
      .returning()

    if (!updated) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to update snippet')

    // Update embedding if title, language, description, or code changed (fire-and-forget)
    if (updated && (data.title !== undefined || data.language !== undefined || data.description !== undefined || data.code !== undefined)) {
      embeddingsService.generateSnippetEmbedding(updated.title, updated.language, updated.description, updated.code).then((embedding) => {
        if (embedding.length > 0) {
          db.update(codeSnippets).set({ embedding }).where(eq(codeSnippets.id, snippetId)).execute().catch(console.error)
        }
      }).catch(console.error)
    }

    // Emit real-time event
    emitToProject(updated.projectId, 'snippet:updated', {
      snippetId,
      projectId: updated.projectId,
      workspaceId,
      data: updated as unknown as Record<string, unknown>,
    })

    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Snippet not found')

    activityService.logActivity({
      workspaceId,
      projectId: snippet.projectId,
      userId,
      actionType: 'updated a code snippet',
      metadata: { snippetId, title: updated.title },
    }).catch(() => {})


    return updated
  },

  async deleteSnippet(snippetId: number, userId: number) {
    const snippet = await db.query.codeSnippets.findFirst({
      where: eq(codeSnippets.id, snippetId),
    })
    if (!snippet) throw new AppError(404, 'NOT_FOUND', 'Snippet not found')

    const workspaceId = await this.getProjectWorkspaceId(snippet.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER'])

    await db.transaction(async (tx) => {
      await tx.delete(attachments).where(and(eq(attachments.entityType, 'SNIPPET'), eq(attachments.entityId, snippetId)))
      await tx.delete(codeSnippets).where(eq(codeSnippets.id, snippetId))

    // Emit real-time event
    emitToProject(snippet.projectId, 'snippet:deleted', { snippetId, projectId: snippet.projectId })

    })


    return { success: true }
  },
}
