import { desc, eq } from 'drizzle-orm'
import { db } from '../drizzle'
import {
  type Milestone,
  messages,
  milestones,
  payouts,
  reviews,
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

export async function getMilestoneById(milestoneId: number) {
  const result = await db.query.milestones.findFirst({
    where: eq(milestones.id, milestoneId),
    with: {
      submission: {
        columns: {
          id: true,
          reviewerGroupId: true,
          submitterGroupId: true,
          submitterId: true,
        },
      },
    },
  })

  return result ?? null
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
