import type { FastifyReply, FastifyRequest } from 'fastify'
import { authService } from './auth.service.js'
import { oauthService } from './oauth.service.js'
import { signToken } from '../../lib/jwt.js'
import type { LoginInput, RegisterInput } from './auth.schema.js'
import { env } from '../../config/env.js'

// 7 days in milliseconds
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

function setAuthCookies(reply: FastifyReply, token: string) {
  reply.setCookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export const registerHandler = async (
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply
) => {
  const user = await authService.register(request.body)
  const token = signToken({ userId: Number(user.id) })
  setAuthCookies(reply, token)
  return { user }
}

export const loginHandler = async (
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) => {
  const user = await authService.login(request.body)
  const token = signToken({ userId: Number(user.id) })
  setAuthCookies(reply, token)
  return { user }
}

export const logoutHandler = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  reply.clearCookie('token', { path: '/' })
  return { success: true }
}

export const sendSignupOtpHandler = async (
  request: FastifyRequest<{ Body: { email: string } }>,
  _reply: FastifyReply
) => {
  const { email } = request.body
  await authService.sendSignupOtp(email)
  return { message: 'OTP sent successfully to your email.' }
}

export const forgotPasswordHandler = async (
  request: FastifyRequest<{ Body: { email: string } }>,
  _reply: FastifyReply
) => {
  const { email } = request.body
  await authService.forgotPassword(email)
  return { message: 'If an account exists, an OTP has been sent to your email.' }
}

export const verifyResetOtpHandler = async (
  request: FastifyRequest<{ Body: { email: string, otp: string } }>,
  _reply: FastifyReply
) => {
  const { email, otp } = request.body
  const resetToken = await authService.verifyResetOtp(email, otp)
  return { success: true, resetToken }
}

export const resetPasswordHandler = async (
  request: FastifyRequest<{ Body: { resetToken: string, newPassword: string } }>,
  reply: FastifyReply
) => {
  const { resetToken, newPassword } = request.body
  await authService.resetPassword(resetToken, newPassword)
  reply.clearCookie('token', { path: '/' })
  return { message: 'Password reset successfully.' }
}

export const googleCallbackHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { token } = await (request.server as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)
  const profile = await oauthService.getGoogleUser(token.access_token)
  
  const user = await authService.handleOAuthLogin(profile.email, profile.name, 'GOOGLE', profile.id, profile.avatarUrl)
  const jwtToken = signToken({ userId: Number(user.id) })
  setAuthCookies(reply, jwtToken)
  
  return reply.redirect(`${env.FRONTEND_URL}/select-workspace`)
}

export const githubCallbackHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { token } = await (request.server as any).githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)
  const profile = await oauthService.getGithubUser(token.access_token)
  
  const user = await authService.handleOAuthLogin(profile.email, profile.name, 'GITHUB', profile.id, profile.avatarUrl)
  const jwtToken = signToken({ userId: Number(user.id) })
  setAuthCookies(reply, jwtToken)
  
  return reply.redirect(`${env.FRONTEND_URL}/select-workspace`)
}
