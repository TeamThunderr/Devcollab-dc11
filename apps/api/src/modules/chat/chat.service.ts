import { and, eq, asc } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { chatMessages, users, projectMembers, projects, workspaceMembers } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import { projectsService } from '../projects/projects.service.js'
import { activityService } from '../activity/activity.service.js'
import { emitToProject } from '../../socket/emit.js'
import type { CreateChatMessageInput } from './chat.schema.js'

export const chatService = {
  async getMessages(projectId: number, userId: number, channel: string) {
    // Strictly verify server-side that the user is authorized to access this project
    await projectsService.checkProjectPermission(projectId, userId)

    const messages = await db
      .select({
        id: chatMessages.id,
        projectId: chatMessages.projectId,
        userId: chatMessages.userId,
        channel: chatMessages.channel,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        senderName: users.name,
        avatarUrl: users.avatar,
        projectRole: projectMembers.role,
        workspaceRole: workspaceMembers.role,
      })
      .from(chatMessages)
      .leftJoin(users, eq(users.id, chatMessages.userId))
      .leftJoin(projects, eq(projects.id, chatMessages.projectId))
      .leftJoin(
        projectMembers,
        and(
          eq(projectMembers.projectId, chatMessages.projectId),
          eq(projectMembers.userId, chatMessages.userId)
        )
      )
      .leftJoin(
        workspaceMembers,
        and(
          eq(workspaceMembers.workspaceId, projects.workspaceId),
          eq(workspaceMembers.userId, chatMessages.userId)
        )
      )
      .where(
        and(
          eq(chatMessages.projectId, projectId),
          eq(chatMessages.channel, channel)
        )
      )
      .orderBy(asc(chatMessages.createdAt))

    return messages.map((m) => ({
      id: m.id,
      projectId: m.projectId,
      userId: m.userId,
      channel: m.channel,
      content: m.content,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
      senderName: m.senderName || 'Unknown User',
      senderRole: m.projectRole || m.workspaceRole || 'Member',
      avatarUrl: m.avatarUrl || null,
    }))
  },

  async sendMessage(projectId: number, userId: number, data: CreateChatMessageInput) {
    // Strictly verify collaborative access to the project
    const { role } = await projectsService.checkProjectPermission(
      projectId,
      userId,
      ['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER']
    )

    const [msg] = await db
      .insert(chatMessages)
      .values({
        projectId,
        userId,
        channel: data.channel || 'general',
        content: data.content,
      })
      .returning()

    if (!msg) {
      throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to insert chat message')
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    const payload = {
      id: msg.id,
      projectId: msg.projectId,
      userId: msg.userId,
      channel: msg.channel,
      content: msg.content,
      createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : String(msg.createdAt),
      senderName: user?.name || 'User',
      senderRole: role || 'Member',
      avatarUrl: user?.avatar || null,
    }

    emitToProject(projectId, 'chat:message', payload)

    // Mention detection and notification creation
    try {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        columns: { id: true, name: true, workspaceId: true },
      })

      if (project && project.workspaceId) {
        const matches = [...data.content.matchAll(/(?:^|\s)@([a-zA-Z0-9_.-]+)/g)]
        const handles = Array.from(new Set(matches.map(m => (m[1] || '').toLowerCase()).filter(Boolean)))

        if (handles.length > 0) {
          const wsMembers = await db
            .select({
              userId: users.id,
              name: users.name,
              email: users.email,
            })
            .from(workspaceMembers)
            .innerJoin(users, eq(users.id, workspaceMembers.userId))
            .where(eq(workspaceMembers.workspaceId, project.workspaceId))

          for (const wsMember of wsMembers) {
            if (wsMember.userId === userId) continue // Do not notify self

            const emailPrefix = (wsMember.email?.split('@')[0] || '').toLowerCase()
            const nameNoSpaces = (wsMember.name || '').replace(/\s+/g, '').toLowerCase()
            const nameLower = (wsMember.name || '').toLowerCase()

            const isMentioned = handles.some(h => 
              h === emailPrefix || h === nameNoSpaces || (wsMember.name && !wsMember.name.includes(' ') && h === nameLower)
            )

            if (isMentioned) {
              await activityService.createAndEmitNotification({
                workspaceId: project.workspaceId,
                recipientUserId: wsMember.userId,
                actorUserId: userId,
                type: 'mention',
                contextType: 'chat',
                contextId: msg.id,
                message: `${user?.name || 'Someone'} mentioned you in ${project.name} (#${data.channel || 'general'})`,
                link: `/projects/${projectId}/chat/${data.channel || 'general'}?messageId=${msg.id}`,
              })
            }
          }
        }
      }
    } catch (err) {
      // Do not block chat message sending if mention notification processing fails
      console.error('Failed to process mention notifications:', err)
    }

    return payload
  },
}

