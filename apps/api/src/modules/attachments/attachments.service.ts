import path from 'path'
import fs from 'fs/promises'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { attachments, projects, tasks, workspaceMembers } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import { workspacesService } from '../workspaces/workspaces.service.js'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'

export const attachmentsService = {
  async getProjectWorkspaceId(projectId: number) {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found')
    return project.workspaceId
  },

  async uploadAttachment(
    taskId: number,
    userId: number,
    file: { filename: string; mimetype: string; data: Buffer }
  ) {
    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')

    const workspaceId = await this.getProjectWorkspaceId(task.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER'])

    await fs.mkdir(UPLOAD_DIR, { recursive: true })

    const uniqueName = `${Date.now()}-${file.filename}`
    const filePath = path.join(UPLOAD_DIR, uniqueName)
    await fs.writeFile(filePath, file.data)

    const fileUrl = `/uploads/${uniqueName}`

    const [attachment] = await db
      .insert(attachments)
      .values({
        workspaceId,
        uploaderId: userId,
        entityType: 'TASK',
        entityId: taskId,
        fileName: file.filename,
        fileUrl,
        fileType: file.mimetype,
      })
      .returning()

    if (!attachment) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to save attachment')
    return attachment
  },

  async getAttachments(taskId: number, userId: number) {
    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')

    const workspaceId = await this.getProjectWorkspaceId(task.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    return await db.query.attachments.findMany({
      where: and(eq(attachments.entityType, 'TASK'), eq(attachments.entityId, taskId)),
    })
  },

  async deleteAttachment(attachmentId: number, userId: number) {
    const attachment = await db.query.attachments.findFirst({
      where: eq(attachments.id, attachmentId),
    })
    if (!attachment) throw new AppError(404, 'NOT_FOUND', 'Attachment not found')

    await workspacesService.checkPermission(attachment.workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    // Allow deletion only if OWNER/ADMIN or the uploader
    const [member] = await db.query.workspaceMembers.findMany({
      where: and(
        eq(workspaceMembers.workspaceId, attachment.workspaceId),
        eq(workspaceMembers.userId, userId)
      ),
    })
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN' && attachment.uploaderId !== userId)) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions')
    }

    const filePath = path.join(UPLOAD_DIR, path.basename(attachment.fileUrl))
    await fs.unlink(filePath).catch(() => { /* ignore */ })

    await db.delete(attachments).where(eq(attachments.id, attachmentId))
    return { success: true }
  },
}
