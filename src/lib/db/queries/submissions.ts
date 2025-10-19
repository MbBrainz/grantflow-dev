import { eq, desc, and, or, sql, inArray } from 'drizzle-orm'
import { db } from '../drizzle'
import type { SubmissionStatus } from '../schema'
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
  isSubmitter = true
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
  const user = await getUser()
  const result = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: {
      submitter: true,
      submitterGroup: true,
      reviewerGroup: true,
      grantProgram: true,
      milestones: true,
      discussions: {
        with: {
          messages: {
            with: {
              author: true,
            },
            orderBy: [desc(messages.createdAt)],
          },
        },
      },
      reviews: {
        with: {
          reviewer: true,
        },
        orderBy: [desc(reviews.createdAt)],
      },
    },
  })

  if (!result) return null

  // Calculate user context server-side
  let userContext:
    | { isSubmissionOwner: boolean; isCommitteeReviewer: boolean }
    | undefined
  if (user) {
    const isSubmissionOwner = result.submitterId === user.id

    // Check if user is committee reviewer
    let isCommitteeReviewer = false
    if (result.reviewerGroupId && user.primaryRole === 'committee') {
      const membership = await db.query.groupMemberships.findFirst({
        where: and(
          eq(groupMemberships.userId, user.id),
          eq(groupMemberships.groupId, result.reviewerGroupId),
          eq(groupMemberships.isActive, true)
        ),
      })
      isCommitteeReviewer = !!membership
    }

    userContext = {
      isSubmissionOwner,
      isCommitteeReviewer,
    }
  }

  return {
    ...result,
    userContext,
  } as unknown as SubmissionWithMilestones
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
  const whereConditions = [
    sql`${submissions.reviewerGroupId} IN (${sql.join(
      groupIds.map(id => sql`${id}`),
      sql`, `
    )})`,
  ]

  if (statusFilter) {
    whereConditions.push(
      eq(submissions.status, statusFilter as SubmissionStatus)
    )
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

  return await Promise.all(
    submissionsData.map(async submission => {
      const submissionMilestones = await db.query.milestones.findMany({
        where: eq(milestones.submissionId, submission.id),
      })

      return {
        ...submission,
        milestones: submissionMilestones,
      }
    })
  )
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
    .where(and(groupFilter, eq(submissions.status, 'in-review')))
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

  // Get active milestones (in_progress or in-review status)
  const activeMilestones = await db.query.milestones.findMany({
    where: and(
      eq(milestones.submissionId, submissionId),
      or(
        eq(milestones.status, 'changes-requested'),
        eq(milestones.status, 'in-review')
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

export type SubmissionCurrentState = Awaited<
  ReturnType<typeof getSubmissionCurrentState>
>

/**
 * Get a submission with all related data including milestones, discussions, reviews
 */
export async function getSubmissionWithMilestones(
  id: number
): Promise<SubmissionWithMilestones | null> {
  try {
    const user = await getUser()
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, id),
      with: {
        milestones: {
          orderBy: [milestones.createdAt],
        },
        submitter: true,
        submitterGroup: true,
        reviewerGroup: true,
        grantProgram: true,
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
            },
          },
        },
        reviews: {
          with: {
            reviewer: true,
          },
        },
      },
    })

    if (!submission) return null

    // Calculate user context server-side
    let userContext:
      | { isSubmissionOwner: boolean; isCommitteeReviewer: boolean }
      | undefined
    if (user) {
      const isSubmissionOwner = submission.submitterId === user.id

      // Check if user is committee reviewer
      let isCommitteeReviewer = false
      if (submission.reviewerGroupId && user.primaryRole === 'committee') {
        const membership = await db.query.groupMemberships.findFirst({
          where: and(
            eq(groupMemberships.userId, user.id),
            eq(groupMemberships.groupId, submission.reviewerGroupId),
            eq(groupMemberships.isActive, true)
          ),
        })
        isCommitteeReviewer = !!membership
      }

      userContext = {
        isSubmissionOwner,
        isCommitteeReviewer,
      }
    }

    return {
      ...submission,
      userContext,
    } as unknown as SubmissionWithMilestones
  } catch (error) {
    console.error(
      '[getSubmissionWithMilestones]: Error fetching submission',
      error
    )
    return null
  }
}
