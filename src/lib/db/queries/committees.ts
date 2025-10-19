import { eq, and } from 'drizzle-orm'
import { db } from '../drizzle'
import { groups, groupMemberships, type Group } from '../schema'
import { getUser } from './users'

/**
 * Get committee by ID with related data
 */
export async function getCommitteeById(id: number) {
  const committee = await db.query.groups.findFirst({
    where: and(eq(groups.id, id), eq(groups.type, 'committee')),
    with: {
      grantPrograms: {
        where: eq(groups.isActive, true),
      },
      members: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              primaryRole: true,
            },
          },
        },
        where: eq(groupMemberships.isActive, true),
      },
      reviewingSubmissions: {
        orderBy: (submissions, { desc }) => [desc(submissions.createdAt)],
        limit: 5,
        with: {
          submitter: {
            columns: {
              id: true,
              name: true,
            },
          },
          grantProgram: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  return committee
}

/**
 * Check if the current user is an admin of the committee
 */
export async function isCommitteeAdmin(committeeId: number): Promise<boolean> {
  const user = await getUser()
  if (!user) return false

  const membership = await db.query.groupMemberships.findFirst({
    where: and(
      eq(groupMemberships.userId, user.id),
      eq(groupMemberships.groupId, committeeId),
      eq(groupMemberships.isActive, true)
    ),
  })

  return membership?.role === 'admin'
}

/**
 * Get all active committees
 */
export async function getActiveCommittees(): Promise<Group[]> {
  return await db.query.groups.findMany({
    where: and(eq(groups.type, 'committee'), eq(groups.isActive, true)),
    with: {
      grantPrograms: {
        where: eq(groups.isActive, true),
      },
    },
  })
}

export type CommitteeWithDetails = Awaited<ReturnType<typeof getCommitteeById>>
