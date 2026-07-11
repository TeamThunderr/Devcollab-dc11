import { z } from 'zod'

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().nullable(),
  skills: z.array(z.string()),
  githubUrl: z.string().url().nullable(),
  plan: z.string().optional(),
  createdAt: z.string().datetime(),
})

export type User = z.infer<typeof userSchema>
