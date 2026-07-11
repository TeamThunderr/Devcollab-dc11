import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { activityFeed, notifications, projects } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import { workspacesService } from '../workspaces/workspaces.service.js'
import { emitToUser } from '../../socket/emit.js'

export const activityService = {
  /**
   * Called internally by other services to log an action.
   * Not exposed as an API endpoint directly.
   */
  async logActivity(opts: {
    workspaceId: number
    projectId?: number | null
    userId: number
    actionType: string
    metadata?: Record<string, unknown>
  }) {
    await db.insert(activityFeed).values({
      workspaceId: opts.workspaceId,
      projectId: opts.projectId ?? null,
      userId: opts.userId,
      actionType: opts.actionType,
      metadata: opts.metadata ?? null,
    })
  },

  async getWorkspaceActivity(workspaceId: number, userId: number) {
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    return await db.query.activityFeed.findMany({
      where: eq(activityFeed.workspaceId, workspaceId),
      orderBy: [desc(activityFeed.createdAt)],
      limit: 100,
    })
  },

  async getProjectActivity(projectId: number, userId: number) {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found')

    await workspacesService.checkPermission(project.workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    return await db.query.activityFeed.findMany({
      where: eq(activityFeed.projectId, projectId),
      orderBy: [desc(activityFeed.createdAt)],
      limit: 100,
    })
  },

  async getMyNotifications(userId: number) {
    return await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    })
  },

  /**
   * Creates a notification record and immediately pushes it to the target
   * user's connected sockets via Socket.IO.
   */
  async createAndEmitNotification(opts: {
    userId: number
    type: 'MENTION' | 'ASSIGNMENT' | 'SYSTEM'
    message: string
  }) {
    const [notification] = await db
      .insert(notifications)
      .values({ userId: opts.userId, type: opts.type, message: opts.message })
      .returning()

    if (notification) {
      // Push to the target user's socket(s) in real-time
      emitToUser(opts.userId, 'notification:new', {
        notificationId: notification.id,
        type: opts.type,
        message: opts.message,
      })
    }

    return notification
  },

  async markNotificationRead(notificationId: number, userId: number) {
    const notification = await db.query.notifications.findFirst({
      where: and(eq(notifications.id, notificationId), eq(notifications.userId, userId)),
    })
    if (!notification) throw new AppError(404, 'NOT_FOUND', 'Notification not found')

    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning()

    return updated
  },

  async markAllNotificationsRead(userId: number) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))

    return { success: true }
  },
}
