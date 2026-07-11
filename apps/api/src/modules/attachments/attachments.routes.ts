import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth.js'
import {
  deleteAttachmentHandler,
  getAttachmentsHandler,
  uploadAttachmentHandler,
} from './attachments.controller.js'
import {
  attachmentListResponseSchema,
  attachmentResponseSchema,
} from './attachments.schema.js'

// Mounted under /api/tasks/:taskId/attachments
export const taskAttachmentsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  // NOTE: File upload uses content-type: multipart/form-data — no body schema on POST
  app.post('/', {
    schema: {
      params: z.object({ taskId: z.string() }),
      response: { 201: attachmentResponseSchema },
    },
  }, uploadAttachmentHandler)

  app.get('/', {
    schema: {
      params: z.object({ taskId: z.string() }),
      response: { 200: attachmentListResponseSchema },
    },
  }, getAttachmentsHandler)
}

// Mounted under /api/attachments/:attachmentId
export const singleAttachmentRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.delete('/', {
    schema: {
      params: z.object({ attachmentId: z.string() }),
      response: { 204: z.undefined() },
    },
  }, deleteAttachmentHandler)
}
