import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth.js'
import {
  getReactionsHandler,
  toggleReactionHandler,
} from './reactions.controller.js'
import {
  addReactionSchema,
  reactionListResponseSchema,
} from './reactions.schema.js'

// Mounted under /api/comments/:commentId/reactions
export const commentReactionsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  // GET — list all reactions on a comment
  app.get('/', {
    schema: {
      params: z.object({ commentId: z.string() }),
      response: { 200: reactionListResponseSchema },
    },
  }, getReactionsHandler)

  // POST — toggle a reaction (add if not present, remove if already reacted)
  app.post('/', {
    schema: {
      params: z.object({ commentId: z.string() }),
      body: addReactionSchema,
      response: { 200: z.object({ action: z.string(), emoji: z.string().optional(), reaction: z.any().optional() }) },
    },
  }, toggleReactionHandler)
}
