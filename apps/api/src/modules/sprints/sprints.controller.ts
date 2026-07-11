import type { FastifyReply, FastifyRequest } from 'fastify'
import { sprintsService } from './sprints.service.js'
import type { CreateSprintInput, UpdateSprintInput } from './sprints.schema.js'

export const createSprintHandler = async (
  request: FastifyRequest<{ Params: { projectId: string }; Body: CreateSprintInput }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.projectId, 10)
  const sprint = await sprintsService.createSprint(projectId, userId, request.body)
  reply.code(201)
  return sprint
}

export const getSprintsHandler = async (
  request: FastifyRequest<{ Params: { projectId: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.projectId, 10)
  const sprints = await sprintsService.getSprints(projectId, userId)
  return sprints
}

export const getSprintHandler = async (
  request: FastifyRequest<{ Params: { sprintId: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const sprintId = parseInt(request.params.sprintId, 10)
  const sprint = await sprintsService.getSprint(sprintId, userId)
  return sprint
}

export const updateSprintHandler = async (
  request: FastifyRequest<{ Params: { sprintId: string }; Body: UpdateSprintInput }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const sprintId = parseInt(request.params.sprintId, 10)
  const sprint = await sprintsService.updateSprint(sprintId, userId, request.body)
  return sprint
}

export const deleteSprintHandler = async (
  request: FastifyRequest<{ Params: { sprintId: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const sprintId = parseInt(request.params.sprintId, 10)
  await sprintsService.deleteSprint(sprintId, userId)
  reply.code(204).send()
}
