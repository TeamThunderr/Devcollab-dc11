import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth.js'
import {
  createDocHandler,
  deleteDocHandler,
  getDocHandler,
  getDocsHandler,
  getVersionsHandler,
  updateDocHandler,
} from './docs.controller.js'
import {
  createDocSchema,
  docListResponseSchema,
  docResponseSchema,
  docVersionListResponseSchema,
  updateDocSchema,
} from './docs.schema.js'

// Mounted under /api/projects/:projectId/docs
export const projectDocsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.post('/', {
    schema: {
      params: z.object({ projectId: z.string() }),
      body: createDocSchema,
      response: { 201: docResponseSchema },
    },
  }, createDocHandler)

  app.get('/', {
    schema: {
      params: z.object({ projectId: z.string() }),
      response: { 200: docListResponseSchema },
    },
  }, getDocsHandler)
}

// Mounted under /api/docs/:docId
export const singleDocRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.get('/', {
    schema: {
      params: z.object({ docId: z.string() }),
      response: { 200: docResponseSchema },
    },
  }, getDocHandler)

  app.patch('/', {
    schema: {
      params: z.object({ docId: z.string() }),
      body: updateDocSchema,
      response: { 200: docResponseSchema },
    },
  }, updateDocHandler)

  app.delete('/', {
    schema: {
      params: z.object({ docId: z.string() }),
      response: { 204: z.undefined() },
    },
  }, deleteDocHandler)

  // Version history — snapshot on every content save
  app.get('/versions', {
    schema: {
      params: z.object({ docId: z.string() }),
      response: { 200: docVersionListResponseSchema },
    },
  }, getVersionsHandler)
}
