
import { and, eq, desc, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { workspaceMembers, workspaces, projects, tasks, users, workspaceInvitations } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import type { AddMemberInput, CreateWorkspaceInput, UpdateMemberRoleInput, UpdateWorkspaceInput, InviteMemberInput } from './workspaces.schema.js'
import { emailService } from '../auth/email.service.js'
import crypto from 'crypto'
import { emitToWorkspace } from '../../socket/emit.js'
import { env } from '../../config/env.js'

export const workspacesService = {
  async createWorkspace(userId: number, data: CreateWorkspaceInput) {
    return await db.transaction(async (tx) => {
      const [workspace] = await tx
        .insert(workspaces)
        .values({
          name: data.name,
          slug: data.slug,
          description: data.description,
          ownerId: userId,
        })
        .returning()

      if (!workspace) {
        throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to create workspace')
      }

      await tx.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: userId,
        role: 'OWNER',
      })

      return workspace
    })
  },

  async getWorkspaces(userId: number) {
    // Drizzle currently doesn't map relation fields optimally in some manual queries,
    // so we just do a join since we might not have defined relations explicitly in schema.ts.
    const userWorkspaces = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        description: workspaces.description,
        ownerId: workspaces.ownerId,
        createdAt: workspaces.createdAt,
      })
      .from(workspaces)
      .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, userId))
      .orderBy(desc(workspaces.createdAt))

    return userWorkspaces
  },

  async getMyWorkspaces(userId: number) {
    const userWorkspaces = await db.execute(sql`
      SELECT 
        w.id,
        w.name,
        w.slug,
        w.logo,
        wm.role,
        u.plan,
        (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as "memberCount",
        (SELECT COUNT(*) FROM projects WHERE workspace_id = w.id) as "projectCount"
      FROM workspaces w
      INNER JOIN workspace_members wm ON w.id = wm.workspace_id
      INNER JOIN users u ON w.owner_id = u.id
      WHERE wm.user_id = ${userId}
      ORDER BY w.created_at DESC
    `)

    return userWorkspaces.rows.map((row: any) => ({
      id: Number(row.id),
      name: row.name,
      slug: row.slug,
      logo: row.logo,
      role: row.role,
      plan: row.plan,
      memberCount: Number(row.memberCount),
      projectCount: Number(row.projectCount),
    }))
  },

  async getWorkspaceStats(workspaceId: number, userId: number) {
    await this.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    const [projectCount] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId))

    const [memberCount] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId))

    const [taskCount] = await db
      .select({ count: sql<number>`cast(count(${tasks.id}) as integer)` })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(projects.workspaceId, workspaceId))

    return {
      activeProjects: projectCount?.count || 0,
      teamMembers: memberCount?.count || 0,
      totalTasks: taskCount?.count || 0,
    }
  },

  async getWorkspaceTasks(workspaceId: number, userId: number) {
    await this.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    const workspaceTasks = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        assigneeId: tasks.assigneeId,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(projects.workspaceId, workspaceId))
      .orderBy(desc(tasks.createdAt))

    return workspaceTasks
  },

  async getWorkspaceMembers(workspaceId: number, userId: number) {
    await this.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    const activeMembers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatar,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.createdAt,
        status: sql<string>`'Active'`,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId))

    const pendingInvitations = await db
      .select({
        id: sql<string>`'pending_' || ${workspaceInvitations.id}::text`,
        name: sql<string>`'Pending User'`,
        email: workspaceInvitations.email,
        avatarUrl: sql<string>`null`,
        role: workspaceInvitations.role,
        joinedAt: workspaceInvitations.createdAt,
        status: sql<string>`'Pending'`,
      })
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspaceId, workspaceId),
          eq(workspaceInvitations.status, 'PENDING')
        )
      )

    return [...activeMembers, ...pendingInvitations].sort((a, b) => a.name.localeCompare(b.name))
  },

  async updateWorkspace(workspaceId: number, userId: number, data: UpdateWorkspaceInput) {
    await this.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN'])

    const [workspace] = await db
      .update(workspaces)
      .set(data)
      .where(eq(workspaces.id, workspaceId))
      .returning()

    if (!workspace) throw new AppError(404, 'NOT_FOUND', 'Workspace not found')
    return workspace
  },

  async deleteWorkspace(workspaceId: number, userId: number) {
    await this.checkPermission(workspaceId, userId, ['OWNER'])

    // Drizzle will handle cascade deletions if setup in DB, but for now just delete
    const [workspace] = await db.delete(workspaces).where(eq(workspaces.id, workspaceId)).returning()
    if (!workspace) throw new AppError(404, 'NOT_FOUND', 'Workspace not found')
    
    return { success: true }
  },

  async checkPermission(workspaceId: number, userId: number, requiredRoles: string[]) {
    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )

    if (!member) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied')
    }

    if (!requiredRoles.map(r => r.toUpperCase()).includes(member.role.toUpperCase())) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions')
    }

    return member
  },

  async addMember(workspaceId: number, inviterId: number, data: AddMemberInput) {
    // Only OWNER or ADMIN can add members
    await this.checkPermission(workspaceId, inviterId, ['OWNER', 'ADMIN'])

    const [member] = await db
      .insert(workspaceMembers)
      .values({
        workspaceId,
        userId: data.userId,
        role: data.role,
      })
      .returning()

    if (!member) {
      throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to add member')
    }

    emitToWorkspace(workspaceId, 'member:added', { userId: data.userId, role: data.role });
    return member
  },

  async updateMemberRole(
    workspaceId: number,
    targetUserId: number,
    updaterId: number,
    data: UpdateMemberRoleInput
  ) {
    const updaterMember = await this.checkPermission(workspaceId, updaterId, ['OWNER', 'ADMIN'])

    // Fetch target to prevent ADMIN from changing an OWNER's role
    const [targetMember] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, targetUserId)
        )
      )

    if (!targetMember) {
      throw new AppError(404, 'NOT_FOUND', 'Member not found')
    }

    if (targetMember.role === 'OWNER' && updaterMember.role !== 'OWNER') {
      throw new AppError(403, 'FORBIDDEN', 'Only the workspace owner can modify an owner role')
    }

    const [member] = await db
      .update(workspaceMembers)
      .set({ role: data.role.toUpperCase() as any })
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, targetUserId)
        )
      )
      .returning()

    if (member) {
      emitToWorkspace(workspaceId, 'member:updated', { userId: targetUserId, role: member.role });
    }
    return member
  },

  async updateInvitationRole(workspaceId: number, invitationId: number, updaterId: number, data: UpdateMemberRoleInput) {
    await this.checkPermission(workspaceId, updaterId, ['OWNER', 'ADMIN'])

    const [invitation] = await db
      .update(workspaceInvitations)
      .set({ role: data.role.toUpperCase() as any })
      .where(
        and(
          eq(workspaceInvitations.id, invitationId),
          eq(workspaceInvitations.workspaceId, workspaceId)
        )
      )
      .returning()

    if (!invitation) {
      throw new AppError(404, 'NOT_FOUND', 'Invitation not found')
    }

    emitToWorkspace(workspaceId, 'member:updated', { userId: `pending_${invitationId}` as any, role: invitation.role });
    return { workspaceId, userId: `pending_${invitationId}` as any, role: invitation.role, createdAt: invitation.createdAt }
  },

  async removeMember(workspaceId: number, targetUserId: number, requesterId: number) {
    if (targetUserId !== requesterId) {
      // Must be ADMIN or OWNER to remove others
      await this.checkPermission(workspaceId, requesterId, ['OWNER', 'ADMIN'])
      
      // Additional check: an ADMIN cannot remove an OWNER or another ADMIN (omitted for brevity, assume OWNER does it)
    }

    const [deletedMember] = await db
      .delete(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, targetUserId)
        )
      )
      .returning()

    if (!deletedMember) throw new AppError(404, 'NOT_FOUND', 'Member not found')
    emitToWorkspace(workspaceId, 'member:removed', { userId: targetUserId });
    return { success: true }
  },

  async revokeInvitation(workspaceId: number, invitationId: number, requesterId: number) {
    await this.checkPermission(workspaceId, requesterId, ['OWNER', 'ADMIN'])

    const [deletedInvitation] = await db
      .delete(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.id, invitationId),
          eq(workspaceInvitations.workspaceId, workspaceId)
        )
      )
      .returning()

    if (!deletedInvitation) {
      throw new AppError(404, 'NOT_FOUND', 'Invitation not found')
    }
    
    // Emit event to update UI
    emitToWorkspace(workspaceId, 'member:removed', { userId: `pending_${invitationId}` as any });
    
    return { success: true }
  },

  async inviteMember(workspaceId: number, inviterId: number, input: InviteMemberInput) {
    // Check if inviter has permission
    const [inviter] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, inviterId)
        )
      )
      .limit(1)

    if (!inviter || (inviter.role !== 'OWNER' && inviter.role !== 'ADMIN')) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to invite members')
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1)

    if (!workspace) {
      throw new AppError(404, 'NOT_FOUND', 'Workspace not found')
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1)

    if (existingUser) {
      const [existingMember] = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspace.id),
            eq(workspaceMembers.userId, existingUser.id)
          )
        )
        .limit(1)

      if (existingMember) {
        throw new AppError(400, 'BAD_REQUEST', 'User is already a member of this workspace')
      }
    }

    const [existingInvitation] = await db
      .select()
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspaceId, workspace.id),
          eq(workspaceInvitations.email, input.email),
          eq(workspaceInvitations.status, 'PENDING')
        )
      )
      .limit(1)

    if (existingInvitation) {
      throw new AppError(400, 'BAD_REQUEST', 'User already has a pending invitation')
    }

    const invitationCode = 'DEV-' + crypto.randomBytes(4).toString('hex').toUpperCase()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.insert(workspaceInvitations).values({
      workspaceId,
      email: input.email,
      code: invitationCode,
      role: input.role,
      status: 'PENDING',
      expiresAt
    })
    const rejectUrl = `${env.FRONTEND_URL}/reject-invite?slug=${workspace.slug}&email=${input.email}`
    const inviteUrl = `${env.FRONTEND_URL}/invite/${workspace.slug}`

    await emailService.sendWorkspaceInvite(
      input.email, 
      workspace.name, 
      inviteUrl,
      rejectUrl,
      invitationCode
    )

    return { success: true, message: 'Invitation sent', status: 'Pending' }
  },

  async rejectInvitation(slug: string, email: string) {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1)

    if (!workspace) throw new AppError(404, 'NOT_FOUND', 'Workspace not found')

    const [invitation] = await db
      .select()
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspaceId, workspace.id),
          eq(workspaceInvitations.email, email),
          eq(workspaceInvitations.status, 'PENDING')
        )
      )
      .limit(1)

    if (!invitation) {
      throw new AppError(404, 'NOT_FOUND', 'Pending invitation not found or already processed')
    }

    await db.update(workspaceInvitations)
      .set({ status: 'REJECTED', expiresAt: new Date() })
      .where(eq(workspaceInvitations.id, invitation.id))

    emitToWorkspace(workspace.id, 'invitation:rejected', { email })

    return { success: true }
  },

  async joinWorkspace(slug: string, userId: number, code: string) {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1)

    if (!workspace) {
      throw new AppError(404, 'NOT_FOUND', 'Workspace not found')
    }

    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!currentUser) {
      throw new AppError(404, 'NOT_FOUND', 'User not found')
    }

    // 1. Validate the invitation code FIRST
    const [invitation] = await db
      .select()
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspaceId, workspace.id),
          eq(workspaceInvitations.code, code)
        )
      )
      .limit(1)

    if (!invitation) {
      throw new AppError(400, 'BAD_REQUEST', 'This invitation has expired or is no longer valid.')
    }

    if (invitation.status === 'REJECTED' || invitation.status === 'ACCEPTED') {
      throw new AppError(400, 'BAD_REQUEST', 'This invitation has expired or is no longer valid.')
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      throw new AppError(400, 'BAD_REQUEST', 'This invitation has expired or is no longer valid.')
    }

    // 2. Mark this specific invitation as accepted (and any others for this exact email to clean up duplicates)
    await db
      .update(workspaceInvitations)
      .set({ status: 'ACCEPTED' })
      .where(
        and(
          eq(workspaceInvitations.workspaceId, workspace.id),
          eq(workspaceInvitations.email, invitation.email)
        )
      )

    // 3. Check if user is already a member
    const [existing] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspace.id),
          eq(workspaceMembers.userId, userId)
        )
      )
      .limit(1)

    if (existing) {
      // If the current user has other invitations under their own email, clean those up too
      if (currentUser.email !== invitation.email) {
        await db
          .update(workspaceInvitations)
          .set({ status: 'ACCEPTED' })
          .where(
            and(
              eq(workspaceInvitations.workspaceId, workspace.id),
              eq(workspaceInvitations.email, currentUser.email)
            )
          )
      }
      return { workspaceId: workspace.id, joined: true }
    }

    // 4. Add as member with the role from the invitation
    await db
      .insert(workspaceMembers)
      .values({
        workspaceId: workspace.id,
        userId,
        role: invitation.role,
      })
      
    // If they logged in with a different email than invited, clean up invites for their actual email too
    if (currentUser.email !== invitation.email) {
      await db
        .update(workspaceInvitations)
        .set({ status: 'ACCEPTED' })
        .where(
          and(
            eq(workspaceInvitations.workspaceId, workspace.id),
            eq(workspaceInvitations.email, currentUser.email)
          )
        )
    }

    emitToWorkspace(workspace.id, 'member:joined', { userId, role: invitation.role })

    return { workspaceId: workspace.id, joined: true }
  }
}
