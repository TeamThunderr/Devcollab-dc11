import { z } from 'zod'

const statusEnum = z.preprocess((val) => {
  if (typeof val === 'string') {
    const v = val.trim().toUpperCase().replace(/[-\s]+/g, '_')
    if (['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(v)) {
      return v
    }
  }
  return val
}, z.enum(['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']))

const priorityEnum = z.preprocess((val) => {
  if (typeof val === 'string') {
    const v = val.trim().toUpperCase()
    if (['P0', 'P1', 'P2'].includes(v)) return v
  }
  return val
}, z.enum(['P0', 'P1', 'P2']))

const dueDateSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'tomorrow') {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      return d.toISOString()
    }
    if (val.toLowerCase() === 'today') {
      return new Date().toISOString()
    }
    const parsed = Date.parse(val)
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString()
    }
  }
  return val
}, z.string().datetime().optional().nullable())

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  status: statusEnum.default('TO_DO'),
  priority: priorityEnum.default('P2'),
  assigneeId: z.number().optional().nullable(),
  sprintId: z.number().optional().nullable(),
  dueDate: dueDateSchema,
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  assigneeId: z.number().optional().nullable(),
  sprintId: z.number().optional().nullable(),
  dueDate: dueDateSchema,
})

export const taskResponseSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  priority: z.string(),
  assigneeId: z.number().nullable(),
  sprintId: z.number().nullable().optional(),
  dueDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const taskListResponseSchema = z.array(taskResponseSchema)

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
})

export const commentResponseSchema = z.object({
  id: z.number(),
  taskId: z.number(),
  userId: z.number(),
  content: z.string(),
  createdAt: z.date(),
})

export const commentListResponseSchema = z.array(commentResponseSchema)

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
