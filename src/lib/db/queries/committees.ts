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
  // Join through submissions since milestones no longer have direct groupId
  const spentResult = await db
    .select({
      total: sum(milestones.amount),
    })
    .from(milestones)
    .innerJoin(submissions, eq(milestones.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.reviewerGroupId, committeeId),
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

  // Remaining: how much budget is left to allocate to new grants (clamped to 0)
  const remaining = Math.max(0, totalBudget - allocated)

  // Available: actual funds that can be paid out on existing grants
  // Constrained by both budget and allocated amounts
  const effectiveAllocated = Math.min(totalBudget, allocated)
  const available = Math.max(0, effectiveAllocated - spent)

  // Flag for over-allocation (allocated more than budget allows)
  const isOverAllocated = allocated > totalBudget

  return {
    totalBudget,
    allocated,
    spent,
    remaining,
    available,
    isOverAllocated,
  }
}

export type CommitteeWithDetails = Awaited<ReturnType<typeof getCommitteeById>>
export type CommitteeFinancials = Awaited<
  ReturnType<typeof getCommitteeFinancials>
>
