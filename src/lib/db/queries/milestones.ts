import { eq, desc } from 'drizzle-orm'
import { db } from '../drizzle'
import {
  milestones,
  reviews,
  messages,
  payouts,
  type Milestone,
} from '../schema'

export async function getMilestonesBySubmission(
  submissionId: number
): Promise<Milestone[]> {
  return await db
    .select()
    .from(milestones)
    .where(eq(milestones.submissionId, submissionId))
    .orderBy(desc(milestones.createdAt))
}

export async function getMilestoneById(
  milestoneId: number
): Promise<Milestone | null> {
  const result = await db
    .select()
    .from(milestones)
    .where(eq(milestones.id, milestoneId))
    .limit(1)

  return result.length > 0 ? result[0] : null
}

export async function getSubmissionMilestonesOverview(submissionId: number) {
  const submissionMilestones = await db.query.milestones.findMany({
    where: eq(milestones.submissionId, submissionId),
    with: {
      discussions: {
        with: {
          messages: {
            with: {
              author: {
                columns: {
                  id: true,
                  name: true,
                  primaryRole: true,
                },
              },
            },
            orderBy: [messages.createdAt],
          },
        },
      },
      reviews: {
        with: {
          reviewer: {
            columns: {
              id: true,
              name: true,
              primaryRole: true,
            },
          },
        },
        orderBy: [reviews.createdAt],
      },
      payouts: {
        orderBy: [payouts.createdAt],
      },
    },
    orderBy: [milestones.createdAt],
  })

  const summary = {
    total: submissionMilestones.length,
    completed: submissionMilestones.filter(m => m.status === 'completed')
      .length,
    inProgress: submissionMilestones.filter(
      m => m.status === 'changes-requested'
    ).length,
    pending: submissionMilestones.filter(m => m.status === 'pending').length,
    underReview: submissionMilestones.filter(m => m.status === 'in-review')
      .length,
    totalAmount: submissionMilestones.reduce(
      (sum: number, m) => sum + (m.amount ?? 0),
      0
    ),
    paidAmount: submissionMilestones
      .filter(m => m.status === 'completed')
      .reduce((sum: number, m) => sum + (m.amount ?? 0), 0),
  }

  return {
    milestones: submissionMilestones,
    summary,
  }
}
