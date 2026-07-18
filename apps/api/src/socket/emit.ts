/**
 * emit.ts — Typed helper functions for emitting Socket.IO events from services.
 *
 * Usage from any service:
 *   import { emitToProject, emitToUser } from '../../socket/emit.js'
 *   emitToProject(projectId, 'task:updated', { ... })
 */
import { getIO } from './io.js'
import type { ServerToClientEvents } from './events.js'
import { db } from '../db/client.js'
import { eq, and } from 'drizzle-orm'
import { workspaceMembers } from '../db/schema.js'

type EventName = keyof ServerToClientEvents
type EventPayload<E extends EventName> = Parameters<ServerToClientEvents[E]>[0]

/**
 * Emit an event to every socket in a workspace room.
 * Relies on socket.join(`workspace:${workspaceId}`) during connection.
 */
export function emitToWorkspace<E extends EventName>(
  workspaceId: number,
  event: E,
  payload: EventPayload<E>
): void {
  try {
    getIO().to(`workspace:${workspaceId}`).emit(event, payload as any)
  } catch {
    // IO may not be initialized in test environments — fail silently
  }
}

/**
 * Emit an event to every socket in a project room.
 */
export function emitToProject<E extends EventName>(
  projectId: number,
  event: E,
  payload: EventPayload<E>
): void {
  try {
    const room = `project:${projectId}`
    console.log(`[Socket.IO Emit] Room: ${room} | Event: ${event}`, JSON.stringify(payload).slice(0, 200))
    getIO().to(room).emit(event, payload as any)
  } catch {
    // IO may not be initialized in test environments — fail silently
  }
}

/**
 * Emit an event only to a specific user (all their connected sockets).
 * Relies on socket.join(`user:${userId}`) during connection or socket.data.userId.
 * Re-verifies workspace membership at the exact moment of emit if workspaceId is specified or in payload.
 */
export async function emitToUser<E extends EventName>(
  userId: number,
  event: E,
  payload: EventPayload<E>,
  opts?: { workspaceId?: number }
): Promise<void> {
  try {
    const wsId = opts?.workspaceId ?? (payload as any)?.workspaceId
    if (wsId !== undefined && wsId !== null && !isNaN(Number(wsId))) {
      const member = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, Number(wsId)),
          eq(workspaceMembers.userId, userId)
        )
      })
      if (!member) {
        return
      }
    }
    const io = getIO()
    io.to(`user:${userId}`).emit(event, payload as any)
  } catch {
    // IO may not be initialized in test environments — fail silently
  }
}
