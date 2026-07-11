import type { Server as HttpServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { env } from '../config/env.js'
import { createLogger } from '../lib/logger.js'
import { verifyToken } from '../lib/jwt.js'
import { setIO } from './io.js'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from './events.js'

const logger = createLogger('socket.io')

export type TypedIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>

export function initSocket(httpServer: HttpServer): TypedIO {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    httpServer,
    {
      cors: {
        origin: env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    }
  )

  // ── Store the singleton so services can emit ──────────────────────────────
  setIO(io as unknown as SocketIOServer)

  // ── JWT Authentication Middleware ─────────────────────────────────────────
  // Clients must send the JWT via handshake auth: socket = io(url, { auth: { token } })
  io.use((socket, next) => {
    let token = socket.handshake.auth?.token as string | undefined

    if (!token) {
      const cookieHeader = socket.handshake.headers.cookie
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split(';').map(c => {
            const [key, ...v] = c.trim().split('=')
            return [key, v.join('=')]
          })
        )
        token = cookies['token']
      }
    }

    if (!token) {
      return next(new Error('Authentication token missing'))
    }

    try {
      const payload = verifyToken(token)
      socket.data.userId = payload.userId
      logger.debug({ userId: payload.userId, socketId: socket.id }, 'Socket authenticated')
      next()
    } catch {
      return next(new Error('Authentication token invalid or expired'))
    }
  })

  // ── Connection Handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.data.userId
    logger.info({ userId, socketId: socket.id }, 'Client connected')

    // ── Workspace Rooms ─────────────────────────────────────────────────────
    socket.on('workspace:join', (workspaceId) => {
      const room = `workspace:${workspaceId}`
      socket.join(room)
      logger.debug({ userId, room }, 'Joined workspace room')

      // Broadcast presence to others in the room
      socket.to(room).emit('user:joined', { userId, roomId: room })
    })

    socket.on('workspace:leave', (workspaceId) => {
      const room = `workspace:${workspaceId}`
      socket.leave(room)
      logger.debug({ userId, room }, 'Left workspace room')

      socket.to(room).emit('user:left', { userId, roomId: room })
    })

    // ── Project Rooms ───────────────────────────────────────────────────────
    socket.on('project:join', (projectId) => {
      const room = `project:${projectId}`
      socket.join(room)
      logger.debug({ userId, room }, 'Joined project room')

      socket.to(room).emit('user:joined', { userId, roomId: room })
    })

    socket.on('project:leave', (projectId) => {
      const room = `project:${projectId}`
      socket.leave(room)
      logger.debug({ userId, room }, 'Left project room')

      socket.to(room).emit('user:left', { userId, roomId: room })
    })

    // ── Live Cursor / Presence ──────────────────────────────────────────────
    // Client sends its mouse position; server fans it out to the same project room
    socket.on('cursor:move', (payload) => {
      const room = `project:${payload.projectId}`
      // Broadcast to everyone else in the project room (not back to sender)
      socket.to(room).emit('cursor:move', { ...payload, userId })
    })

    // ── Collaborative Doc Editing ───────────────────────────────────────────
    // Client sends a content patch; server fans it out to project room
    // Note: For production you'd use OT/CRDT here (e.g. Yjs). This is a simple broadcast.
    socket.on('doc:edit', (payload) => {
      const room = `project:${payload.projectId}`
      socket.to(room).emit('doc:edit', { ...payload, userId })
    })

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info({ userId, socketId: socket.id, reason }, 'Client disconnected')
    })
  })

  logger.info('Socket.IO initialized with JWT auth and room handlers')
  return io
}
