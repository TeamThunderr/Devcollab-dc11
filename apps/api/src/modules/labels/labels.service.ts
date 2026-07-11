import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { labels, projects, taskLabels } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import { workspacesService } from '../workspaces/workspaces.service.js'
import type { CreateLabelInput } from './labels.schema.js'

export const labelsService = {
  async getProjectWorkspaceId(projectId: number) {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found')
    return project.workspaceId
  },

  async createLabel(projectId: number, userId: number, data: CreateLabelInput) {
    const workspaceId = await this.getProjectWorkspaceId(projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER'])

    const [label] = await db
      .insert(labels)
      .values({ projectId, name: data.name, color: data.color })
      .returning()

    if (!label) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to create label')
    return label
  },

  async getLabels(projectId: number, userId: number) {
    const workspaceId = await this.getProjectWorkspaceId(projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    return await db.query.labels.findMany({
      where: eq(labels.projectId, projectId),
    })
  },

  async deleteLabel(labelId: number, userId: number) {
    const label = await db.query.labels.findFirst({ where: eq(labels.id, labelId) })
    if (!label) throw new AppError(404, 'NOT_FOUND', 'Label not found')

    const workspaceId = await this.getProjectWorkspaceId(label.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN'])

    await db.delete(labels).where(eq(labels.id, labelId))
    return { success: true }
  },

  async attachLabelToTask(taskId: number, labelId: number, userId: number) {
    const label = await db.query.labels.findFirst({ where: eq(labels.id, labelId) })
    if (!label) throw new AppError(404, 'NOT_FOUND', 'Label not found')

    const workspaceId = await this.getProjectWorkspaceId(label.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER'])

    const [taskLabel] = await db
      .insert(taskLabels)
      .values({ taskId, labelId })
      .onConflictDoNothing()
      .returning()

    return taskLabel ?? { taskId, labelId }
  },

  async detachLabelFromTask(taskId: number, labelId: number, userId: number) {
    const label = await db.query.labels.findFirst({ where: eq(labels.id, labelId) })
    if (!label) throw new AppError(404, 'NOT_FOUND', 'Label not found')

    const workspaceId = await this.getProjectWorkspaceId(label.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER'])

    await db.delete(taskLabels).where(
      and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId))
    )
    return { success: true }
  },
}
