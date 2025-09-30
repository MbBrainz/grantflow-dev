import { eq, desc } from 'drizzle-orm'
import { db } from '../drizzle'
import { payouts } from '../schema'
import { getMilestoneById } from './milestones'

// Payout queries
export async function getPayoutsByMilestone(milestoneId: number) {
  return await db
    .select()
    .from(payouts)
    .where(eq(payouts.milestoneId, milestoneId))
    .orderBy(desc(payouts.createdAt))
}

export async function getPayoutById(payoutId: number) {
  const result = await db
    .select()
    .from(payouts)
    .where(eq(payouts.id, payoutId))
    .limit(1)

  return result.length > 0 ? result[0] : null
}

export async function getMilestoneWithPayouts(milestoneId: number) {
  const milestone = await getMilestoneById(milestoneId)
  if (!milestone) return null

  const milestonePayouts = await getPayoutsByMilestone(milestoneId)

  return {
    ...milestone,
    payouts: milestonePayouts,
  }
}

export async function getSubmissionPayouts(submissionId: number) {
  return await db
    .select()
    .from(payouts)
    .where(eq(payouts.submissionId, submissionId))
    .orderBy(desc(payouts.createdAt))
}

export async function getGroupPayouts(groupId: number) {
  return await db.query.payouts.findMany({
    where: eq(payouts.groupId, groupId),
    with: {
      milestone: {
        columns: {
          id: true,
          title: true,
          submissionId: true,
        },
      },
      triggeredByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [desc(payouts.createdAt)],
  })
}
