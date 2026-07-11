import { eq, or, and } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { projects, taskRelations, tasks } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import { projectsService } from '../projects/projects.service.js'
import { emitToProject } from '../../socket/emit.js'
import type { AddTaskRelationInput } from './task-relations.schema.js'

export const taskRelationsService = {
  async addRelation(sourceTaskId: number, userId: number, data: AddTaskRelationInput) {
    if (sourceTaskId === data.relatedTaskId) {
      throw new AppError(400, 'BAD_REQUEST', 'A task cannot relate to itself')
    }

    const sourceTask = await db.query.tasks.findFirst({ where: eq(tasks.id, sourceTaskId) })
    if (!sourceTask) throw new AppError(404, 'NOT_FOUND', 'Source task not found')

    const targetTask = await db.query.tasks.findFirst({ where: eq(tasks.id, data.relatedTaskId) })
    if (!targetTask) throw new AppError(404, 'NOT_FOUND', 'Target task not found')

    if (sourceTask.projectId !== targetTask.projectId) {
      throw new AppError(400, 'BAD_REQUEST', 'Cannot create relations across different projects')
    }

    const { project } = await projectsService.checkProjectPermission(sourceTask.projectId, userId, ['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER'])

    return await db.transaction(async (tx) => {
      // Determine direction of dependency for cycle checking
      let parentTaskId: number | null = null
      let childTaskId: number | null = null

      if (data.relationType === 'IS_BLOCKED_BY') {
        parentTaskId = sourceTaskId
        childTaskId = data.relatedTaskId
      } else if (data.relationType === 'BLOCKS') {
        parentTaskId = data.relatedTaskId
        childTaskId = sourceTaskId
      }

      // If this is a blocking relation, check for circular dependency
      if (parentTaskId !== null && childTaskId !== null) {
        const visited = new Set<number>()
        const queue: number[] = [childTaskId]

        while (queue.length > 0) {
          const currentId = queue.shift()!
          if (currentId === parentTaskId) {
            throw new AppError(400, 'CIRCULAR_DEPENDENCY', 'Adding this relation would create a circular dependency')
          }
          if (visited.has(currentId)) continue
          visited.add(currentId)

          const outgoing = await tx
            .select()
            .from(taskRelations)
            .where(
              or(
                and(eq(taskRelations.taskId, currentId), eq(taskRelations.relationType, 'IS_BLOCKED_BY')),
                and(eq(taskRelations.relatedTaskId, currentId), eq(taskRelations.relationType, 'BLOCKS'))
              )
            )

          for (const rel of outgoing) {
            const nextId = rel.relationType === 'IS_BLOCKED_BY' ? rel.relatedTaskId : rel.taskId
            if (!visited.has(nextId)) {
              queue.push(nextId)
            }
          }
        }
      }

      const [relation] = await tx
        .insert(taskRelations)
        .values({
          taskId: sourceTaskId,
          relatedTaskId: data.relatedTaskId,
          relationType: data.relationType,
        })
        .returning()

      if (!relation) throw new AppError(409, 'CONFLICT', 'Relation already exists')

      emitToProject(sourceTask.projectId, 'task:updated', {
        taskId: sourceTaskId,
        projectId: sourceTask.projectId,
        workspaceId: project.workspaceId,
        data: sourceTask as unknown as Record<string, unknown>,
      })
      return relation
    })
  },

  async getRelations(taskId: number, userId: number) {
    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')

    await projectsService.checkProjectPermission(task.projectId, userId, ['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER', 'VIEWER'])

    return await db.query.taskRelations.findMany({
      where: eq(taskRelations.taskId, taskId),
    })
  },

  async removeRelation(relationId: number, userId: number) {
    const relation = await db.query.taskRelations.findFirst({
      where: eq(taskRelations.id, relationId),
    })
    if (!relation) throw new AppError(404, 'NOT_FOUND', 'Relation not found')

    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, relation.taskId) })
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')

    const { project } = await projectsService.checkProjectPermission(task.projectId, userId, ['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER'])

    await db.delete(taskRelations).where(eq(taskRelations.id, relationId))

    emitToProject(task.projectId, 'task:updated', {
      taskId: task.id,
      projectId: task.projectId,
      workspaceId: project.workspaceId,
      data: task as unknown as Record<string, unknown>,
    })
    return { success: true }
  },
}
