import { and, eq, desc, sql, inArray, or } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { projects, projectMembers, tasks, users, workspaceMembers, attachments, reactions, taskComments, codeSnippets, docs } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import { workspacesService } from '../workspaces/workspaces.service.js'
import { activityService } from '../activity/activity.service.js'
import { emitToWorkspace, emitToProject } from '../../socket/emit.js'
import type { CreateProjectInput, UpdateProjectInput, AddProjectMemberInput, UpdateProjectMemberInput } from './projects.schema.js'

export const projectsService = {
  async checkProjectPermission(projectId: number, userId: number, allowedRoles?: string[]) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })
    if (!project) {
      throw new AppError(404, 'NOT_FOUND', 'Project not found')
    }

    // Check workspace membership first
    const [wsMember] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, project.workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )

    if (!wsMember) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied to this workspace')
    }

    // Workspace OWNER or ADMIN always have lead permissions to all projects
    if (wsMember.role === 'OWNER' || wsMember.role === 'ADMIN') {
      return { project, role: wsMember.role }
    }

    // For other workspace members, check explicit project membership strictly
    const [projMember] = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      )

    if (!projMember) {
      throw new AppError(403, 'FORBIDDEN', 'You are not a member of this project')
    }

    if (allowedRoles && !allowedRoles.includes(projMember.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient project permissions')
    }

    return { project, role: projMember.role }
  },

  async getProjectWithDetails(projectRecord: typeof projects.$inferSelect) {
    const [taskCountResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(tasks)
      .where(eq(tasks.projectId, projectRecord.id))

    const membersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatar,
        role: projectMembers.role,
        joinedAt: projectMembers.createdAt,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectRecord.id))

    return {
      ...projectRecord,
      tasksCount: taskCountResult?.count || 0,
      members: membersList,
    }
  },

  async createProject(workspaceId: number, userId: number, data: CreateProjectInput) {
    // Only OWNER or ADMIN of workspace can create projects
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN'])

    const project = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(projects)
        .values({
          workspaceId,
          name: data.name,
          description: data.description || null,
          status: data.status || 'active',
          priority: data.priority || 'P2',
          createdBy: userId,
        })
        .returning()

      if (!inserted) {
        throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to create project')
      }

      await tx.insert(projectMembers).values({
        projectId: inserted.id,
        userId,
        role: 'OWNER',
      })

      return inserted
    })

    await activityService.logActivity({
      workspaceId,
      projectId: project.id,
      userId,
      actionType: 'created a new project',
      metadata: { projectName: project.name },
    }).catch(() => {})

    const detailedProject = await this.getProjectWithDetails(project)

    // Emit real-time event to workspace room so all connected clients get the new project immediately
    emitToWorkspace(workspaceId, 'project:created', {
      projectId: project.id,
      workspaceId,
      data: detailedProject as unknown as Record<string, unknown>,
    })

    return detailedProject
  },

  async getProjects(workspaceId: number, userId: number) {
    // Any member of the workspace can view workspace projects they have access to or check list
    const wsMember = await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    let whereClause: any = eq(projects.workspaceId, workspaceId)
    if (wsMember.role !== 'OWNER' && wsMember.role !== 'ADMIN') {
      const myProjectMembers = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.userId, userId))

      const myProjectIds = myProjectMembers.map((pm) => pm.projectId)
      if (myProjectIds.length === 0) {
        return []
      }
      whereClause = and(eq(projects.workspaceId, workspaceId), inArray(projects.id, myProjectIds))
    }

    const workspaceProjects = await db.query.projects.findMany({
      where: whereClause,
      orderBy: desc(projects.createdAt),
    })

    if (workspaceProjects.length === 0) {
      return []
    }

    const projectIds = workspaceProjects.map((p) => p.id)

    // Batch fetch task counts across all projects in 1 query
    const taskCounts = await db
      .select({
        projectId: tasks.projectId,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(tasks)
      .where(inArray(tasks.projectId, projectIds))
      .groupBy(tasks.projectId)

    const taskCountMap = new Map<number, number>(
      taskCounts.map((tc) => [tc.projectId, tc.count])
    )

    // Batch fetch all members across all projects in 1 query
    const allMembers = await db
      .select({
        projectId: projectMembers.projectId,
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatar,
        role: projectMembers.role,
        joinedAt: projectMembers.createdAt,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(inArray(projectMembers.projectId, projectIds))

    const membersMap = new Map<number, typeof allMembers>()
    for (const m of allMembers) {
      const list = membersMap.get(m.projectId) || []
      list.push(m)
      membersMap.set(m.projectId, list)
    }

    return workspaceProjects.map((p) => ({
      ...p,
      tasksCount: taskCountMap.get(p.id) || 0,
      members: membersMap.get(p.id) || [],
    }))
  },

  async getProject(projectId: number, userId: number) {
    const { project } = await this.checkProjectPermission(projectId, userId, ['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER', 'VIEWER'])
    return await this.getProjectWithDetails(project)
  },

  async updateProject(projectId: number, userId: number, data: UpdateProjectInput) {
    const { project } = await this.checkProjectPermission(projectId, userId, ['OWNER', 'ADMIN', 'TEAM_LEAD'])

    const updateData: any = { ...data, updatedAt: new Date() }
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.isArchived !== undefined) {
      updateData.isArchived = data.isArchived
      if (data.isArchived) updateData.status = 'archived'
      else if (project.status === 'archived') updateData.status = 'active'
    }

    const [updatedProject] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning()

    if (!updatedProject) throw new AppError(404, 'NOT_FOUND', 'Project not found')

    const detailedProject = await this.getProjectWithDetails(updatedProject)

    activityService.logActivity({
      workspaceId: project.workspaceId,
      projectId: project.id,
      userId,
      actionType: 'updated project settings',
      metadata: { changes: data },
    }).catch(() => {})

    // Emit real-time update event to both workspace room and project room
    emitToWorkspace(project.workspaceId, 'project:updated', {
      projectId: project.id,
      workspaceId: project.workspaceId,
      data: detailedProject as unknown as Record<string, unknown>,
    })
    emitToProject(project.id, 'project:updated', {
      projectId: project.id,
      workspaceId: project.workspaceId,
      data: detailedProject as unknown as Record<string, unknown>,
    })

    return detailedProject
  },

  async deleteProject(projectId: number, userId: number) {
    const { project } = await this.checkProjectPermission(projectId, userId, ['OWNER', 'ADMIN'])

    // Clean up polymorphic attachments and reactions belonging to project entities before deleting
    await db.transaction(async (tx) => {
      const projectTasks = await tx.select({ id: tasks.id }).from(tasks).where(eq(tasks.projectId, projectId))
      const projectDocs = await tx.select({ id: docs.id }).from(docs).where(eq(docs.projectId, projectId))
      const projectSnippets = await tx.select({ id: codeSnippets.id }).from(codeSnippets).where(eq(codeSnippets.projectId, projectId))
      
      const taskIds = projectTasks.map((t) => t.id)
      const docIds = projectDocs.map((d) => d.id)
      const snippetIds = projectSnippets.map((s) => s.id)

      let commentIds: number[] = []
      if (taskIds.length > 0) {
        const comments = await tx.select({ id: taskComments.id }).from(taskComments).where(inArray(taskComments.taskId, taskIds))
        commentIds = comments.map((c) => c.id)
      }

      // Cleanup attachments
      if (taskIds.length > 0) {
        await tx.delete(attachments).where(and(eq(attachments.entityType, 'TASK'), inArray(attachments.entityId, taskIds)))
      }
      if (docIds.length > 0) {
        await tx.delete(attachments).where(and(eq(attachments.entityType, 'DOC'), inArray(attachments.entityId, docIds)))
      }
      if (snippetIds.length > 0) {
        await tx.delete(attachments).where(and(eq(attachments.entityType, 'SNIPPET'), inArray(attachments.entityId, snippetIds)))
      }
      if (commentIds.length > 0) {
        await tx.delete(attachments).where(and(eq(attachments.entityType, 'COMMENT'), inArray(attachments.entityId, commentIds)))
      }

      // Cleanup reactions
      if (docIds.length > 0) {
        await tx.delete(reactions).where(and(eq(reactions.entityType, 'DOC'), inArray(reactions.entityId, docIds)))
      }
      if (commentIds.length > 0) {
        await tx.delete(reactions).where(and(eq(reactions.entityType, 'COMMENT'), inArray(reactions.entityId, commentIds)))
      }

      const [_deletedProject] = await tx
        .delete(projects)
        .where(eq(projects.id, projectId))
        .returning()

      if (!_deletedProject) throw new AppError(404, 'NOT_FOUND', 'Project not found')
    })

    activityService.logActivity({
      workspaceId: project.workspaceId,
      projectId: project.id,
      userId,
      actionType: 'deleted project',
      metadata: { projectName: project.name },
    }).catch(() => {})

    emitToWorkspace(project.workspaceId, 'project:deleted', {
      projectId: project.id,
      workspaceId: project.workspaceId,
    })
    emitToProject(project.id, 'project:deleted', {
      projectId: project.id,
      workspaceId: project.workspaceId,
    })

    return { success: true }
  },

  async getProjectMembers(projectId: number, userId: number) {
    await this.checkProjectPermission(projectId, userId, ['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER', 'VIEWER'])

    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatar,
        role: projectMembers.role,
        joinedAt: projectMembers.createdAt,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId))
      .orderBy(users.name)

    return members
  },

  async addProjectMember(projectId: number, requesterId: number, data: AddProjectMemberInput) {
    const { project } = await this.checkProjectPermission(projectId, requesterId, ['OWNER', 'ADMIN', 'TEAM_LEAD'])

    // Verify target user is in the workspace
    const [wsMember] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, project.workspaceId),
          eq(workspaceMembers.userId, data.userId)
        )
      )

    if (!wsMember) {
      throw new AppError(400, 'BAD_REQUEST', 'User must be a workspace member before joining the project')
    }

    const [existing] = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, data.userId)
        )
      )

    if (existing) {
      throw new AppError(409, 'CONFLICT', 'User is already a project member')
    }

    await db
      .insert(projectMembers)
      .values({
        projectId,
        userId: data.userId,
        role: data.role as any,
      })

    emitToProject(projectId, 'project:member_added', {
      projectId,
      userId: data.userId,
      role: data.role,
    })

    return { success: true }
  },

  async updateProjectMemberRole(projectId: number, targetUserId: number, requesterId: number, data: UpdateProjectMemberInput) {
    await this.checkProjectPermission(projectId, requesterId, ['OWNER', 'ADMIN'])

    if (data.role !== 'OWNER') {
      // Check if target is currently an OWNER
      const [currentMember] = await db.select().from(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, targetUserId)))
      if (currentMember && currentMember.role === 'OWNER') {
        const [ownerCountResult] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.role, 'OWNER')))
        if ((ownerCountResult?.count || 0) <= 1) {
          throw new AppError(400, 'BAD_REQUEST', 'Cannot downgrade the role of the last Project Owner')
        }
      }
    }

    const [updated] = await db
      .update(projectMembers)
      .set({ role: data.role as any })
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, targetUserId)
        )
      )
      .returning()

    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Project member not found')

    return updated
  },

  async removeProjectMember(projectId: number, targetUserId: number, requesterId: number) {
    if (targetUserId !== requesterId) {
      await this.checkProjectPermission(projectId, requesterId, ['OWNER', 'ADMIN', 'TEAM_LEAD'])
    }

    const [currentMember] = await db.select().from(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, targetUserId)))
    if (!currentMember) throw new AppError(404, 'NOT_FOUND', 'Project member not found')

    if (currentMember.role === 'OWNER') {
      const [ownerCountResult] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.role, 'OWNER')))
      if ((ownerCountResult?.count || 0) <= 1) {
        throw new AppError(400, 'BAD_REQUEST', 'Cannot remove the last Project Owner')
      }
    }

    const [deleted] = await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, targetUserId)
        )
      )
      .returning()

    if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Project member not found')

    emitToProject(projectId, 'project:member_removed', {
      projectId,
      userId: targetUserId,
    })

    return { success: true }
  },
}
