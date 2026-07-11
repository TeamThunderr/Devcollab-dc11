import type { FastifyReply, FastifyRequest } from 'fastify'
import { labelsService } from './labels.service.js'
import type { CreateLabelInput } from './labels.schema.js'

export const createLabelHandler = async (
  request: FastifyRequest<{ Params: { projectId: string }; Body: CreateLabelInput }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.projectId, 10)
  const label = await labelsService.createLabel(projectId, userId, request.body)
  reply.code(201)
  return label
}

export const getLabelsHandler = async (
  request: FastifyRequest<{ Params: { projectId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.projectId, 10)
  return await labelsService.getLabels(projectId, userId)
}

export const deleteLabelHandler = async (
  request: FastifyRequest<{ Params: { labelId: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const labelId = parseInt(request.params.labelId, 10)
  await labelsService.deleteLabel(labelId, userId)
  reply.code(204).send()
}

export const attachLabelHandler = async (
  request: FastifyRequest<{ Params: { taskId: string; labelId: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const taskId = parseInt(request.params.taskId, 10)
  const labelId = parseInt(request.params.labelId, 10)
  const result = await labelsService.attachLabelToTask(taskId, labelId, userId)
  reply.code(201)
  return result
}

export const detachLabelHandler = async (
  request: FastifyRequest<{ Params: { taskId: string; labelId: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const taskId = parseInt(request.params.taskId, 10)
  const labelId = parseInt(request.params.labelId, 10)
  await labelsService.detachLabelFromTask(taskId, labelId, userId)
  reply.code(204).send()
}
