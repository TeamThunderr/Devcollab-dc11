import type { Server as SocketIOServer } from 'socket.io'

/**
 * Module-level singleton for the Socket.IO server instance.
 * This avoids circular imports — any service imports `getIO()` directly.
 */
let _io: SocketIOServer | null = null

export function setIO(io: SocketIOServer): void {
  _io = io
}

export function getIO(): SocketIOServer {
  if (!_io) {
    throw new Error('Socket.IO server not initialized. Call setIO() first.')
  }
  return _io
}
