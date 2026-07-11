import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(255),
  description: z.string().optional().nullable(),
  status: z.string().optional().default('active'),
  priority: z.string().optional().default('P2'),
})

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  priority: z.string().optional(),
  isArchived: z.boolean().optional(),
})

export const projectResponseSchema = z.object({
  id: z.number(),
  workspaceId: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string().optional(),
  priority: z.string().optional(),
  tasksCount: z.number().optional(),
  createdBy: z.number().nullable().optional(),
  visibility: z.string().optional(),
  isArchived: z.boolean().optional(),
  settings: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  members: z.array(z.any()).optional(),
})

export const projectListResponseSchema = z.array(projectResponseSchema)

export const addProjectMemberSchema = z.object({
  userId: z.number(),
  role: z.enum(['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER', 'VIEWER']).default('MEMBER'),
})

export const updateProjectMemberSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER', 'VIEWER']),
})

export const projectMemberResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable().optional(),
  role: z.string(),
  joinedAt: z.date(),
})

export const projectMemberListResponseSchema = z.array(projectMemberResponseSchema)

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>
export type UpdateProjectMemberInput = z.infer<typeof updateProjectMemberSchema>
