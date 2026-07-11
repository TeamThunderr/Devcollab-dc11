import { z } from 'zod'

export const attachmentResponseSchema = z.object({
  id: z.number(),
  workspaceId: z.number(),
  uploaderId: z.number().nullable(),
  entityType: z.string(),
  entityId: z.number(),
  fileName: z.string(),
  fileUrl: z.string(),
  fileType: z.string().nullable(),
  createdAt: z.date(),
})

export const attachmentListResponseSchema = z.array(attachmentResponseSchema)
