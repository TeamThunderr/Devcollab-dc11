import { z } from 'zod'

export const createDocSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
})

export const updateDocSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
})

export const docResponseSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  title: z.string(),
  content: z.string(),
  createdBy: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const docListResponseSchema = z.array(docResponseSchema)

export const docVersionResponseSchema = z.object({
  id: z.number(),
  docId: z.number(),
  content: z.string(),
  createdBy: z.number().nullable(),
  createdAt: z.date(),
})

export const docVersionListResponseSchema = z.array(docVersionResponseSchema)

export type CreateDocInput = z.infer<typeof createDocSchema>
export type UpdateDocInput = z.infer<typeof updateDocSchema>
