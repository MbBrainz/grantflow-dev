import { and, eq } from 'drizzle-orm'
import { getSession as getNextAuthSession } from '@/lib/auth/next-auth'
import { getSession as getCustomSession } from '@/lib/auth/session'
import { db } from '../drizzle'
import { groupMemberships, type User, users } from '../schema'

export async function getUser(): Promise<User | null> {
  // Try NextAuth session first (for GitHub OAuth)
  const nextAuthSession = await getNextAuthSession()
  if (nextAuthSession?.user?.id) {
    const userId = parseInt(nextAuthSession.user.id)
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (result.length > 0) {
      return result[0]
    }
  }

  // Fallback to custom JWT session (for email/password auth)
  const customSession = await getCustomSession()
  if (customSession?.user?.id) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, customSession.user.id))
      .limit(1)

    return result.length > 0 ? result[0] : null
  }

  return null
}

export async function getUserById(userId: number): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return result.length > 0 ? result[0] : null
}

export async function getUserGroups(userId: number) {
  return await db.query.groupMemberships.findMany({
    where: and(
      eq(groupMemberships.userId, userId),
      eq(groupMemberships.isActive, true)
    ),
    with: {
      group: true,
    },
  })
}

export async function getUserCommittees(userId: number) {
  const userMemberships = await getUserGroups(userId)
  return userMemberships
    .filter(membership => membership.group.type === 'committee')
    .map(membership => membership.group)
}

/**
 * Search for users by email or name
 */
export async function searchUsers(query: string, limit = 10) {
  const { ilike, or } = await import('drizzle-orm')

  const results = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      primaryRole: users.primaryRole,
    })
    .from(users)
    .where(
      or(ilike(users.email, `%${query}%`), ilike(users.name, `%${query}%`))
    )
    .limit(limit)

  return results
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  return result.length > 0 ? result[0] : null
}
