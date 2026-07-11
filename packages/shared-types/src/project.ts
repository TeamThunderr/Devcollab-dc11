import { z } from 'zod'

export const projectSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
})

export type Project = z.infer<typeof projectSchema>
