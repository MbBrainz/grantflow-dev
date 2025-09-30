import { eq, and, desc, sql, or, isNull } from 'drizzle-orm'
import { db } from '../drizzle'
import {
  reviews,
  groupMemberships,
  groups,
  submissions,
  milestones,
} from '../schema'
import { getUser } from './users'

export async function getReviewsForSubmission(submissionId: number) {
  return await db.query.reviews.findMany({
    where: eq(reviews.submissionId, submissionId),
    with: {
      reviewer: {
        columns: {
          id: true,
          name: true,
          primaryRole: true,
        },
      },
      discussion: {
        columns: {
          id: true,
          type: true,
        },
      },
    },
    orderBy: [desc(reviews.createdAt)],
  })
}

export async function isUserGroupMember(
  userId: number,
  groupId?: number,
  role?: 'admin' | 'member'
): Promise<boolean> {
  const whereConditions = [
    eq(groupMemberships.userId, userId),
    eq(groupMemberships.isActive, true),
  ]

  if (groupId) {
    whereConditions.push(eq(groupMemberships.groupId, groupId))
  }
  if (role) {
    whereConditions.push(eq(groupMemberships.role, role))
  }

  const result = await db
    .select()
    .from(groupMemberships)
    .where(and(...whereConditions))
    .limit(1)

  return result.length > 0
}

export async function isUserReviewer(
  userId: number,
  groupId?: number
): Promise<boolean> {
  const whereConditions = [
    eq(groupMemberships.userId, userId),
    eq(groupMemberships.isActive, true),
    eq(groups.type, 'committee'),
  ]

  if (groupId) {
    whereConditions.push(eq(groupMemberships.groupId, groupId))
  }

  const result = await db
    .select()
    .from(groupMemberships)
    .innerJoin(groups, eq(groupMemberships.groupId, groups.id))
    .where(and(...whereConditions))
    .limit(1)

  return result.length > 0
}

export async function checkIsReviewer(userId: number) {
  return await isUserReviewer(userId)
}

export async function getReviewerPendingActions() {
  const user = await getUser()
  if (!user) {
    return { submissionsNeedingVote: [], milestonesNeedingReview: [] }
  }

  const userGroups = await db
    .select({ groupId: groupMemberships.groupId })
    .from(groupMemberships)
    .innerJoin(groups, eq(groupMemberships.groupId, groups.id))
    .where(
      and(
        eq(groupMemberships.userId, user.id),
        eq(groupMemberships.isActive, true),
        eq(groups.type, 'committee')
      )
    )

  if (userGroups.length === 0) {
    return { submissionsNeedingVote: [], milestonesNeedingReview: [] }
  }

  const groupIds = userGroups.map(g => g.groupId)

  const submissionsInGroups = await db.query.submissions.findMany({
    where: and(
      sql`${submissions.reviewerGroupId} IN (${sql.join(
        groupIds.map(id => sql`${id}`),
        sql`, `
      )})`,
      or(
        eq(submissions.status, 'submitted'),
        eq(submissions.status, 'under_review')
      )
    ),
    with: {
      submitter: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewerGroup: {
        columns: {
          id: true,
          name: true,
          description: true,
          logoUrl: true,
          focusAreas: true,
        },
      },
      grantProgram: {
        columns: {
          id: true,
          name: true,
          fundingAmount: true,
        },
      },
    },
  })

  const submissionsNeedingVote = []
  for (const submission of submissionsInGroups) {
    const existingVote = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.submissionId, submission.id),
        eq(reviews.reviewerId, user.id),
        isNull(reviews.milestoneId)
      ),
    })

    if (!existingVote) {
      submissionsNeedingVote.push({
        ...submission,
        actionType: 'submission_vote',
        actionDescription: 'Vote needed on submission',
        daysOld: Math.floor(
          (Date.now() -
            new Date(submission.appliedAt || submission.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      })
    }
  }

  const reviewerSubmissionIds = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      sql`${submissions.reviewerGroupId} IN (${sql.join(
        groupIds.map(id => sql`${id}`),
        sql`, `
      )})`
    )

  const submissionIds = reviewerSubmissionIds.map(s => s.id)

  const milestonesNeedingReview =
    submissionIds.length > 0
      ? await db.query.milestones.findMany({
          where: and(
            sql`${milestones.submissionId} IN (${sql.join(
              submissionIds.map(id => sql`${id}`),
              sql`, `
            )})`,
            or(
              eq(milestones.status, 'submitted'),
              eq(milestones.status, 'under_review')
            )
          ),
          with: {
            submission: {
              columns: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        })
      : []

  const milestonesWithDetails = await Promise.all(
    milestonesNeedingReview.map(async milestone => {
      const submissionDetails = await db.query.submissions.findFirst({
        where: eq(submissions.id, milestone.submission.id),
        with: {
          submitter: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewerGroup: {
            columns: {
              id: true,
              name: true,
              description: true,
              logoUrl: true,
            },
          },
        },
      })

      return {
        ...milestone,
        submission: {
          ...milestone.submission,
          submitter: submissionDetails?.submitter,
          reviewerGroup: submissionDetails?.reviewerGroup,
        },
      }
    })
  )

  const milestonesNeedingReviewFiltered = []
  for (const milestone of milestonesWithDetails) {
    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.milestoneId, milestone.id),
        eq(reviews.reviewerId, user.id)
      ),
    })

    if (!existingReview) {
      milestonesNeedingReviewFiltered.push({
        ...milestone,
        actionType: 'milestone_review',
        actionDescription: 'Milestone review needed',
        daysOld: milestone.submittedAt
          ? Math.floor(
              (Date.now() - new Date(milestone.submittedAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
      })
    }
  }

  return {
    submissionsNeedingVote,
    milestonesNeedingReview: milestonesNeedingReviewFiltered,
  }
}
