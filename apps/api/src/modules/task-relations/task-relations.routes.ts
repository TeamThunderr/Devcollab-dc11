import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth.js'
import {
  addRelationHandler,
  getRelationsHandler,
  removeRelationHandler,
} from './task-relations.controller.js'
import {
  addTaskRelationSchema,
  taskRelationListResponseSchema,
  taskRelationResponseSchema,
} from './task-relations.schema.js'

// Mounted under /api/tasks/:taskId/relations
export const taskRelationsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.post('/', {
    schema: {
      params: z.object({ taskId: z.string() }),
      body: addTaskRelationSchema,
      response: { 201: taskRelationResponseSchema },
    },
  }, addRelationHandler)

  app.get('/', {
    schema: {
      params: z.object({ taskId: z.string() }),
      response: { 200: taskRelationListResponseSchema },
    },
  }, getRelationsHandler)

  app.delete('/:relationId', {
    schema: {
      params: z.object({ taskId: z.string(), relationId: z.string() }),
      response: { 204: z.undefined() },
    },
  }, removeRelationHandler)
}
