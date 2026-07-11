import type { FastifyReply, FastifyRequest } from 'fastify'
import { taskRelationsService } from './task-relations.service.js'
import type { AddTaskRelationInput } from './task-relations.schema.js'

export const addRelationHandler = async (
  request: FastifyRequest<{ Params: { taskId: string }; Body: AddTaskRelationInput }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const taskId = parseInt(request.params.taskId, 10)
  const relation = await taskRelationsService.addRelation(taskId, userId, request.body)
  reply.code(201)
  return relation
}

export const getRelationsHandler = async (
  request: FastifyRequest<{ Params: { taskId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const taskId = parseInt(request.params.taskId, 10)
  return await taskRelationsService.getRelations(taskId, userId)
}

export const removeRelationHandler = async (
  request: FastifyRequest<{ Params: { taskId: string; relationId: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const relationId = parseInt(request.params.relationId, 10)
  await taskRelationsService.removeRelation(relationId, userId)
  reply.code(204).send()
}
