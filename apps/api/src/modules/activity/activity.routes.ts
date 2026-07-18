import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth.js'
import {
  getProjectActivityHandler,
  getWorkspaceActivityHandler,
  getWorkspaceNotificationsHandler,
  getWorkspaceUnreadCountHandler,
  markAllWorkspaceNotificationsReadHandler,
  markWorkspaceNotificationReadHandler,
} from './activity.controller.js'
import {
  activityFeedListSchema,
  notificationListSchema,
  notificationSchema,
} from './activity.schema.js'

// Workspace activity — GET /api/workspaces/:workspaceId/activity
export const workspaceActivityRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.get('/', {
    schema: {
      params: z.object({ workspaceId: z.string() }),
      response: { 200: activityFeedListSchema },
    },
  }, getWorkspaceActivityHandler)
}

// Project activity — GET /api/projects/:projectId/activity
export const projectActivityRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.get('/', {
    schema: {
      params: z.object({ projectId: z.string() }),
      response: { 200: activityFeedListSchema },
    },
  }, getProjectActivityHandler)
}

// Workspace notifications — /api/workspaces/:workspaceId/notifications
export const workspaceNotificationsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.get('/', {
    schema: {
      params: z.object({ workspaceId: z.string() }),
      querystring: z.object({ is_read: z.string().optional() }),
      response: { 200: notificationListSchema },
    },
  }, getWorkspaceNotificationsHandler)

  app.get('/unread-count', {
    schema: {
      params: z.object({ workspaceId: z.string() }),
      response: { 200: z.object({ count: z.number() }) },
    },
  }, getWorkspaceUnreadCountHandler)

  app.patch('/:notificationId/read', {
    schema: {
      params: z.object({ workspaceId: z.string(), notificationId: z.string() }),
      response: { 200: notificationSchema },
    },
  }, markWorkspaceNotificationReadHandler)

  app.patch('/mark-all-read', {
    schema: {
      params: z.object({ workspaceId: z.string() }),
      response: { 200: z.object({ success: z.boolean() }) },
    },
  }, markAllWorkspaceNotificationsReadHandler)

  app.patch('/read-all', {
    schema: {
      params: z.object({ workspaceId: z.string() }),
      response: { 200: z.object({ success: z.boolean() }) },
    },
  }, markAllWorkspaceNotificationsReadHandler)
}

