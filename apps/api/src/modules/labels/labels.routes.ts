import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth.js'
import {
  attachLabelHandler,
  createLabelHandler,
  deleteLabelHandler,
  detachLabelHandler,
  getLabelsHandler,
} from './labels.controller.js'
import {
  createLabelSchema,
  labelListResponseSchema,
  labelResponseSchema,
  taskLabelResponseSchema,
} from './labels.schema.js'

// Mounted under /api/projects/:projectId/labels
export const projectLabelsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.post('/', {
    schema: {
      params: z.object({ projectId: z.string() }),
      body: createLabelSchema,
      response: { 201: labelResponseSchema },
    },
  }, createLabelHandler)

  app.get('/', {
    schema: {
      params: z.object({ projectId: z.string() }),
      response: { 200: labelListResponseSchema },
    },
  }, getLabelsHandler)
}

// Mounted under /api/labels/:labelId
export const singleLabelRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.delete('/', {
    schema: {
      params: z.object({ labelId: z.string() }),
      response: { 204: z.undefined() },
    },
  }, deleteLabelHandler)
}

// Mounted under /api/tasks/:taskId/labels
export const taskLabelsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.post('/:labelId', {
    schema: {
      params: z.object({ taskId: z.string(), labelId: z.string() }),
      response: { 201: taskLabelResponseSchema },
    },
  }, attachLabelHandler)

  app.delete('/:labelId', {
    schema: {
      params: z.object({ taskId: z.string(), labelId: z.string() }),
      response: { 204: z.undefined() },
    },
  }, detachLabelHandler)
}
