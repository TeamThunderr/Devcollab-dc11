import type { FastifyReply, FastifyRequest } from 'fastify'
import { Readable } from 'node:stream'
import { aiService } from './ai.service.js'
import type { ChatInput } from './ai.schema.js'

export const chatHandler = async (
  request: FastifyRequest<{ Body: ChatInput }>,
  _reply: FastifyReply,
) => {
  const userId = request.user!.id
  const result = await aiService.chat(userId, request.body)
  return result
}

export const getConversationsHandler = async (
  request: FastifyRequest<{ Querystring: { workspaceId: string } }>,
  _reply: FastifyReply,
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.query.workspaceId, 10)
  return await aiService.getConversations(userId, workspaceId)
}

export const getMessagesHandler = async (
  request: FastifyRequest<{ Params: { conversationId: string } }>,
  _reply: FastifyReply,
) => {
  const userId = request.user!.id
  const conversationId = parseInt(request.params.conversationId, 10)
  return await aiService.getMessages(userId, conversationId)
}

export const deleteConversationHandler = async (
  request: FastifyRequest<{ Params: { conversationId: string } }>,
  reply: FastifyReply,
) => {
  const userId = request.user!.id
  const conversationId = parseInt(request.params.conversationId, 10)
  await aiService.deleteConversation(userId, conversationId)
  reply.code(204).send()
}

export const chatStreamHandler = async (
  request: FastifyRequest<{ Body: ChatInput }>,
  reply: FastifyReply,
) => {
  const userId = request.user!.id

  reply.header('Content-Type', 'text/event-stream')
  reply.header('Cache-Control', 'no-cache')
  reply.header('Connection', 'keep-alive')
  reply.header('X-Accel-Buffering', 'no')

  const stream = aiService.chatStream(userId, request.body)
  return reply.send(Readable.from(stream))
}
