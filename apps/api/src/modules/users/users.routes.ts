import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { getMeHandler, updateMeHandler } from './users.controller.js'
import { updateProfileSchema, userProfileSchema } from './users.schema.js'
import { requireAuth } from '../../middlewares/auth.js'

export const usersRoutes: FastifyPluginAsyncZod = async (app) => {
  // All user routes require authentication
  app.addHook('preHandler', requireAuth)

  app.get(
    '/me',
    {
      schema: {
        response: {
          200: userProfileSchema,
        },
      },
    },
    getMeHandler
  )

  app.patch(
    '/me',
    {
      schema: {
        body: updateProfileSchema,
        response: {
          200: userProfileSchema,
        },
      },
    },
    updateMeHandler
  )
}
