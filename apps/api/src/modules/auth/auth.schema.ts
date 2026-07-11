import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name is required'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
})

export const sendSignupOtpSchema = z.object({
  email: z.string().email(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const authResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    avatarUrl: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    skills: z.array(z.string()).optional(),
    githubUrl: z.string().nullable().optional(),
    createdAt: z.string().optional(),
  }),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
})

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(10),
  newPassword: z.string().min(8),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

