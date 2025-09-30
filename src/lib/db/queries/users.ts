import { eq, and } from 'drizzle-orm'
import { db } from '../drizzle'
import { users, groupMemberships, type User } from '../schema'
import { getSession } from '@/lib/auth/session'

export async function getUser(): Promise<User | null> {
  const session = await getSession()
  if (!session?.user?.id) {
    return null
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  return result.length > 0 ? result[0] : null
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
