import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { activityFeed, notifications, projects, workspaceMembers } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import { workspacesService } from '../workspaces/workspaces.service.js'
import { projectsService } from '../projects/projects.service.js'
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
    await projectsService.checkProjectPermission(projectId, userId, ['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER', 'VIEWER'])

    return await db.query.activityFeed.findMany({
      where: eq(activityFeed.projectId, projectId),
      orderBy: [desc(activityFeed.createdAt)],
      limit: 100,
    })
  },

  async getWorkspaceNotifications(workspaceId: number, userId: number, isRead?: boolean) {
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    const conditions = [
      eq(notifications.workspaceId, workspaceId),
      eq(notifications.recipientUserId, userId),
    ]
    if (isRead !== undefined) {
      conditions.push(eq(notifications.isRead, isRead))
    }

    const list = await db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    })

    return list.map((n) => ({
      ...n,
      userId: n.recipientUserId,
    }))
  },

  async getWorkspaceUnreadCount(workspaceId: number, userId: number) {
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    const unreadList = await db.query.notifications.findMany({
      where: and(
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.recipientUserId, userId),
        eq(notifications.isRead, false)
      ),
      columns: { id: true },
    })

    return { count: unreadList.length }
  },

  /**
   * Creates a notification record and immediately pushes it to the target
   * user's connected sockets via Socket.IO.
   */
  async createAndEmitNotification(opts: {
    workspaceId: number
    recipientUserId: number
    actorUserId?: number | null
    type: 'mention' | 'task_assigned' | 'role_changed' | 'system'
    contextType?: 'chat' | 'project' | 'task' | null
    contextId?: number | null
    message: string
    link?: string | null
  }) {
    // RBAC: Verify recipient is actually a member of the workspace.
    // If not, silently ignore without leaking notification outside the workspace.
    const member = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, opts.workspaceId),
        eq(workspaceMembers.userId, opts.recipientUserId)
      ),
    })
    if (!member) {
      return null
    }

    const [notification] = await db
      .insert(notifications)
      .values({
        workspaceId: opts.workspaceId,
        recipientUserId: opts.recipientUserId,
        actorUserId: opts.actorUserId ?? null,
        type: opts.type,
        contextType: opts.contextType ?? null,
        contextId: opts.contextId ?? null,
        message: opts.message,
        link: opts.link ?? null,
      })
      .returning()

    if (notification) {
      // Re-verify recipient is still currently a member of workspaceId at the moment of emit.
      // Socket rooms are user-scoped (user:${userId}), not workspace-scoped, so without this check,
      // a user removed from the workspace could receive an emit in their personal room.
      const currentMember = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, opts.workspaceId),
          eq(workspaceMembers.userId, opts.recipientUserId)
        ),
      })
      if (currentMember) {
        const payload = {
          ...notification,
          notificationId: notification.id,
          userId: notification.recipientUserId,
          createdAt: notification.createdAt instanceof Date ? notification.createdAt.toISOString() : String(notification.createdAt),
        }
        await emitToUser(opts.recipientUserId, 'notification:new', payload as any, { workspaceId: opts.workspaceId })
      }
    }

    return notification
  },

  async markNotificationRead(workspaceId: number, notificationId: number, userId: number) {
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    const notification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, notificationId),
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.recipientUserId, userId)
      ),
    })
    if (!notification) throw new AppError(404, 'NOT_FOUND', 'Notification not found')

    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning()

    if (!updated) {
      throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to update notification')
    }

    return {
      ...updated,
      userId: updated.recipientUserId,
    }
  },

  async markAllNotificationsRead(workspaceId: number, userId: number) {
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.recipientUserId, userId),
        eq(notifications.isRead, false)
      ))

    return { success: true }
  },
}

