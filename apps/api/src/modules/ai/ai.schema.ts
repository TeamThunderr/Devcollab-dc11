import { z } from 'zod'

// ── Request schemas ───────────────────────────────────────────────────────────

export const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.number().int().positive().optional(),
  scope: z.enum(['workspace', 'project']),
  scopeId: z.number().int().positive(), // workspaceId or projectId
  attachment: z.object({
    name: z.string(),
    type: z.string(),
    data: z.string(), // base64 payload
  }).optional(),
})

export const deleteConversationSchema = z.object({
  conversationId: z.string(),
})

export const getMessagesSchema = z.object({
  conversationId: z.string(),
})

export const getConversationsSchema = z.object({
  workspaceId: z.string(),
})

// ── Response schemas ──────────────────────────────────────────────────────────

export const chatResponseSchema = z.object({
  conversationId: z.number(),
  messageId: z.number(),
  reply: z.string(),
})

export const conversationSchema = z.object({
  id: z.number(),
  title: z.string(),
  scope: z.string(),
  updatedAt: z.date(),
  createdAt: z.date(),
})

export const conversationListSchema = z.array(conversationSchema)

export const messageSchema = z.object({
  id: z.number(),
  role: z.enum(['user', 'model']),
  content: z.string(),
  createdAt: z.date(),
})

export const messageListSchema = z.array(messageSchema)

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChatInput = z.infer<typeof chatSchema>
