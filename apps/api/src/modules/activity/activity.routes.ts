import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth.js'
import {
  getMyNotificationsHandler,
  getProjectActivityHandler,
  getWorkspaceActivityHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
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

// Notifications — /api/me/notifications
export const notificationsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.get('/', {
    schema: { response: { 200: notificationListSchema } },
  }, getMyNotificationsHandler)

  app.patch('/:notificationId/read', {
    schema: {
      params: z.object({ notificationId: z.string() }),
      response: { 200: notificationSchema },
    },
  }, markNotificationReadHandler)

  app.patch('/read-all', {
    schema: {
      response: { 200: z.object({ success: z.boolean() }) },
    },
  }, markAllNotificationsReadHandler)
}
