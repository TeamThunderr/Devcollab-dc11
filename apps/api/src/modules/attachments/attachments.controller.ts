import type { FastifyReply, FastifyRequest } from 'fastify'
import { attachmentsService } from './attachments.service.js'

export const uploadAttachmentHandler = async (
  request: FastifyRequest<{ Params: { taskId: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const taskId = parseInt(request.params.taskId, 10)

  const data = await (request as any).file()
  if (!data) throw new Error('No file provided')

  const buffer = await data.toBuffer()
  const attachment = await attachmentsService.uploadAttachment(taskId, userId, {
    filename: data.filename,
    mimetype: data.mimetype,
    data: buffer,
  })

  reply.code(201)
  return attachment
}

export const getAttachmentsHandler = async (
  request: FastifyRequest<{ Params: { taskId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const taskId = parseInt(request.params.taskId, 10)
  return await attachmentsService.getAttachments(taskId, userId)
}

export const deleteAttachmentHandler = async (
  request: FastifyRequest<{ Params: { attachmentId: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const attachmentId = parseInt(request.params.attachmentId, 10)
  await attachmentsService.deleteAttachment(attachmentId, userId)
  reply.code(204).send()
}
