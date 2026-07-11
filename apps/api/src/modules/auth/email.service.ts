import { env } from '../../config/env.js'
import { AppError } from '../../lib/errors.js'

export class EmailService {
  async sendSignupOTP(email: string, otp: string) {
    if (!env.BREVO_API_KEY || env.BREVO_API_KEY === 'your_brevo_api_key') {
      console.log(`[Email Mock] Sending Signup OTP ${otp} to ${email}`)
      return
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        signal: AbortSignal.timeout(3000),
        headers: {
          'accept': 'application/json',
          'api-key': env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
          to: [{ email }],
          subject: 'Your DevCollab Sign Up Verification Code',
          htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to DevCollab!</h2>
              <p>Please use the following verification code to complete your registration. This code is valid for 10 minutes.</p>
              <div style="background-color: #f4f4f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; border-radius: 12px; margin: 30px 0;">
                ${otp}
              </div>
              <p>If you didn't attempt to sign up, please ignore this email.</p>
            </div>
          `
        })
      })

      if (!response.ok) {
        const errorData = await response.json() as any
        throw new AppError(500, 'EMAIL_FAILED', `Failed to send email: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Email Service Exception:', error)
      if (error && error.name === 'AppError') throw error
      console.log(`[Email Service Fallback Mock] Network error. Sending Signup OTP ${otp} to ${email}`)
      return;
    }
  }

  async sendPasswordResetOTP(email: string, otp: string) {
    if (!env.BREVO_API_KEY || env.BREVO_API_KEY === 'your_brevo_api_key') {
      console.log(`[Email Service Mock] Sending OTP ${otp} to ${email}`)
      return
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        signal: AbortSignal.timeout(3000),
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: env.BREVO_SENDER_NAME,
            email: env.BREVO_SENDER_EMAIL
          },
          to: [{ email }],
          subject: 'DevCollab Password Reset OTP',
          htmlContent: `
            <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
              <p>Hello,</p>
              <p>Your DevCollab password reset OTP is:</p>
              <h2 style="font-size: 24px; font-weight: bold; color: #000;">${otp}</h2>
              <p>This OTP will expire in 10 minutes.</p>
              <p>If you did not request this password reset, you can safely ignore this email.</p>
              <br>
              <p>- DevCollab Team</p>
            </div>
          `
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Brevo API Error:', errorData)
        throw new AppError(500, 'Failed to send email', 'EMAIL_SEND_FAILED')
      }
    } catch (error: any) {
      console.error('Email Service Exception:', error)
      if (error && error.name === 'AppError') throw error
      console.log(`[Email Service Fallback Mock] Network error. Sending OTP ${otp} to ${email}`)
      return;
    }
  }

  async sendWorkspaceInvite(email: string, workspaceName: string, inviteUrl: string, rejectUrl: string, invitationCode: string) {
    if (!env.BREVO_API_KEY || env.BREVO_API_KEY === 'your_brevo_api_key') {
      console.log(`[Email Service Mock] Sending Invite to ${email} for ${workspaceName}. Code: ${invitationCode}`)
      return
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        signal: AbortSignal.timeout(3000),
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
          to: [{ email }],
          subject: `You've been invited to join ${workspaceName} on DevCollab!`,
          htmlContent: `
            <div style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 24px; border-radius: 8px;">
              <h2 style="color: #000;">You're Invited!</h2>
              <p>You have been invited to join the workspace <strong>${workspaceName}</strong> on DevCollab.</p>
              
              <div style="margin: 24px 0; padding: 16px; background-color: #f9fafb; border-radius: 6px; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Invitation Code</p>
                <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #111827;">${invitationCode}</div>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #6b7280;">Use this invitation code when joining the workspace.</p>
              </div>

              <div style="margin: 30px 0; display: flex; gap: 16px;">
                <a href="${inviteUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center; display: inline-block;">Accept Invitation</a>
                <a href="${rejectUrl}" style="background-color: #fff; color: #ef4444; border: 1px solid #ef4444; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center; display: inline-block;">Reject Invitation</a>
              </div>
              
              <p style="font-size: 13px; color: #6b7280; border-top: 1px solid #eaeaea; padding-top: 16px;">
                If you reject this invitation, the invitation code will immediately become invalid and can no longer be used.
              </p>
              <br>
              <p>- DevCollab Team</p>
            </div>
          `
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Brevo API Error:', errorData)
        throw new AppError(500, 'Failed to send invite email', 'EMAIL_SEND_FAILED')
      }
    } catch (error: any) {
      console.error('Email Service Exception:', error)
      if (error && error.name === 'AppError') throw error
      console.log(`[Email Service Fallback Mock] Network error. Sending Invite to ${email}. Code: ${invitationCode}`)
      return;
    }
  }
}

export const emailService = new EmailService()
