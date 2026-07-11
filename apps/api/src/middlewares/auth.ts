import type { FastifyReply, FastifyRequest } from 'fastify'
import { verifyToken } from '../lib/jwt.js'
import { AppError } from '../lib/errors.js'

export const requireAuth = async (request: FastifyRequest, _reply: FastifyReply) => {
  try {
    const token = request.cookies.token
    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const payload = verifyToken(token)
    // Attach user to request
    request.user = { id: payload.userId }
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token')
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: number
    }
  }
}
