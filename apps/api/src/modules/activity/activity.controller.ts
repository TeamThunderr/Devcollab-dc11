import type { FastifyReply, FastifyRequest } from 'fastify'
import { activityService } from './activity.service.js'

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

export const getMyNotificationsHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  return await activityService.getMyNotifications(userId)
}

export const markNotificationReadHandler = async (
  request: FastifyRequest<{ Params: { notificationId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const notificationId = parseInt(request.params.notificationId, 10)
  return await activityService.markNotificationRead(notificationId, userId)
}

export const markAllNotificationsReadHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  return await activityService.markAllNotificationsRead(userId)
}
