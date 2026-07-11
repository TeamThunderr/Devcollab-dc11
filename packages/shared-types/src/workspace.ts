import { z } from 'zod'

export const workspaceRoleEnum = z.enum(['owner', 'admin', 'member', 'viewer'])
export const planTypeEnum = z.enum(['free', 'pro'])

export const workspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1),
  ownerId: z.string().uuid(),
  plan: planTypeEnum,
  createdAt: z.string().datetime(),
})

export type Workspace = z.infer<typeof workspaceSchema>
export type WorkspaceRole = z.infer<typeof workspaceRoleEnum>
export type PlanType = z.infer<typeof planTypeEnum>
