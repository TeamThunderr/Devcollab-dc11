import { eq, and } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { docVersions, docs, projects, attachments, reactions } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import { workspacesService } from '../workspaces/workspaces.service.js'
import { embeddingsService } from '../ai/embeddings.service.js'
import { emitToProject } from '../../socket/emit.js'
import { activityService } from '../activity/activity.service.js'

import type { CreateDocInput, UpdateDocInput } from './docs.schema.js'

export const docsService = {
  async getProjectWorkspaceId(projectId: number) {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found')
    return project.workspaceId
  },

  async createDoc(projectId: number, userId: number, data: CreateDocInput) {
    const workspaceId = await this.getProjectWorkspaceId(projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER'])

    const [doc] = await db
      .insert(docs)
      .values({
        projectId,
        title: data.title,
        content: data.content,
        createdBy: userId,
      })
      .returning()

    if (!doc) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to create doc')

    // Generate and store embedding (fire-and-forget)
    embeddingsService.generateDocEmbedding(doc.title, doc.content).then((embedding) => {
      if (embedding.length > 0) {
        db.update(docs).set({ embedding }).where(eq(docs.id, doc.id)).execute().catch(console.error)
      }
    }).catch(console.error)

    // Emit real-time event
    emitToProject(projectId, 'doc:created', {
      docId: doc.id,
      projectId,
      workspaceId,
      data: doc as unknown as Record<string, unknown>,
    })


    activityService.logActivity({
      workspaceId,
      projectId,
      userId,
      actionType: 'created a document',
      metadata: { docId: doc.id, title: doc.title },
    }).catch(() => {})


    return doc
  },

  async getDocs(projectId: number, userId: number) {
    const workspaceId = await this.getProjectWorkspaceId(projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    return await db.query.docs.findMany({
      where: eq(docs.projectId, projectId),
      orderBy: (docs, { desc }) => [desc(docs.updatedAt)],
    })
  },

  async getDoc(docId: number, userId: number) {
    const doc = await db.query.docs.findFirst({ where: eq(docs.id, docId) })
    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Doc not found')

    const workspaceId = await this.getProjectWorkspaceId(doc.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    return doc
  },

  async updateDoc(docId: number, userId: number, data: UpdateDocInput) {
    const doc = await db.query.docs.findFirst({ where: eq(docs.id, docId) })
    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Doc not found')

    const workspaceId = await this.getProjectWorkspaceId(doc.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER'])

    // Snapshot the current content into a version before overwriting
    if (data.content && data.content !== doc.content) {
      await db.insert(docVersions).values({
        docId,
        content: doc.content,
        createdBy: userId,
      })
    }

    const [updatedDoc] = await db
      .update(docs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(docs.id, docId))
      .returning()

    if (!updatedDoc) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to update doc')

    // Update embedding if title or content changed (fire-and-forget)
    if (updatedDoc && (data.title !== undefined || data.content !== undefined)) {
      embeddingsService.generateDocEmbedding(updatedDoc.title, updatedDoc.content).then((embedding) => {
        if (embedding.length > 0) {
          db.update(docs).set({ embedding }).where(eq(docs.id, docId)).execute().catch(console.error)
        }
      }).catch(console.error)
    }

    // Emit real-time event
    emitToProject(doc.projectId, 'doc:updated', {
      docId,
      projectId: doc.projectId,
      workspaceId,
      data: updatedDoc as unknown as Record<string, unknown>,
    })

    if (!updatedDoc) throw new AppError(404, 'NOT_FOUND', 'Doc not found')

    activityService.logActivity({
      workspaceId,
      projectId: doc.projectId,
      userId,
      actionType: 'updated a document',
      metadata: { docId, title: updatedDoc.title },
    }).catch(() => {})


    return updatedDoc
  },

  async deleteDoc(docId: number, userId: number) {
    const doc = await db.query.docs.findFirst({ where: eq(docs.id, docId) })
    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Doc not found')

    const workspaceId = await this.getProjectWorkspaceId(doc.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER'])

    await db.transaction(async (tx) => {
      await tx.delete(attachments).where(and(eq(attachments.entityType, 'DOC'), eq(attachments.entityId, docId)))
      await tx.delete(reactions).where(and(eq(reactions.entityType, 'DOC'), eq(reactions.entityId, docId)))
      await tx.delete(docs).where(eq(docs.id, docId))
    })



    // Emit real-time event
    emitToProject(doc.projectId, 'doc:deleted', { docId, projectId: doc.projectId })

    return { success: true }
  },

  async getVersions(docId: number, userId: number) {
    const doc = await db.query.docs.findFirst({ where: eq(docs.id, docId) })
    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Doc not found')

    const workspaceId = await this.getProjectWorkspaceId(doc.projectId)
    await workspacesService.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

    return await db.query.docVersions.findMany({
      where: eq(docVersions.docId, docId),
      orderBy: (v, { desc }) => [desc(v.createdAt)],
    })
  },
}
