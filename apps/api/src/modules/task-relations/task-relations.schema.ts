import { z } from 'zod'

export const addTaskRelationSchema = z.object({
  relatedTaskId: z.number(),
  relationType: z.enum(['BLOCKS', 'IS_BLOCKED_BY', 'RELATES_TO', 'DUPLICATES']),
})

export const taskRelationResponseSchema = z.object({
  id: z.number(),
  taskId: z.number(),
  relatedTaskId: z.number(),
  relationType: z.string(),
  createdAt: z.date(),
})

export const taskRelationListResponseSchema = z.array(taskRelationResponseSchema)

export type AddTaskRelationInput = z.infer<typeof addTaskRelationSchema>
