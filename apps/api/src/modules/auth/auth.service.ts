import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { eq, and, desc, isNull, gt, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { users, workspaces, workspaceMembers, oauthAccounts, passwordResetOtps, signupOtps } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import type { LoginInput, RegisterInput } from './auth.schema.js'
import { env } from '../../config/env.js'
import { emailService } from './email.service.js'

function formatUserResponse(user: any) {
  return {
    ...user,
    id: user.id.toString(),
    avatarUrl: user.avatar,
    skills: user.skills || [],
    createdAt: user.createdAt.toISOString()
  }
}

export const authService = {
  async register(data: RegisterInput) {
    const [existing] = await db.select().from(users).where(eq(users.email, data.email)).limit(1)

    if (existing) {
      throw new AppError(409, 'CONFLICT', 'Email is already registered')
    }

    // Verify OTP
    const [latestOtp] = await db.select().from(signupOtps)
      .where(and(eq(signupOtps.email, data.email), isNull(signupOtps.usedAt)))
      .orderBy(desc(signupOtps.createdAt))
      .limit(1)

    if (!latestOtp) throw new AppError(401, 'INVALID_OTP', 'No pending OTP verification found for this email')
    if (latestOtp.expiresAt < new Date()) throw new AppError(401, 'EXPIRED_OTP', 'OTP has expired')
    if (latestOtp.attemptCount >= 5) throw new AppError(429, 'OTP_BLOCKED', 'Too many failed attempts. Request a new OTP.')

    const isValid = await bcrypt.compare(data.otp, latestOtp.otpHash)
    if (!isValid) {
      await db.update(signupOtps)
        .set({ attemptCount: latestOtp.attemptCount + 1 })
        .where(eq(signupOtps.id, latestOtp.id))
      throw new AppError(401, 'INVALID_OTP', 'Invalid OTP')
    }

    // Mark OTP as used
    await db.update(signupOtps).set({ usedAt: new Date() }).where(eq(signupOtps.id, latestOtp.id))

    const passwordHash = await bcrypt.hash(data.password, 12)

    const [user] = await db
      .insert(users)
      .values({
        email: data.email,
        name: data.name,
        passwordHash,
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(data.name)}`,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        bio: users.bio,
        skills: users.skills,
        githubUrl: users.githubLink,
        createdAt: users.createdAt,
      })

    if (!user) {
      throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Failed to create user')
    }


    return formatUserResponse(user)
  },

  async login(data: LoginInput) {
    const [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1)

    if (!user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password')
    }
    
    if (!user.passwordHash) {
      throw new AppError(401, 'OAUTH_ONLY_ACCOUNT', 'This account was created using a social login (like Google). Please use social login, or reset your password to set one.')
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash)
    if (!valid) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password')
    }

    return formatUserResponse(user)
  },

  async handleOAuthLogin(email: string, name: string, provider: 'GOOGLE' | 'GITHUB', providerId: string, avatarUrl?: string) {
    const [existingOauth] = await db.select().from(oauthAccounts).where(eq(oauthAccounts.providerId, providerId)).limit(1)
    if (existingOauth) {
      const [user] = await db.select().from(users).where(eq(users.id, existingOauth.userId)).limit(1)
      return formatUserResponse(user)
    }

    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    
    if (user) {
      await db.insert(oauthAccounts).values({
        userId: user.id,
        provider,
        providerId
      })
      return formatUserResponse(user)
    } else {
      const [newUser] = await db.insert(users).values({
        email,
        name,
        passwordHash: null,
        avatar: avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`
      }).returning()
      
      if (!newUser) throw new Error('Failed to create user')
      user = newUser

      await db.insert(oauthAccounts).values({
        userId: user.id,
        provider,
        providerId
      })
      
      return formatUserResponse(user)
    }
  },

  async sendSignupOtp(email: string) {
    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existingUser) {
      throw new AppError(409, 'CONFLICT', 'Email is already registered')
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentRequests = await db.select().from(signupOtps)
      .where(and(eq(signupOtps.email, email), gt(signupOtps.createdAt, oneHourAgo)))
    
    if (recentRequests.length >= 5) {
      throw new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many signup attempts. Please try again later.')
    }

    // Cleanup expired unused ones
    await db.delete(signupOtps).where(and(
      eq(signupOtps.email, email),
      sql`${signupOtps.expiresAt} < NOW()`
    ))

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await db.insert(signupOtps).values({
      email,
      otpHash,
      expiresAt
    })

    await emailService.sendSignupOTP(email, otp)
  },

  async forgotPassword(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user) return

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentRequests = await db.select().from(passwordResetOtps)
      .where(and(eq(passwordResetOtps.userId, user.id), gt(passwordResetOtps.createdAt, oneHourAgo)))
    
    if (recentRequests.length >= 3) {
      throw new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many password reset requests. Please try again later.')
    }

    await db.delete(passwordResetOtps).where(and(
      eq(passwordResetOtps.userId, user.id),
      sql`${passwordResetOtps.expiresAt} < NOW()`
    ))

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await db.insert(passwordResetOtps).values({
      userId: user.id,
      otpHash,
      expiresAt
    })

    await emailService.sendPasswordResetOTP(email, otp)
  },

  async verifyResetOtp(email: string, otp: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user) throw new AppError(401, 'INVALID_OTP', 'Invalid OTP or email')

    const [latestOtp] = await db.select().from(passwordResetOtps)
      .where(and(eq(passwordResetOtps.userId, user.id), isNull(passwordResetOtps.usedAt)))
      .orderBy(desc(passwordResetOtps.createdAt))
      .limit(1)

    if (!latestOtp) throw new AppError(401, 'INVALID_OTP', 'Invalid or expired OTP')
    if (latestOtp.expiresAt < new Date()) throw new AppError(401, 'EXPIRED_OTP', 'OTP has expired')
    if (latestOtp.attemptCount >= 5) throw new AppError(429, 'OTP_BLOCKED', 'Too many failed attempts. Request a new OTP.')

    const isValid = await bcrypt.compare(otp, latestOtp.otpHash)
    
    if (!isValid) {
      await db.update(passwordResetOtps)
        .set({ attemptCount: latestOtp.attemptCount + 1 })
        .where(eq(passwordResetOtps.id, latestOtp.id))
      throw new AppError(401, 'INVALID_OTP', 'Invalid OTP')
    }

    return jwt.sign({ userId: user.id, otpId: latestOtp.id, purpose: 'password_reset' }, env.JWT_SECRET, { expiresIn: '15m' })
  },

  async resetPassword(resetToken: string, newPassword: string) {
    let payload: any
    try {
      payload = jwt.verify(resetToken, env.JWT_SECRET)
      if (payload.purpose !== 'password_reset') throw new Error()
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired reset token')
    }

    const { userId, otpId } = payload
    
    const [otpRecord] = await db.select().from(passwordResetOtps).where(eq(passwordResetOtps.id, otpId)).limit(1)
    if (!otpRecord || otpRecord.usedAt) {
      throw new AppError(401, 'TOKEN_USED', 'Reset token has already been used')
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await db.update(users).set({ passwordHash }).where(eq(users.id, userId))
    await db.update(passwordResetOtps).set({ usedAt: new Date() }).where(eq(passwordResetOtps.id, otpId))
  }
}
