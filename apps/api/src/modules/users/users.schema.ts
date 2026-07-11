import { z } from 'zod'

export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  skills: z.array(z.string()).optional(),
  githubUrl: z.string().nullable().optional(),
  plan: z.enum(['FREE', 'PRO']).optional(),
  createdAt: z.string(),
})

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().url().optional().nullable(),
  bio: z.string().optional().nullable(),
  skills: z.array(z.string()).optional().nullable(),
  githubLink: z.string().url().optional().nullable(),
  plan: z.enum(['FREE', 'PRO']).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
