import { z } from 'zod'

const sprintStatusEnum = z.preprocess((val) => {
  if (typeof val === 'string') {
    const v = val.trim().toUpperCase()
    if (['PLANNED', 'ACTIVE', 'COMPLETED'].includes(v)) return v
  }
  return val
}, z.enum(['PLANNED', 'ACTIVE', 'COMPLETED']))

export const createSprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required').max(255),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  status: sprintStatusEnum.default('PLANNED'),
  goal: z.string().optional().nullable(),
})

export const updateSprintSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  status: sprintStatusEnum.optional(),
  goal: z.string().optional().nullable(),
})

export const sprintResponseSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  name: z.string(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  status: z.string(),
  goal: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const sprintListResponseSchema = z.array(sprintResponseSchema)

export type CreateSprintInput = z.infer<typeof createSprintSchema>
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>
