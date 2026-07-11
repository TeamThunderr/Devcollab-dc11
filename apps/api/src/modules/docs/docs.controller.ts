import type { FastifyReply, FastifyRequest } from 'fastify'
import { docsService } from './docs.service.js'
import type { CreateDocInput, UpdateDocInput } from './docs.schema.js'

export const createDocHandler = async (
  request: FastifyRequest<{ Params: { projectId: string }; Body: CreateDocInput }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.projectId, 10)
  const doc = await docsService.createDoc(projectId, userId, request.body)
  reply.code(201)
  return doc
}

export const getDocsHandler = async (
  request: FastifyRequest<{ Params: { projectId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.projectId, 10)
  return await docsService.getDocs(projectId, userId)
}

export const getDocHandler = async (
  request: FastifyRequest<{ Params: { docId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const docId = parseInt(request.params.docId, 10)
  return await docsService.getDoc(docId, userId)
}

export const updateDocHandler = async (
  request: FastifyRequest<{ Params: { docId: string }; Body: UpdateDocInput }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const docId = parseInt(request.params.docId, 10)
  return await docsService.updateDoc(docId, userId, request.body)
}

export const deleteDocHandler = async (
  request: FastifyRequest<{ Params: { docId: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const docId = parseInt(request.params.docId, 10)
  await docsService.deleteDoc(docId, userId)
  reply.code(204).send()
}

export const getVersionsHandler = async (
  request: FastifyRequest<{ Params: { docId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const docId = parseInt(request.params.docId, 10)
  return await docsService.getVersions(docId, userId)
}
