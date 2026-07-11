import type { FastifyReply, FastifyRequest } from 'fastify'
import { snippetsService } from './snippets.service.js'
import type { CreateSnippetInput, UpdateSnippetInput } from './snippets.schema.js'

export const createSnippetHandler = async (
  request: FastifyRequest<{ Params: { projectId: string }; Body: CreateSnippetInput }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.projectId, 10)
  const snippet = await snippetsService.createSnippet(projectId, userId, request.body)
  reply.code(201)
  return snippet
}

export const getSnippetsHandler = async (
  request: FastifyRequest<{ Params: { projectId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.projectId, 10)
  return await snippetsService.getSnippets(projectId, userId)
}

export const getSnippetHandler = async (
  request: FastifyRequest<{ Params: { snippetId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const snippetId = parseInt(request.params.snippetId, 10)
  return await snippetsService.getSnippet(snippetId, userId)
}

export const updateSnippetHandler = async (
  request: FastifyRequest<{ Params: { snippetId: string }; Body: UpdateSnippetInput }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const snippetId = parseInt(request.params.snippetId, 10)
  return await snippetsService.updateSnippet(snippetId, userId, request.body)
}

export const deleteSnippetHandler = async (
  request: FastifyRequest<{ Params: { snippetId: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const snippetId = parseInt(request.params.snippetId, 10)
  await snippetsService.deleteSnippet(snippetId, userId)
  reply.code(204).send()
}
