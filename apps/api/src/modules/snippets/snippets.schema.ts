import { z } from 'zod'

export const createSnippetSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  language: z.string().min(1).max(50),
  code: z.string().min(1),
  tags: z.array(z.string()).optional().nullable(),
})

export const updateSnippetSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  language: z.string().min(1).max(50).optional(),
  code: z.string().min(1).optional(),
  tags: z.array(z.string()).optional().nullable(),
})

export const snippetResponseSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  language: z.string(),
  code: z.string(),
  tags: z.array(z.string()).nullable(),
  createdBy: z.number().nullable(),
  createdAt: z.date(),
})

export const snippetListResponseSchema = z.array(snippetResponseSchema)

export type CreateSnippetInput = z.infer<typeof createSnippetSchema>
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>
