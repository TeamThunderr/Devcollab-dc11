import { z } from 'zod'

export const addReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
})

export const reactionResponseSchema = z.object({
  id: z.number(),
  entityType: z.string(),
  entityId: z.number(),
  userId: z.number(),
  emoji: z.string(),
  createdAt: z.date(),
})

export const reactionListResponseSchema = z.array(reactionResponseSchema)

export type AddReactionInput = z.infer<typeof addReactionSchema>
