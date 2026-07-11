import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { users } from '../../db/schema.js'
import { AppError } from '../../lib/errors.js'
import type { UpdateProfileInput } from './users.schema.js'

export const usersService = {
  async getProfile(userId: number) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found')
    }

    return {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar,
      bio: user.bio,
      skills: user.skills || [],
      githubUrl: user.githubLink,
      plan: user.plan,
      createdAt: user.createdAt.toISOString(),
    }
  },

  async updateProfile(userId: number, data: UpdateProfileInput) {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning()

    if (!updatedUser) {
      throw new AppError(404, 'NOT_FOUND', 'User not found')
    }

    return {
      id: updatedUser.id.toString(),
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatar,
      bio: updatedUser.bio,
      skills: updatedUser.skills || [],
      githubUrl: updatedUser.githubLink,
      plan: updatedUser.plan,
      createdAt: updatedUser.createdAt.toISOString(),
    }
  },
}
