import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import {
  createSprintHandler,
  deleteSprintHandler,
  getSprintHandler,
  getSprintsHandler,
  updateSprintHandler,
} from './sprints.controller.js'
import {
  createSprintSchema,
  sprintListResponseSchema,
  sprintResponseSchema,
  updateSprintSchema,
} from './sprints.schema.js'
import { requireAuth } from '../../middlewares/auth.js'
import { z } from 'zod'

export const projectSprintsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  // Mounted under /projects/:projectId/sprints
  app.post(
    '/',
    {
      schema: {
        params: z.object({ projectId: z.string() }),
        body: createSprintSchema,
        response: {
          201: sprintResponseSchema,
        },
      },
    },
    createSprintHandler
  )

  app.get(
    '/',
    {
      schema: {
        params: z.object({ projectId: z.string() }),
        response: {
          200: sprintListResponseSchema,
        },
      },
    },
    getSprintsHandler
  )
}

export const singleSprintRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  // Mounted under /sprints/:sprintId
  app.get(
    '/:sprintId',
    {
      schema: {
        params: z.object({ sprintId: z.string() }),
        response: {
          200: sprintResponseSchema,
        },
      },
    },
    getSprintHandler
  )

  app.patch(
    '/:sprintId',
    {
      schema: {
        params: z.object({ sprintId: z.string() }),
        body: updateSprintSchema,
        response: {
          200: sprintResponseSchema,
        },
      },
    },
    updateSprintHandler
  )

  app.delete(
    '/:sprintId',
    {
      schema: {
        params: z.object({ sprintId: z.string() }),
        response: {
          204: z.null(),
        },
      },
    },
    deleteSprintHandler
  )
}
