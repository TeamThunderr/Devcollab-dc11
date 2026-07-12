import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(255),
  slug: z.string().min(2, 'Workspace URL must be at least 2 characters').max(255),
  description: z.string().optional(),
})

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(255).optional(),
})

export const workspaceResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  logo: z.string().nullable().optional(),
  ownerId: z.number(),
  createdAt: z.date(),
})

export const workspaceListResponseSchema = z.array(workspaceResponseSchema)

export const workspaceMyResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable().optional(),
  role: z.string(),
  plan: z.string(),
  memberCount: z.number(),
  projectCount: z.number(),
})

export const workspaceMyListResponseSchema = z.array(workspaceMyResponseSchema)

export const workspaceStatsResponseSchema = z.object({
  activeProjects: z.number(),
  teamMembers: z.number(),
  totalTasks: z.number(),
})

export const addMemberSchema = z.object({
  userId: z.number(),
  role: z.preprocess((val: any) => typeof val === 'string' ? val.toUpperCase() : val, z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER')),
})

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.preprocess((val: any) => typeof val === 'string' ? val.toUpperCase() : val, z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER')),
})

export const joinWorkspaceSchema = z.object({
  slug: z.string(),
})

export const joinWorkspaceBodySchema = z.object({
  code: z.string().min(1, 'Invitation code is required'),
})

export const rejectInvitationBodySchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const updateMemberRoleSchema = z.object({
  role: z.preprocess((val: any) => typeof val === 'string' ? val.toUpperCase() : val, z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])),
})

export const memberResponseSchema = z.object({
  workspaceId: z.number(),
  userId: z.number(),
  role: z.string(),
  createdAt: z.date(),
})

export const workspaceMemberProfileResponseSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable().optional(),
  role: z.string(),
  status: z.string().optional(),
  joinedAt: z.date().optional(),
})

export const workspaceMemberListResponseSchema = z.array(workspaceMemberProfileResponseSchema)

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>
export type AddMemberInput = z.infer<typeof addMemberSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
