import type { FastifyReply, FastifyRequest } from 'fastify'
import { workspacesService } from './workspaces.service.js'
import { projectsService } from '../projects/projects.service.js'
import { activityService } from '../activity/activity.service.js'
import type { AddMemberInput, CreateWorkspaceInput, UpdateMemberRoleInput, UpdateWorkspaceInput, InviteMemberInput } from './workspaces.schema.js'

export const createWorkspaceHandler = async (
  request: FastifyRequest<{ Body: CreateWorkspaceInput }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspace = await workspacesService.createWorkspace(userId, request.body)
  reply.code(201)
  return workspace
}

export const getWorkspacesHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaces = await workspacesService.getWorkspaces(userId)
  return workspaces
}

export const getWorkspacesMyHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaces = await workspacesService.getMyWorkspaces(userId)
  return workspaces
}

export const getWorkspaceStatsHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.id, 10)
  const stats = await workspacesService.getWorkspaceStats(workspaceId, userId)
  return stats
}

export const getWorkspaceProjectsHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.id, 10)
  const projects = await projectsService.getProjects(workspaceId, userId)
  return projects
}

export const getWorkspaceActivityHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.id, 10)
  const activity = await activityService.getWorkspaceActivity(workspaceId, userId)
  return activity
}

export const getWorkspaceTasksHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.id, 10)
  const tasks = await workspacesService.getWorkspaceTasks(workspaceId, userId)
  return tasks
}

export const getWorkspaceMembersHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.id, 10)
  const members = await workspacesService.getWorkspaceMembers(workspaceId, userId)
  return members
}

export const updateWorkspaceHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateWorkspaceInput }>,
  _reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.id, 10)
  
  const workspace = await workspacesService.updateWorkspace(workspaceId, userId, request.body)
  return workspace
}

export const deleteWorkspaceHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const workspaceId = parseInt(request.params.id, 10)
  
  await workspacesService.deleteWorkspace(workspaceId, userId)
  reply.code(204).send()
}

export const addMemberHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: AddMemberInput }>,
  reply: FastifyReply
) => {
  const inviterId = request.user!.id
  const workspaceId = parseInt(request.params.id, 10)
  
  const member = await workspacesService.addMember(workspaceId, inviterId, request.body)
  reply.code(201)
  return member
}

export const updateMemberRoleHandler = async (
  request: FastifyRequest<{ Params: { id: string; userId: string }; Body: UpdateMemberRoleInput }>,
  _reply: FastifyReply
) => {
  const updaterId = request.user!.id
  const workspaceId = parseInt(request.params.id, 10)
  const targetUserId = parseInt(request.params.userId, 10)
  
  const member = await workspacesService.updateMemberRole(workspaceId, targetUserId, updaterId, request.body)
  return member
}

export const removeMemberHandler = async (
  request: FastifyRequest<{ Params: { id: string; userId: string } }>,
  reply: FastifyReply
) => {
  const requesterId = request.user!.id
  const workspaceId = parseInt(request.params.id, 10)
  const targetUserId = parseInt(request.params.userId, 10)
  
  await workspacesService.removeMember(workspaceId, targetUserId, requesterId)
  reply.code(204).send()
}

export const inviteMemberHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: InviteMemberInput }>,
  reply: FastifyReply
) => {
  const inviterId = request.user!.id
  const workspaceId = parseInt(request.params.id, 10)
  
  const member = await workspacesService.inviteMember(workspaceId, inviterId, request.body)
  reply.code(201)
  return member
}

export const joinWorkspaceHandler = async (
  request: FastifyRequest<{ Body: { code: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user!.id
  const code = request.body.code
  
  const result = await workspacesService.joinWorkspaceByCode(userId, code)
  reply.code(200)
  return result
}

export const rejectInvitationHandler = async (
  request: FastifyRequest<{ Params: { slug: string }, Body: { email: string } }>,
  reply: FastifyReply
) => {
  const slug = request.params.slug
  const email = request.body.email
  
  const result = await workspacesService.rejectInvitation(slug, email)
  reply.code(200)
  return result
}
