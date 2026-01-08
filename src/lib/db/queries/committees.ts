import { and, eq, sum } from 'drizzle-orm'
import { db } from '../drizzle'
import {
  type Group,
  groupMemberships,
  groups,
  milestones,
  submissions,
} from '../schema'
import { getUser } from './users'

/**
 * Get committee by ID with related data
 * Committee IS the grant program (budget fields are directly on the committee)
 */
export async function getCommitteeById(id: number) {
  const committee = await db.query.groups.findFirst({
    where: and(eq(groups.id, id), eq(groups.type, 'committee')),
    with: {
      members: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              primaryRole: true,
              walletAddress: true,
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
 * Committee IS the grant program (budget fields are directly on the committee)
 */
export async function getActiveCommittees(): Promise<Group[]> {
  return await db.query.groups.findMany({
    where: and(eq(groups.type, 'committee'), eq(groups.isActive, true)),
  })
}

/**
 * Get committee financial metrics
 * Calculates allocated, spent, and remaining budget
 */
export async function getCommitteeFinancials(committeeId: number) {
  // Get total allocated (sum of approved submissions)
  const allocatedResult = await db
    .select({
      total: sum(submissions.totalAmount),
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.reviewerGroupId, committeeId),
        eq(submissions.status, 'approved')
      )
    )

  // Get total spent (sum of completed milestones)
  const spentResult = await db
    .select({
      total: sum(milestones.amount),
    })
    .from(milestones)
    .where(
      and(
        eq(milestones.groupId, committeeId),
        eq(milestones.status, 'completed')
      )
    )

  const allocated = Number(allocatedResult[0]?.total ?? 0)
  const spent = Number(spentResult[0]?.total ?? 0)

  // Get the committee to access funding amount
  const committee = await db.query.groups.findFirst({
    where: eq(groups.id, committeeId),
    columns: {
      fundingAmount: true,
    },
  })

  const totalBudget = committee?.fundingAmount ?? 0
  const remaining = totalBudget - allocated
  const available = allocated - spent

  return {
    totalBudget,
    allocated,
    spent,
    remaining,
    available,
  }
}

export type CommitteeWithDetails = Awaited<ReturnType<typeof getCommitteeById>>
export type CommitteeFinancials = Awaited<
  ReturnType<typeof getCommitteeFinancials>
>
