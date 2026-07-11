import { z } from 'zod'

export const createLabelSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code like #FF5733'),
})

export const labelResponseSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  name: z.string(),
  color: z.string(),
  createdAt: z.date(),
})

export const labelListResponseSchema = z.array(labelResponseSchema)

export const taskLabelResponseSchema = z.object({
  taskId: z.number(),
  labelId: z.number(),
})

export type CreateLabelInput = z.infer<typeof createLabelSchema>
