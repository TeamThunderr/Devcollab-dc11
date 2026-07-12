import type { FastifyReply, FastifyRequest } from 'fastify'
import { chatService } from './chat.service.js'
import type { CreateChatMessageInput } from './chat.schema.js'

export const getProjectChatHandler = async (
  request: FastifyRequest<{ Params: { projectId: string }; Querystring: { channel?: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.projectId, 10)
  const channel = request.query.channel || 'general'

  const messages = await chatService.getMessages(projectId, userId, channel)
  return messages
}

export const createProjectChatHandler = async (
  request: FastifyRequest<{ Params: { projectId: string }; Body: CreateChatMessageInput }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.projectId, 10)

  const message = await chatService.sendMessage(projectId, userId, request.body)
  reply.code(201)
  return message
}
