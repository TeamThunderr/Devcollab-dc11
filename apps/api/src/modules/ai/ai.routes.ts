import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  chatHandler,
  chatStreamHandler,
  getConversationsHandler,
  getMessagesHandler,
  deleteConversationHandler,
} from './ai.controller.js'
import {
  chatSchema,
  chatResponseSchema,
  conversationListSchema,
  messageListSchema,
} from './ai.schema.js'
import { requireAuth } from '../../middlewares/auth.js'

export const aiRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  // POST /api/ai/chat — Send a message, get a Gemini reply
  app.post(
    '/chat',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
          keyGenerator: (req: any) => req.user.id
        }
      },
      schema: {
        body: chatSchema,
        response: {
          200: chatResponseSchema,
        },
      },
    },
    chatHandler,
  )

  // POST /api/ai/chat/stream — Send a message, get a streaming Gemini reply
  app.post(
    '/chat/stream',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
          keyGenerator: (req: any) => req.user.id
        }
      },
      schema: {
        body: chatSchema,
      },
    },
    chatStreamHandler,
  )

  // GET /api/ai/conversations?workspaceId=1 — List user's conversations
  app.get(
    '/conversations',
    {
      schema: {
        querystring: z.object({ workspaceId: z.string() }),
        response: {
          200: conversationListSchema,
        },
      },
    },
    getConversationsHandler,
  )

  // GET /api/ai/conversations/:conversationId/messages — Get messages in a conversation
  app.get(
    '/conversations/:conversationId/messages',
    {
      schema: {
        params: z.object({ conversationId: z.string() }),
        response: {
          200: messageListSchema,
        },
      },
    },
    getMessagesHandler,
  )

  // DELETE /api/ai/conversations/:conversationId — Delete a conversation
  app.delete(
    '/conversations/:conversationId',
    {
      schema: {
        params: z.object({ conversationId: z.string() }),
        response: {
          204: z.undefined(),
        },
      },
    },
    deleteConversationHandler,
  )
}
