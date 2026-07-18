import { z } from 'zod'

export const activityFeedItemSchema = z.object({
  id: z.number(),
  workspaceId: z.number(),
  projectId: z.number().nullable(),
  userId: z.number(),
  actionType: z.string(),
  metadata: z.any().nullable(),
  createdAt: z.date(),
})

export const activityFeedListSchema = z.array(activityFeedItemSchema)

export const notificationSchema = z.object({
  id: z.number(),
  workspaceId: z.number(),
  recipientUserId: z.number(),
  userId: z.number().optional(),
  actorUserId: z.number().nullable(),
  type: z.string(),
  contextType: z.string().nullable(),
  contextId: z.number().nullable(),
  message: z.string(),
  link: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.union([z.date(), z.string()]),
})

export const notificationListSchema = z.array(notificationSchema)

