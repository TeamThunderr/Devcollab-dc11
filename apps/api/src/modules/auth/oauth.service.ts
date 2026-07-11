import { AppError } from '../../lib/errors.js'

export class OAuthService {
  async getGoogleUser(token: string) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch from Google')
      const data: any = await response.json()
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatarUrl: data.picture
      }
    } catch {
      throw new AppError(401, 'Failed to fetch Google profile', 'OAUTH_FAILED')
    }
  }

  async getGithubUser(token: string) {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch from GitHub')
      const data: any = await response.json()
      
      let email = data.email
      if (!email) {
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const emails: any = await emailsResponse.json()
        const primaryEmail = emails.find((e: any) => e.primary && e.verified)
        email = primaryEmail ? primaryEmail.email : emails[0]?.email
      }
      
      if (!email) {
        throw new AppError(400, 'No email found from GitHub', 'NO_EMAIL')
      }

      return {
        id: data.id.toString(),
        email,
        name: data.name || data.login,
        avatarUrl: data.avatar_url
      }
    } catch {
      throw new AppError(401, 'Failed to fetch GitHub profile', 'OAUTH_FAILED')
    }
  }
}
export const oauthService = new OAuthService()
