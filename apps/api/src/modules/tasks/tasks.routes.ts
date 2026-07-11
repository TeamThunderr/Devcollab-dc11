import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import {
  addCommentHandler,
  createTaskHandler,
  deleteCommentHandler,
  deleteTaskHandler,
  getCommentsHandler,
  getTaskHandler,
  getTasksHandler,
  updateTaskHandler,
} from './tasks.controller.js'
import {
  commentListResponseSchema,
  commentResponseSchema,
  createCommentSchema,
  createTaskSchema,
  taskListResponseSchema,
  taskResponseSchema,
  updateTaskSchema,
} from './tasks.schema.js'
import { requireAuth } from '../../middlewares/auth.js'
import { z } from 'zod'

export const projectTasksRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  // Routes mounted under /projects/:projectId/tasks
  app.post(
    '/',
    {
      schema: {
        params: z.object({ projectId: z.string() }),
        body: createTaskSchema,
        response: {
          201: taskResponseSchema,
        },
      },
    },
    createTaskHandler
  )

  app.get(
    '/',
    {
      schema: {
        params: z.object({ projectId: z.string() }),
        response: {
          200: taskListResponseSchema,
        },
      },
    },
    getTasksHandler
  )
}

export const singleTaskRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  // Routes mounted under /api/tasks/:taskId
  app.get(
    '/',
    {
      schema: {
        params: z.object({ taskId: z.string() }),
        response: {
          200: taskResponseSchema,
        },
      },
    },
    getTaskHandler
  )

  app.patch(
    '/',
    {
      schema: {
        params: z.object({ taskId: z.string() }),
        body: updateTaskSchema,
        response: {
          200: taskResponseSchema,
        },
      },
    },
    updateTaskHandler
  )

  app.delete(
    '/',
    {
      schema: {
        params: z.object({ taskId: z.string() }),
        response: {
          204: z.undefined(),
        },
      },
    },
    deleteTaskHandler
  )

  app.get(
    '/comments',
    {
      schema: {
        params: z.object({ taskId: z.string() }),
        response: {
          200: commentListResponseSchema,
        },
      },
    },
    getCommentsHandler
  )



  app.post(
    '/comments',
    {
      schema: {
        params: z.object({ taskId: z.string() }),
        body: createCommentSchema,
        response: {
          201: commentResponseSchema,
        },
      },
    },
    addCommentHandler
  )

  app.delete(
    '/comments/:commentId',
    {
      schema: {
        params: z.object({ taskId: z.string(), commentId: z.string() }),
        response: {
          204: z.undefined(),
        },
      },
    },
    deleteCommentHandler
  )
}
