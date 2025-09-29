import { eq, desc, and, or, sql, inArray, isNull } from 'drizzle-orm'
import { db } from '../drizzle'
import {
  submissions,
  groupMemberships,
  groups,
  milestones,
  discussions,
  messages,
  reviews,
  notifications,
  type Submission,
  type SubmissionWithMilestones,
} from '../schema'
import { getUser } from './users'

// Basic submission queries
export async function getSubmissions(): Promise<Submission[]> {
  return await db
    .select()
    .from(submissions)
    .orderBy(desc(submissions.createdAt))
}

export async function getSubmissionsByUser(
  userId: number
): Promise<Submission[]> {
  return await db
    .select()
    .from(submissions)
    .where(eq(submissions.submitterId, userId))
    .orderBy(desc(submissions.createdAt))
}

export async function getSubmissionsByGroup(
  groupId: number,
  isSubmitter: boolean = true
): Promise<Submission[]> {
  const field = isSubmitter
    ? submissions.submitterGroupId
    : submissions.reviewerGroupId
  return await db
    .select()
    .from(submissions)
    .where(eq(field, groupId))
    .orderBy(desc(submissions.createdAt))
}

export async function getSubmissionById(
  submissionId: number
): Promise<SubmissionWithMilestones | null> {
  const result = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: {
      submitter: true,
      submitterGroup: true,
      reviewerGroup: true,
      grantProgram: true,
      milestones: true,
    },
  })

  return result || null
}

// Get all pending actions that require current reviewer's response/approval
export async function getAllSubmissionsForReview(statusFilter?: string) {
  const user = await getUser()
  if (!user) {
    return []
  }

  // Get groups where user is a member of committee-type groups
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

  // If user is not a member of any committee, return empty
  if (userGroups.length === 0) {
    return []
  }

  const groupIds = userGroups.map(g => g.groupId)

  // Build where conditions
  let whereConditions = [
    sql`${submissions.reviewerGroupId} IN (${sql.join(
      groupIds.map(id => sql`${id}`),
      sql`, `
    )})`,
  ]

  if (statusFilter) {
    whereConditions.push(eq(submissions.status, statusFilter))
  }

  const submissionsData = await db.query.submissions.findMany({
    where: and(...whereConditions),
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
          isActive: true,
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
    orderBy: [desc(submissions.createdAt)],
  })

  // Fetch milestones separately to avoid relation issues
  const submissionsWithMilestones = await Promise.all(
    submissionsData.map(async submission => {
      const submissionMilestones = await db
        .select({
          id: milestones.id,
          title: milestones.title,
          status: milestones.status,
          amount: milestones.amount,
        })
        .from(milestones)
        .where(eq(milestones.submissionId, submission.id))

      return {
        ...submission,
        milestones: submissionMilestones,
      }
    })
  )

  return submissionsWithMilestones
}

export async function getSubmissionStats() {
  const user = await getUser()
  if (!user) {
    return {
      total: 0,
      submitted: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
    }
  }

  // Get groups where user is a member of committee-type groups
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

  // If user is not a member of any committee, return zeros
  if (userGroups.length === 0) {
    return {
      total: 0,
      submitted: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
    }
  }

  const groupIds = userGroups.map(g => g.groupId)
  const groupFilter = sql`${submissions.reviewerGroupId} IN (${sql.join(
    groupIds.map(id => sql`${id}`),
    sql`, `
  )})`

  const totalResult = await db.select().from(submissions).where(groupFilter)
  const submittedResult = await db
    .select()
    .from(submissions)
    .where(and(groupFilter, eq(submissions.status, 'pending')))
  const underReviewResult = await db
    .select()
    .from(submissions)
    .where(and(groupFilter, eq(submissions.status, 'under_review')))
  const approvedResult = await db
    .select()
    .from(submissions)
    .where(and(groupFilter, eq(submissions.status, 'approved')))
  const rejectedResult = await db
    .select()
    .from(submissions)
    .where(and(groupFilter, eq(submissions.status, 'rejected')))

  return {
    total: totalResult.length || 0,
    submitted: submittedResult.length || 0,
    underReview: underReviewResult.length || 0,
    approved: approvedResult.length || 0,
    rejected: rejectedResult.length || 0,
  }
}

// Enhanced submission data with all related information for reviewer review
export async function getSubmissionForReviewerReview(submissionId: number) {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: {
      submitter: {
        columns: {
          id: true,
          name: true,
          email: true,
          primaryRole: true,
          githubId: true,
        },
      },
      reviewerGroup: {
        columns: {
          id: true,
          name: true,
          description: true,
          focusAreas: true,
        },
      },
      grantProgram: {
        columns: {
          id: true,
          name: true,
          description: true,
          fundingAmount: true,
          requirements: true,
        },
      },
      milestones: {
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
          },
          payouts: true,
        },
        orderBy: [milestones.createdAt],
      },
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
      notifications: {
        orderBy: [notifications.createdAt],
      },
    },
  })

  return submission
}

// Get current state data for a submission (recent activity, pending actions, etc.)
export async function getSubmissionCurrentState(submissionId: number) {
  const user = await getUser()
  if (!user) return null

  // Get recent activity across all related entities
  // First get discussion IDs for this submission
  const submissionDiscussions = await db
    .select({ id: discussions.id })
    .from(discussions)
    .where(eq(discussions.submissionId, submissionId))

  const discussionIds = submissionDiscussions.map(d => d.id)

  const recentMessages =
    discussionIds.length > 0
      ? await db.query.messages.findMany({
          where: inArray(messages.discussionId, discussionIds),
          with: {
            author: {
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
                submissionId: true,
                milestoneId: true,
              },
            },
          },
          orderBy: [desc(messages.createdAt)],
          limit: 10,
        })
      : []

  // Get pending reviews (submissions or milestones without reviewer's vote)
  const pendingSubmissionReviews = await db.query.reviews.findMany({
    where: and(
      eq(reviews.submissionId, submissionId),
      eq(reviews.reviewerId, user.id)
    ),
  })

  const pendingMilestoneReviews = await db.query.reviews.findMany({
    where: and(
      sql`${reviews.milestoneId} IN (
        SELECT ${milestones.id} FROM ${milestones} WHERE ${milestones.submissionId} = ${submissionId}
      )`,
      eq(reviews.reviewerId, user.id)
    ),
  })

  // Get active milestones (in_progress or submitted status)
  const activeMilestones = await db.query.milestones.findMany({
    where: and(
      eq(milestones.submissionId, submissionId),
      or(
        eq(milestones.status, 'in_progress'),
        eq(milestones.status, 'submitted'),
        eq(milestones.status, 'under_review')
      )
    ),
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
            orderBy: [desc(messages.createdAt)],
            limit: 3,
          },
        },
      },
    },
    orderBy: [milestones.dueDate],
  })

  return {
    recentMessages,
    pendingSubmissionReviews,
    pendingMilestoneReviews,
    activeMilestones,
    hasUserVotedOnSubmission: pendingSubmissionReviews.length > 0,
    pendingActions: {
      submissionVote: pendingSubmissionReviews.length === 0,
      milestoneReviews: pendingMilestoneReviews.length,
      activeMilestonesCount: activeMilestones.length,
    },
  }
}
