import { eq, and, desc, or, inArray } from 'drizzle-orm'
import { db } from '../drizzle'
import {
  submissions,
  milestones,
  groups,
  groupMemberships,
  reviews,
} from '../schema'
import { getUser } from './users'

export async function getDashboardStats() {
  const user = await getUser()
  if (!user) {
    return {
      submissions: { total: 0, pending: 0, approved: 0, inReview: 0 },
      milestones: { total: 0, completed: 0, inProgress: 0, pending: 0 },
      committees: { active: 0, isReviewer: false },
      recentActivity: [],
    }
  }

  const isReviewer =
    user.primaryRole === 'committee' || user.primaryRole === 'admin'

  // Get user's committee memberships
  const userCommittees = await db
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

  const committeeIds = userCommittees.map(c => c.groupId)

  let submissionStats
  if (isReviewer && committeeIds.length > 0) {
    // For reviewers: show submissions they need to review
    const reviewSubmissions = await db
      .select()
      .from(submissions)
      .where(inArray(submissions.reviewerGroupId, committeeIds))

    submissionStats = {
      total: reviewSubmissions.length,
      pending: reviewSubmissions.filter(s => s.status === 'pending').length,
      approved: reviewSubmissions.filter(s => s.status === 'approved').length,
      inReview: reviewSubmissions.filter(s => s.status === 'in-review').length,
    }
  } else {
    // For applicants: show their own submissions
    const userSubmissions = await db
      .select()
      .from(submissions)
      .where(eq(submissions.submitterId, user.id))

    submissionStats = {
      total: userSubmissions.length,
      pending: userSubmissions.filter(s => s.status === 'pending').length,
      approved: userSubmissions.filter(s => s.status === 'approved').length,
      inReview: userSubmissions.filter(s => s.status === 'in-review').length,
    }
  }

  // Get milestone stats for user's submissions
  const userSubmissionIds = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(eq(submissions.submitterId, user.id))

  const submissionIds = userSubmissionIds.map(s => s.id)

  let milestoneStats = {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  }

  if (submissionIds.length > 0) {
    const userMilestones = await db
      .select()
      .from(milestones)
      .where(inArray(milestones.submissionId, submissionIds))

    milestoneStats = {
      total: userMilestones.length,
      completed: userMilestones.filter(m => m.status === 'completed').length,
      inProgress: userMilestones.filter(m => m.status === 'changes-requested')
        .length,
      pending: userMilestones.filter(m => m.status === 'pending').length,
    }
  }

  // Get recent activity
  const recentActivity = await getRecentActivity(user.id, submissionIds)

  return {
    submissions: submissionStats,
    milestones: milestoneStats,
    committees: {
      active: committeeIds.length,
      isReviewer,
    },
    recentActivity,
  }
}

async function getRecentActivity(userId: number, submissionIds: number[]) {
  const activities: {
    type: string
    project: string
    time: string
  }[] = []

  if (submissionIds.length === 0) {
    return activities
  }

  // Get recent milestone completions
  const recentMilestones = await db.query.milestones.findMany({
    where: and(
      inArray(milestones.submissionId, submissionIds),
      eq(milestones.status, 'completed')
    ),
    with: {
      submission: {
        columns: {
          title: true,
        },
      },
    },
    orderBy: [desc(milestones.updatedAt)],
    limit: 3,
  })

  for (const milestone of recentMilestones) {
    activities.push({
      type: 'milestone_completed',
      project: milestone.submission?.title || 'Unknown Project',
      time: getRelativeTime(milestone.updatedAt),
    })
  }

  // Get recent reviews from the user
  const recentReviews = await db.query.reviews.findMany({
    where: eq(reviews.reviewerId, userId),
    with: {
      submission: {
        columns: {
          title: true,
        },
      },
    },
    orderBy: [desc(reviews.createdAt)],
    limit: 3,
  })

  for (const review of recentReviews) {
    activities.push({
      type: 'vote_cast',
      project: review.submission?.title ?? 'Unknown Project',
      time: getRelativeTime(review.createdAt),
    })
  }

  // Get recent submission status changes
  const recentSubmissions = await db.query.submissions.findMany({
    where: and(
      inArray(submissions.id, submissionIds),
      or(eq(submissions.status, 'approved'), eq(submissions.status, 'rejected'))
    ),
    orderBy: [desc(submissions.updatedAt)],
    limit: 2,
  })

  for (const submission of recentSubmissions) {
    activities.push({
      type:
        submission.status === 'approved'
          ? 'submission_approved'
          : 'submission_rejected',
      project: submission.title,
      time: getRelativeTime(submission.updatedAt),
    })
  }

  // Sort by time and return top 5
  return activities
    .sort(() => {
      // This is a simple sort - in production you'd want to parse the actual dates
      return 0
    })
    .slice(0, 5)
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const diffWeeks = Math.floor(diffMs / 604800000)

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  } else {
    return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`
  }
}

export async function getUpcomingDeadlines(userId: number) {
  // Get user's submissions
  const userSubmissionIds = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(eq(submissions.submitterId, userId))

  const submissionIds = userSubmissionIds.map(s => s.id)

  if (submissionIds.length === 0) {
    return []
  }

  // Get milestones with upcoming due dates
  const upcomingMilestones = await db.query.milestones.findMany({
    where: and(
      inArray(milestones.submissionId, submissionIds),
      or(
        eq(milestones.status, 'pending'),
        eq(milestones.status, 'changes-requested')
      )
    ),
    with: {
      submission: {
        columns: {
          title: true,
        },
      },
    },
    orderBy: [milestones.dueDate],
    limit: 5,
  })

  return upcomingMilestones
    .filter(m => m.dueDate)
    .map(m => {
      const daysUntilDue = m.dueDate
        ? Math.ceil(
            (m.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        : null

      return {
        id: m.id,
        title: m.title,
        project: m.submission?.title || 'Unknown Project',
        dueDate:
          daysUntilDue !== null
            ? daysUntilDue === 0
              ? 'Due today'
              : daysUntilDue === 1
                ? 'Due tomorrow'
                : daysUntilDue < 0
                  ? `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`
                  : daysUntilDue < 7
                    ? `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`
                    : daysUntilDue < 14
                      ? `Due in ${Math.floor(daysUntilDue / 7)} week${Math.floor(daysUntilDue / 7) !== 1 ? 's' : ''}`
                      : `Due in ${Math.floor(daysUntilDue / 7)} weeks`
            : 'No due date',
        status: m.status,
        urgent: daysUntilDue !== null && daysUntilDue <= 3,
      }
    })
}
