import type { FastifyReply, FastifyRequest } from 'fastify'
import { activityService } from './activity.service.js'
import { db } from '../../db/client.js'
import { eq, and } from 'drizzle-orm'
import { notifications, workspaceMembers } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'

export const getWorkspaceActivityHandler = async (
  request: FastifyRequest<{ Params: { workspaceId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.workspaceId, 10)
  return await activityService.getWorkspaceActivity(workspaceId, userId)
}

export const getProjectActivityHandler = async (
  request: FastifyRequest<{ Params: { projectId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.projectId, 10)
  return await activityService.getProjectActivity(projectId, userId)
}

export const getWorkspaceNotificationsHandler = async (
  request: FastifyRequest<{ Params: { workspaceId: string }; Querystring: { is_read?: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.workspaceId, 10)
  const isRead = request.query.is_read !== undefined ? request.query.is_read === 'true' : undefined
  return await activityService.getWorkspaceNotifications(workspaceId, userId, isRead)
}

export const getWorkspaceUnreadCountHandler = async (
  request: FastifyRequest<{ Params: { workspaceId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.workspaceId, 10)
  return await activityService.getWorkspaceUnreadCount(workspaceId, userId)
}

export const markWorkspaceNotificationReadHandler = async (
  request: FastifyRequest<{ Params: { workspaceId: string; id?: string; notificationId?: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.workspaceId, 10)
  const notificationId = parseInt(request.params.id || request.params.notificationId || '0', 10)
  return await activityService.markNotificationRead(workspaceId, notificationId, userId)
}

export const markAllWorkspaceNotificationsReadHandler = async (
  request: FastifyRequest<{ Params: { workspaceId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.workspaceId, 10)
  return await activityService.markAllNotificationsRead(workspaceId, userId)
}

