import { and, eq, or, inArray } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { projects, projectMembers, taskComments, tasks, taskRelations, attachments, reactions } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import { workspacesService } from '../workspaces/workspaces.service.js'
import { projectsService } from '../projects/projects.service.js'
import { activityService } from '../activity/activity.service.js'
import { embeddingsService } from '../ai/embeddings.service.js'
import { emitToProject } from '../../socket/emit.js'
import type { CreateCommentInput, CreateTaskInput, UpdateTaskInput } from './tasks.schema.js'

export const tasksService = {
  async getProjectWorkspaceId(projectId: number) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })
    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found')
    return project.workspaceId
  },

  async createTask(projectId: number, userId: number, data: CreateTaskInput) {
    const { project } = await projectsService.checkProjectPermission(projectId, userId, ['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER'])
    const workspaceId = project.workspaceId

    if (data.assigneeId !== undefined && data.assigneeId !== null) {
      await projectsService.checkAssigneeRole(projectId, data.assigneeId)
    }

    const [task] = await db
      .insert(tasks)
      .values({
        projectId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId,
        sprintId: data.sprintId ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdBy: userId,
      })
      .returning()

    if (!task) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to create task')

    // Log to activity feed (fire-and-forget)
    activityService.logActivity({
      workspaceId,
      projectId,
      userId,
      actionType: 'created a task',
      metadata: { taskId: task.id, title: task.title },
    }).catch(() => {})

    // Generate and store embedding (fire-and-forget)
    embeddingsService.generateTaskEmbedding(task.title, task.description).then((embedding) => {
      if (embedding.length > 0) {
        db.update(tasks).set({ embedding }).where(eq(tasks.id, task.id)).execute().catch(console.error)
      }
    }).catch(console.error)

    // Emit real-time event to the project room
    emitToProject(projectId, 'task:created', {
      taskId: task.id,
      projectId,
      workspaceId,
      data: task as unknown as Record<string, unknown>,
    })

    if (data.assigneeId && data.assigneeId !== userId) {
      activityService.createAndEmitNotification({
        workspaceId,
        recipientUserId: data.assigneeId,
        actorUserId: userId,
        type: 'task_assigned',
        contextType: 'task',
        contextId: task.id,
        message: `You were assigned to task: "${task.title}"`,
        link: `/projects/${projectId}?taskId=${task.id}`,
      }).catch(() => {})
    }

    return task
  },

  async getTasks(projectId: number, userId: number) {
    await projectsService.checkProjectPermission(projectId, userId, ['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER', 'VIEWER'])

    return await db.query.tasks.findMany({
      where: eq(tasks.projectId, projectId),
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
    })
  },

  async getTask(taskId: number, userId: number) {
    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')

    await projectsService.checkProjectPermission(task.projectId, userId, ['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER', 'VIEWER'])

    return task
  },

  async updateTask(taskId: number, userId: number, data: UpdateTaskInput) {
    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')

    const { project } = await projectsService.checkProjectPermission(task.projectId, userId, ['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER'])
    const workspaceId = project.workspaceId

    if (data.assigneeId !== undefined && data.assigneeId !== null) {
      await projectsService.checkAssigneeRole(task.projectId, data.assigneeId)
    }

    const updateData: any = { ...data }
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)
    if (data.sprintId !== undefined) updateData.sprintId = data.sprintId
    updateData.updatedAt = new Date()

    const updatedTask = await db.transaction(async (tx) => {
      if (data.status === 'DONE') {
        const blockingRelations = await tx
          .select()
          .from(taskRelations)
          .where(
            or(
              and(eq(taskRelations.taskId, taskId), eq(taskRelations.relationType, 'IS_BLOCKED_BY')),
              and(eq(taskRelations.relatedTaskId, taskId), eq(taskRelations.relationType, 'BLOCKS'))
            )
          )

        const blockingTaskIds = Array.from(new Set(
          blockingRelations.map(rel => rel.relationType === 'IS_BLOCKED_BY' ? rel.relatedTaskId : rel.taskId)
        )).sort((a, b) => a - b)

        for (const blockingTaskId of blockingTaskIds) {
          const [blockingTask] = await tx
            .select()
            .from(tasks)
            .where(eq(tasks.id, blockingTaskId))
            .for('update')

          if (blockingTask && blockingTask.status !== 'DONE') {
            throw new AppError(400, 'DEPENDENCY_VIOLATION', `Cannot complete task: blocked by incomplete dependency "${blockingTask.title}"`)
          }
        }
      }

      const [updated] = await tx
        .update(tasks)
        .set(updateData)
        .where(eq(tasks.id, taskId))
        .returning()

      return updated
    })

    if (!updatedTask) throw new AppError(404, 'NOT_FOUND', 'Task not found')

    activityService.logActivity({
      workspaceId,
      projectId: task.projectId,
      userId,
      actionType: 'updated a task',
      metadata: { taskId, changes: data },
    }).catch(() => {})

    // Update embedding if title or description changed (fire-and-forget)
    if (data.title !== undefined || data.description !== undefined) {
      embeddingsService.generateTaskEmbedding(updatedTask.title, updatedTask.description).then((embedding) => {
        if (embedding.length > 0) {
          db.update(tasks).set({ embedding }).where(eq(tasks.id, taskId)).execute().catch(console.error)
        }
      }).catch(console.error)
    }

    // Emit real-time event
    emitToProject(task.projectId, 'task:updated', {
      taskId,
      projectId: task.projectId,
      workspaceId,
      data: updatedTask as unknown as Record<string, unknown>,
    })

    if (data.assigneeId && data.assigneeId !== task.assigneeId && data.assigneeId !== userId) {
      activityService.createAndEmitNotification({
        workspaceId,
        recipientUserId: data.assigneeId,
        actorUserId: userId,
        type: 'task_assigned',
        contextType: 'task',
        contextId: taskId,
        message: `You were assigned to task: "${task.title}"`,
        link: `/projects/${task.projectId}?taskId=${taskId}`,
      }).catch(() => {})
    }

    return updatedTask
  },

  async deleteTask(taskId: number, userId: number) {
    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')

    const { project, role } = await projectsService.checkProjectPermission(task.projectId, userId, ['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER'])
    
    if (role !== 'OWNER' && role !== 'ADMIN' && role !== 'TEAM_LEAD') {
      if (task.createdBy !== userId && task.assigneeId !== userId) {
        throw new AppError(403, 'FORBIDDEN', 'You can only delete tasks that you created or are assigned to.')
      }
    }

    await db.transaction(async (tx) => {
      // Clean up polymorphic attachments for the task and its comments
      const comments = await tx.select({ id: taskComments.id }).from(taskComments).where(eq(taskComments.taskId, taskId))
      const commentIds = comments.map((c) => c.id)

      await tx.delete(attachments).where(and(eq(attachments.entityType, 'TASK'), eq(attachments.entityId, taskId)))
      if (commentIds.length > 0) {
        await tx.delete(attachments).where(and(eq(attachments.entityType, 'COMMENT'), inArray(attachments.entityId, commentIds)))
        await tx.delete(reactions).where(and(eq(reactions.entityType, 'COMMENT'), inArray(reactions.entityId, commentIds)))
      }

      const [deletedTask] = await tx.delete(tasks).where(eq(tasks.id, taskId)).returning()
      if (!deletedTask) throw new AppError(404, 'NOT_FOUND', 'Task not found')
    })

    emitToProject(task.projectId, 'task:deleted', { taskId, projectId: task.projectId })

    return { success: true }
  },

  async addComment(taskId: number, userId: number, data: CreateCommentInput) {
    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')

    const workspaceId = await this.getProjectWorkspaceId(task.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    const [comment] = await db
      .insert(taskComments)
      .values({
        taskId,
        userId,
        content: data.content,
      })
      .returning()

    if (!comment) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to add comment')

    // Emit real-time comment event
    emitToProject(task.projectId, 'comment:added', {
      commentId: comment.id,
      taskId,
      projectId: task.projectId,
      userId,
      content: comment.content,
    })

    return comment
  },

  async getComments(taskId: number, userId: number) {
    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')

    const workspaceId = await this.getProjectWorkspaceId(task.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    return await db.query.taskComments.findMany({
      where: eq(taskComments.taskId, taskId),
      orderBy: (comments, { asc }) => [asc(comments.createdAt)],
    })
  },

  async deleteComment(taskId: number, commentId: number, userId: number) {
    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')

    const comment = await db.query.taskComments.findFirst({
      where: and(eq(taskComments.id, commentId), eq(taskComments.taskId, taskId)),
    })
    if (!comment) throw new AppError(404, 'NOT_FOUND', 'Comment not found')

    const workspaceId = await this.getProjectWorkspaceId(task.projectId)
    
    // Check permission: Must be OWNER/ADMIN, OR the author of the comment
    const member = await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])
    
    if (member.role !== 'OWNER' && member.role !== 'ADMIN' && comment.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to delete comment')
    }

    await db.transaction(async (tx) => {
      await tx.delete(attachments).where(and(eq(attachments.entityType, 'COMMENT'), eq(attachments.entityId, commentId)))
      await tx.delete(reactions).where(and(eq(reactions.entityType, 'COMMENT'), eq(reactions.entityId, commentId)))
      await tx.delete(taskComments).where(eq(taskComments.id, commentId))
    })

    return { success: true }
  },
}
