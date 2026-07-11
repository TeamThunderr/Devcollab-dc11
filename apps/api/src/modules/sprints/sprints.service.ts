import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { projects, sprints } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import { workspacesService } from '../workspaces/workspaces.service.js'
import { activityService } from '../activity/activity.service.js'
import { emitToProject } from '../../socket/emit.js'
import type { CreateSprintInput, UpdateSprintInput } from './sprints.schema.js'

export const sprintsService = {
  async getProjectWorkspaceId(projectId: number) {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found')
    return project.workspaceId
  },

  async createSprint(projectId: number, userId: number, data: CreateSprintInput) {
    const workspaceId = await this.getProjectWorkspaceId(projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER'])

    const [sprint] = await db
      .insert(sprints)
      .values({
        projectId,
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status,
        goal: data.goal ?? null,
      })
      .returning()

    if (!sprint) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to create sprint')

    activityService.logActivity({
      workspaceId,
      projectId,
      userId,
      actionType: 'created a sprint',
      metadata: { sprintId: sprint.id, name: sprint.name },
    }).catch(() => {})

    emitToProject(projectId, 'sprint:created', {
      sprintId: sprint.id,
      projectId,
      data: sprint as unknown as Record<string, unknown>,
    })

    return sprint
  },

  async getSprints(projectId: number, userId: number) {
    const workspaceId = await this.getProjectWorkspaceId(projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    return await db.query.sprints.findMany({
      where: eq(sprints.projectId, projectId),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    })
  },

  async getSprint(sprintId: number, userId: number) {
    const sprint = await db.query.sprints.findFirst({ where: eq(sprints.id, sprintId) })
    if (!sprint) throw new AppError(404, 'NOT_FOUND', 'Sprint not found')

    const workspaceId = await this.getProjectWorkspaceId(sprint.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    return sprint
  },

  async updateSprint(sprintId: number, userId: number, data: UpdateSprintInput) {
    const sprint = await db.query.sprints.findFirst({ where: eq(sprints.id, sprintId) })
    if (!sprint) throw new AppError(404, 'NOT_FOUND', 'Sprint not found')

    const workspaceId = await this.getProjectWorkspaceId(sprint.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER'])

    const updateData: any = { ...data }
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)
    updateData.updatedAt = new Date()

    const [updated] = await db
      .update(sprints)
      .set(updateData)
      .where(eq(sprints.id, sprintId))
      .returning()

    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Sprint not found')

    activityService.logActivity({
      workspaceId,
      projectId: sprint.projectId,
      userId,
      actionType: 'updated a sprint',
      metadata: { sprintId, name: updated.name },
    }).catch(() => {})

    emitToProject(sprint.projectId, 'sprint:updated', {
      sprintId,
      projectId: sprint.projectId,
      data: updated as unknown as Record<string, unknown>,
    })

    return updated
  },

  async deleteSprint(sprintId: number, userId: number) {
    const sprint = await db.query.sprints.findFirst({ where: eq(sprints.id, sprintId) })
    if (!sprint) throw new AppError(404, 'NOT_FOUND', 'Sprint not found')

    const workspaceId = await this.getProjectWorkspaceId(sprint.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER'])

    await db.delete(sprints).where(eq(sprints.id, sprintId))

    emitToProject(sprint.projectId, 'sprint:deleted', {
      sprintId,
      projectId: sprint.projectId,
    })

    return { success: true }
  },
}
