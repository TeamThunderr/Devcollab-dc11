import type { FastifyReply, FastifyRequest } from 'fastify'
import { usersService } from './users.service.js'
import type { UpdateProfileInput } from './users.schema.js'

export const getMeHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const user = await usersService.getProfile(userId)
  return user
}

export const updateMeHandler = async (
  request: FastifyRequest<{ Body: UpdateProfileInput }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const user = await usersService.updateProfile(userId, request.body)
  return user
}
