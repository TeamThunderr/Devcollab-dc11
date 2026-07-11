import type { FastifyReply, FastifyRequest } from 'fastify'
import { projectsService } from './projects.service.js'
import type { CreateProjectInput, UpdateProjectInput, AddProjectMemberInput, UpdateProjectMemberInput } from './projects.schema.js'

export const createProjectHandler = async (
  request: FastifyRequest<{ Params: { workspaceId: string }; Body: CreateProjectInput }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.workspaceId, 10)
  
  const project = await projectsService.createProject(workspaceId, userId, request.body)
  reply.code(201)
  return project
}

export const getProjectsHandler = async (
  request: FastifyRequest<{ Params: { workspaceId: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.workspaceId, 10)
  
  const projects = await projectsService.getProjects(workspaceId, userId)
  return projects
}

export const getProjectHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.id, 10)
  
  const project = await projectsService.getProject(projectId, userId)
  return project
}

export const updateProjectHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateProjectInput }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.id, 10)
  
  const project = await projectsService.updateProject(projectId, userId, request.body)
  return project
}

export const deleteProjectHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.id, 10)
  
  await projectsService.deleteProject(projectId, userId)
  reply.code(204).send()
}

export const getProjectMembersHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.id, 10)
  return await projectsService.getProjectMembers(projectId, userId)
}

export const addProjectMemberHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: AddProjectMemberInput }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const projectId = parseInt(request.params.id, 10)
  return await projectsService.addProjectMember(projectId, userId, request.body)
}

export const updateProjectMemberRoleHandler = async (
  request: FastifyRequest<{ Params: { id: string; userId: string }; Body: UpdateProjectMemberInput }>,
  reply: FastifyReply
) => {
  const requesterId = request.user!.id
  const projectId = parseInt(request.params.id, 10)
  const targetUserId = parseInt(request.params.userId, 10)
  return await projectsService.updateProjectMemberRole(projectId, targetUserId, requesterId, request.body)
}

export const removeProjectMemberHandler = async (
  request: FastifyRequest<{ Params: { id: string; userId: string } }>,
  reply: FastifyReply
) => {
  const requesterId = request.user!.id
  const projectId = parseInt(request.params.id, 10)
  const targetUserId = parseInt(request.params.userId, 10)
  await projectsService.removeProjectMember(projectId, targetUserId, requesterId)
  reply.code(204).send()
}
