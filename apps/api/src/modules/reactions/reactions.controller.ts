import type { FastifyReply, FastifyRequest } from 'fastify'
import { reactionsService } from './reactions.service.js'
import type { AddReactionInput } from './reactions.schema.js'

export const toggleReactionHandler = async (
  request: FastifyRequest<{ Params: { commentId: string }; Body: AddReactionInput }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const commentId = parseInt(request.params.commentId, 10)
  const result = await reactionsService.toggleReaction(commentId, userId, request.body)
  return result
}

export const getReactionsHandler = async (
  request: FastifyRequest<{ Params: { commentId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const commentId = parseInt(request.params.commentId, 10)
  return await reactionsService.getReactions(commentId, userId)
}
