import { z } from 'zod'

export const getChatMessagesQuerySchema = z.object({
  channel: z.string().default('general'),
})

export const createChatMessageSchema = z.object({
  channel: z.string().default('general'),
  content: z.string().min(1, 'Content is required'),
})

export const chatMessageResponseSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  userId: z.number(),
  channel: z.string(),
  content: z.string(),
  createdAt: z.string(),
  senderName: z.string(),
  senderRole: z.string(),
  avatarUrl: z.string().nullable().optional(),
})

export const chatMessageListResponseSchema = z.array(chatMessageResponseSchema)

export type CreateChatMessageInput = z.infer<typeof createChatMessageSchema>
