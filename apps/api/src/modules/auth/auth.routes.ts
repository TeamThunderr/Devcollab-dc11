import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import {
  loginHandler,
  logoutHandler,
  registerHandler,
  sendSignupOtpHandler,
  forgotPasswordHandler,
  verifyResetOtpHandler,
  resetPasswordHandler,
  googleCallbackHandler,
  githubCallbackHandler
} from './auth.controller.js'
import {
  authResponseSchema,
  loginSchema,
  registerSchema,
  sendSignupOtpSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema
} from './auth.schema.js'

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/send-signup-otp',
    {
      schema: {
        body: sendSignupOtpSchema,
      },
    },
    sendSignupOtpHandler
  )
  app.post(
    '/register',
    {
      schema: {
        body: registerSchema,
        response: {
          200: authResponseSchema,
        },
      },
    },
    registerHandler
  )

  app.post(
    '/login',
    {
      schema: {
        body: loginSchema,
        response: {
          200: authResponseSchema,
        },
      },
    },
    loginHandler
  )

  app.post('/logout', logoutHandler)

  app.post(
    '/forgot-password',
    {
      schema: {
        body: forgotPasswordSchema,
      },
    },
    forgotPasswordHandler
  )

  app.post(
    '/verify-reset-otp',
    {
      schema: {
        body: verifyOtpSchema,
      },
    },
    verifyResetOtpHandler
  )

  app.post(
    '/reset-password',
    {
      schema: {
        body: resetPasswordSchema,
      },
    },
    resetPasswordHandler
  )

  app.get('/google/callback', googleCallbackHandler)
  app.get('/github/callback', githubCallbackHandler)
}
