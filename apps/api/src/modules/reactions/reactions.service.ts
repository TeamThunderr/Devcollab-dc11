import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { projects, reactions, taskComments, tasks } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import { workspacesService } from '../workspaces/workspaces.service.js'
import type { AddReactionInput } from './reactions.schema.js'

export const reactionsService = {
  async getProjectWorkspaceId(projectId: number) {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found')
    return project.workspaceId
  },

  async getCommentProjectId(commentId: number) {
    const comment = await db.query.taskComments.findFirst({ where: eq(taskComments.id, commentId) })
    if (!comment) throw new AppError(404, 'NOT_FOUND', 'Comment not found')

    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, comment.taskId) })
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')

    return task.projectId
  },

  /**
   * Toggles a reaction. The reactions table is polymorphic (entityType + entityId).
   * For comment reactions, entityType = 'COMMENT', entityId = commentId.
   */
  async toggleReaction(commentId: number, userId: number, data: AddReactionInput) {
    const projectId = await this.getCommentProjectId(commentId)
    const workspaceId = await this.getProjectWorkspaceId(projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    const existing = await db.query.reactions.findFirst({
      where: and(
        eq(reactions.entityType, 'COMMENT'),
        eq(reactions.entityId, commentId),
        eq(reactions.userId, userId),
        eq(reactions.emoji, data.emoji)
      ),
    })

    if (existing) {
      await db.delete(reactions).where(eq(reactions.id, existing.id))
      return { action: 'removed', emoji: data.emoji }
    }

    const [reaction] = await db
      .insert(reactions)
      .values({ entityType: 'COMMENT', entityId: commentId, userId, emoji: data.emoji })
      .returning()

    if (!reaction) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to add reaction')
    return { action: 'added', reaction }
  },

  async getReactions(commentId: number, userId: number) {
    const projectId = await this.getCommentProjectId(commentId)
    const workspaceId = await this.getProjectWorkspaceId(projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    return await db.query.reactions.findMany({
      where: and(eq(reactions.entityType, 'COMMENT'), eq(reactions.entityId, commentId)),
    })
  },
}
