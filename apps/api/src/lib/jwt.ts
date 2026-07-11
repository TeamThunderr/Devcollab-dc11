import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export type JwtPayload = {
  userId: number
}

export const signToken = (payload: JwtPayload, expiresIn: string | number = '7d'): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn as any })
}

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}
