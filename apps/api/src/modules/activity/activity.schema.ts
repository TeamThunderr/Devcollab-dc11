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
  userId: z.number(),
  type: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.date(),
})

export const notificationListSchema = z.array(notificationSchema)
