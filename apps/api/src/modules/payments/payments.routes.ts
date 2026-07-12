import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { createOrderHandler, verifyPaymentHandler } from './payments.controller.js'
import { createOrderSchema, verifyPaymentSchema } from './payments.schema.js'
import { requireAuth } from '../../middlewares/auth.js'
import { z } from 'zod'

export const paymentsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.post(
    '/create-order',
    {
      schema: {
        body: createOrderSchema,
        response: {
          200: z.any(),
        },
      },
    },
    createOrderHandler
  )

  app.post(
    '/verify',
    {
      schema: {
        body: verifyPaymentSchema,
        response: {
          200: z.any(),
        },
      },
    },
    verifyPaymentHandler
  )
}
