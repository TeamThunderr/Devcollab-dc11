import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth.js'
import {
  createSnippetHandler,
  deleteSnippetHandler,
  getSnippetHandler,
  getSnippetsHandler,
  updateSnippetHandler,
} from './snippets.controller.js'
import {
  createSnippetSchema,
  snippetListResponseSchema,
  snippetResponseSchema,
  updateSnippetSchema,
} from './snippets.schema.js'

// Mounted under /api/projects/:projectId/snippets
export const projectSnippetsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.post('/', {
    schema: {
      params: z.object({ projectId: z.string() }),
      body: createSnippetSchema,
      response: { 201: snippetResponseSchema },
    },
  }, createSnippetHandler)

  app.get('/', {
    schema: {
      params: z.object({ projectId: z.string() }),
      response: { 200: snippetListResponseSchema },
    },
  }, getSnippetsHandler)
}

// Mounted under /api/snippets/:snippetId
export const singleSnippetRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.get('/', {
    schema: {
      params: z.object({ snippetId: z.string() }),
      response: { 200: snippetResponseSchema },
    },
  }, getSnippetHandler)

  app.patch('/', {
    schema: {
      params: z.object({ snippetId: z.string() }),
      body: updateSnippetSchema,
      response: { 200: snippetResponseSchema },
    },
  }, updateSnippetHandler)

  app.delete('/', {
    schema: {
      params: z.object({ snippetId: z.string() }),
      response: { 204: z.undefined() },
    },
  }, deleteSnippetHandler)
}
