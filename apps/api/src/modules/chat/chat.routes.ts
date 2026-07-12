import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import {
  createProjectChatHandler,
  getProjectChatHandler,
} from './chat.controller.js'
import {
  chatMessageListResponseSchema,
  chatMessageResponseSchema,
  createChatMessageSchema,
  getChatMessagesQuerySchema,
} from './chat.schema.js'
import { requireAuth } from '../../middlewares/auth.js'
import { z } from 'zod'

export const projectChatRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  // Routes mounted under /projects/:projectId/chat
  app.get(
    '/',
    {
      schema: {
        params: z.object({ projectId: z.string() }),
        querystring: getChatMessagesQuerySchema,
        response: {
          200: chatMessageListResponseSchema,
        },
      },
    },
    getProjectChatHandler
  )

  app.post(
    '/',
    {
      schema: {
        params: z.object({ projectId: z.string() }),
        body: createChatMessageSchema,
        response: {
          201: chatMessageResponseSchema,
        },
      },
    },
    createProjectChatHandler
  )
}
