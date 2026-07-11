/**
 * emit.ts — Typed helper functions for emitting Socket.IO events from services.
 *
 * Usage from any service:
 *   import { emitToProject, emitToUser } from '../../socket/emit.js'
 *   emitToProject(projectId, 'task:updated', { ... })
 */
import { getIO } from './io.js'
import type { ServerToClientEvents } from './events.js'

type EventName = keyof ServerToClientEvents
type EventPayload<E extends EventName> = Parameters<ServerToClientEvents[E]>[0]

/**
 * Emit an event to every socket in a workspace room.
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
    getIO().to(`project:${projectId}`).emit(event, payload as any)
  } catch {
    // IO may not be initialized in test environments — fail silently
  }
}

/**
 * Emit an event only to a specific user (all their connected sockets).
 * Relies on socket.data.userId being set during JWT auth.
 */
export async function emitToUser<E extends EventName>(
  userId: number,
  event: E,
  payload: EventPayload<E>
): Promise<void> {
  try {
    const io = getIO()
    const sockets = await io.fetchSockets()
    for (const socket of sockets) {
      if ((socket.data as any).userId === userId) {
        socket.emit(event, payload as any)
      }
    }
  } catch {
    // IO may not be initialized in test environments — fail silently
  }
}
