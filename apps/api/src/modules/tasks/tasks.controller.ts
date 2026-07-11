import type { FastifyReply, FastifyRequest } from 'fastify'
import { tasksService } from './tasks.service.js'
import type { CreateCommentInput, CreateTaskInput, UpdateTaskInput } from './tasks.schema.js'

export const createTaskHandler = async (
  request: FastifyRequest<{ Params: { projectId: string }; Body: CreateTaskInput }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.projectId, 10)
  
  const task = await tasksService.createTask(projectId, userId, request.body)
  reply.code(201)
  return task
}

export const getTasksHandler = async (
  request: FastifyRequest<{ Params: { projectId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.projectId, 10)
  
  const tasks = await tasksService.getTasks(projectId, userId)
  return tasks
}

export const getTaskHandler = async (
  request: FastifyRequest<{ Params: { taskId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const taskId = parseInt(request.params.taskId, 10)
  
  const task = await tasksService.getTask(taskId, userId)
  return task
}

export const updateTaskHandler = async (
  request: FastifyRequest<{ Params: { taskId: string }; Body: UpdateTaskInput }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const taskId = parseInt(request.params.taskId, 10)
  
  const task = await tasksService.updateTask(taskId, userId, request.body)
  return task
}

export const addCommentHandler = async (
  request: FastifyRequest<{ Params: { taskId: string }; Body: CreateCommentInput }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const taskId = parseInt(request.params.taskId, 10)
  
  const comment = await tasksService.addComment(taskId, userId, request.body)
  reply.code(201)
  return comment
}

export const deleteTaskHandler = async (
  request: FastifyRequest<{ Params: { taskId: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const taskId = parseInt(request.params.taskId, 10)
  
  await tasksService.deleteTask(taskId, userId)
  reply.code(204).send()
}

export const getCommentsHandler = async (
  request: FastifyRequest<{ Params: { taskId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const taskId = parseInt(request.params.taskId, 10)
  
  const comments = await tasksService.getComments(taskId, userId)
  return comments
}

export const deleteCommentHandler = async (
  request: FastifyRequest<{ Params: { taskId: string; commentId: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const taskId = parseInt(request.params.taskId, 10)
  const commentId = parseInt(request.params.commentId, 10)
  
  await tasksService.deleteComment(taskId, commentId, userId)
  reply.code(204).send()
}
