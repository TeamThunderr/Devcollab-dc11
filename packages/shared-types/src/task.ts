import { z } from 'zod'

export const taskStatusEnum = z.enum(['todo', 'inprogress', 'inreview', 'done'])
export const taskPriorityEnum = z.enum(['P0', 'P1', 'P2'])

export const taskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().nullable(),
  status: taskStatusEnum,
  priority: taskPriorityEnum,
  assigneeId: z.string().uuid().nullable(),
  dueDate: z.string().datetime().nullable(),
  position: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Task = z.infer<typeof taskSchema>
export type TaskStatus = z.infer<typeof taskStatusEnum>
export type TaskPriority = z.infer<typeof taskPriorityEnum>
