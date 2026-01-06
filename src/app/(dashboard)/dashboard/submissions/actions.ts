'use server'

import { z } from 'zod'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import type { NewReview } from '@/lib/db/schema'
import {
  submissions,
  milestones,
  type NewSubmission,
  type NewMilestone,
  reviews,
  groups,
  groupMemberships,
} from '@/lib/db/schema'
import {
  getUser,
  ensureDiscussionForSubmission,
  ensureDiscussionForMilestone,
  getSubmissionById,
} from '@/lib/db/queries'
import { getGroups } from '@/lib/db/queries/groups'
import { revalidatePath } from 'next/cache'
import {
  GITHUB_URL_REGEX,
  parseRequirements,
} from '@/lib/validation/submission'
import { validatedActionWithUser } from '@/lib/auth/middleware'
import {
  submitReviewSchema,
  type SubmitReviewInput,
} from '@/lib/db/schema/actions'

// Get submission details for milestone approval
export async function getSubmissionDetails(submissionId: number) {
  try {
    const submission = await getSubmissionById(submissionId)

    if (!submission) {
      return { error: 'Submission not found' }
    }

    return {
      success: true,
      submission: {
        id: submission.id,
        title: submission.title,
        walletAddress: submission.walletAddress,
        status: submission.status,
        submitter: submission.submitter,
      },
    }
  } catch (error) {
    console.error('[getSubmissionDetails]: Failed to get submission', error)
    return { error: 'Failed to get submission details' }
  }
}

// Fetch active committees (which ARE the grant programs now) for submission
export async function getActiveCommittees() {
  try {
    const committees = await getGroups('committee')

    // Return committees with their budget information
    const committeesWithBudget = committees.map(committee => ({
      id: committee.id,
      name: committee.name,
      description: committee.description,
      logoUrl: committee.logoUrl,
      focusAreas: committee.focusAreas,
      isActive: committee.isActive,
      // Budget fields (committee IS the grant program)
      fundingAmount: committee.fundingAmount,
      minGrantSize: committee.minGrantSize,
      maxGrantSize: committee.maxGrantSize,
      minMilestoneSize: committee.minMilestoneSize,
      maxMilestoneSize: committee.maxMilestoneSize,
      // Template fields
      requirements: committee.requirements,
      applicationTemplate: committee.applicationTemplate,
    }))

    return { success: true, committees: committeesWithBudget }
  } catch (error) {
    console.error('[actions]: Error fetching committees', error)
    return { success: false, error: 'Failed to fetch committees' }
  }
}

// Validation schemas (prefixed with _ to indicate unused but kept for future use)
const _milestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required').max(200),
  description: z.string().min(1, 'Milestone description is required'),
  requirements: z.string().min(1, 'Acceptance criteria is required'), // Will be stored in description
  amount: z.string().min(1, 'Funding amount is required'),
  dueDate: z.string().optional(),
})

const createSubmissionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must not exceed 200 characters'),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(500, 'Description must not exceed 500 characters'),
    executiveSummary: z
      .string()
      .trim()
      .min(50, 'Executive summary must be at least 50 characters')
      .max(5000, 'Executive summary must not exceed 5000 characters'),
    postGrantPlan: z
      .string()
      .trim()
      .min(20, 'Post-grant plan must be at least 20 characters')
      .max(3000, 'Post-grant plan must not exceed 3000 characters'),
    githubRepoUrl: z
      .string()
      .trim()
      .refine(
        val => {
          if (val === '' || val === undefined) return true // Allow empty
          return GITHUB_URL_REGEX.test(val)
        },
        {
          message:
            'Must be a valid GitHub repository URL (e.g., https://github.com/username/repo)',
        }
      )
      .optional()
      .or(z.literal('')),
    totalAmount: z
      .string()
      .min(1, 'Total amount is required')
      .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: 'Total amount must be a positive number',
      }),
    // Committee IS the grant program now - no separate grantProgramId
    committeeId: z.coerce.number().min(1, 'Committee selection is required'),
    labels: z
      .array(z.string().trim().min(1))
      .min(1, 'At least one project category must be selected')
      .max(10, 'Maximum 10 project categories allowed'),
    milestones: z
      .array(
        z.object({
          title: z
            .string()
            .trim()
            .min(1, 'Milestone title is required')
            .max(200, 'Milestone title must not exceed 200 characters'),
          description: z
            .string()
            .trim()
            .min(10, 'Milestone description must be at least 10 characters')
            .max(2000, 'Milestone description must not exceed 2000 characters'),
          requirements: z
            .string()
            .trim()
            .min(5, 'Acceptance criteria must be at least 5 characters')
            .max(2000, 'Acceptance criteria must not exceed 2000 characters'),
          amount: z
            .string()
            .min(1, 'Milestone amount is required')
            .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
              message: 'Milestone amount must be a positive number',
            }),
          dueDate: z.string().min(1, 'Due date is required'),
        })
      )
      .min(1, 'At least one milestone is required')
      .max(20, 'Maximum 20 milestones allowed'),
  })
  .refine(
    data => {
      // Validate that milestone amounts sum up to total amount
      const totalAmount = parseFloat(data.totalAmount)
      const milestonesTotal = data.milestones.reduce((sum, milestone) => {
        const amount = parseFloat(milestone.amount)
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)
      return Math.abs(milestonesTotal - totalAmount) < 0.01 // Allow for floating point errors
    },
    {
      message:
        'The sum of milestone amounts must equal the total funding amount',
      path: ['milestones'],
    }
  )

interface SubmissionActionState {
  error?: string
  success?: boolean
  submissionId?: number
}

export const createSubmission = async (
  _prevState: SubmissionActionState | null,
  formData: FormData
): Promise<SubmissionActionState> => {
  console.log('[createSubmission]: Starting submission creation')

  // Get authenticated user
  const user = await getUser()
  if (!user) {
    return { error: 'User not authenticated' }
  }

  try {
    // Parse FormData with special handling for JSON fields
    const rawData = Object.fromEntries(formData)
    console.log('[createSubmission]: Raw FormData entries:', {
      ...rawData,
      labels:
        typeof rawData.labels === 'string'
          ? `JSON string: ${rawData.labels.substring(0, 100)}...`
          : rawData.labels,
      milestones:
        typeof rawData.milestones === 'string'
          ? `JSON string: ${rawData.milestones.substring(0, 100)}...`
          : rawData.milestones,
    })

    // Parse JSON fields
    let parsedData: Record<string, unknown>
    try {
      parsedData = {
        ...rawData,
        labels:
          typeof rawData.labels === 'string'
            ? JSON.parse(rawData.labels)
            : rawData.labels,
        milestones:
          typeof rawData.milestones === 'string'
            ? JSON.parse(rawData.milestones)
            : rawData.milestones,
      }

      console.log('[createSubmission]: Parsed data:', {
        ...parsedData,
        labels: parsedData.labels,
        labelsType: typeof parsedData.labels,
        labelsIsArray: Array.isArray(parsedData.labels),
        labelsLength: Array.isArray(parsedData.labels)
          ? parsedData.labels.length
          : 'not array',
        milestones: Array.isArray(parsedData.milestones)
          ? `${parsedData.milestones.length} milestones`
          : 'not array',
        milestonesType: typeof parsedData.milestones,
      })
    } catch (parseError) {
      console.error('[createSubmission]: JSON parsing error:', parseError)
      return { error: 'Invalid data format' }
    }

    // Validate parsed data
    const validationResult = createSubmissionSchema.safeParse(parsedData)
    if (!validationResult.success) {
      console.error(
        '[createSubmission]: Validation error:',
        validationResult.error.issues
      )
      // Return the first meaningful error message
      const firstError = validationResult.error.issues[0]
      const errorPath = firstError.path.join('.')
      const errorMessage = errorPath
        ? `${errorPath}: ${firstError.message}`
        : firstError.message
      return { error: errorMessage }
    }

    const data = validationResult.data
    console.log(
      '[createSubmission]: Validation successful, proceeding with submission for user',
      {
        userId: user.id,
        title: data.title,
        labelsCount: data.labels.length,
        milestonesCount: data.milestones.length,
      }
    )

    // Now continue with the submission logic
    // Parse and validate data
    const totalAmount = parseFloat(data.totalAmount)
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return { error: 'Invalid total amount' }
    }

    // Calculate milestones total
    const milestonesTotal = data.milestones.reduce((sum, milestone) => {
      const amount = parseFloat(milestone.amount)
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

    // Validate milestones total doesn't exceed total amount
    if (milestonesTotal > totalAmount) {
      return { error: 'Milestones total cannot exceed total funding amount' }
    }

    // Create submission record - committee IS the grant program now
    const newSubmission: NewSubmission = {
      submitterGroupId: user.primaryGroupId ?? 1, // Use user's primary group
      reviewerGroupId: data.committeeId, // Committee is the grant program
      submitterId: user.id,
      title: data.title,
      description: data.description,
      executiveSummary: data.executiveSummary,
      postGrantPlan: data.postGrantPlan,
      labels: JSON.stringify(data.labels),
      githubRepoUrl: data.githubRepoUrl ?? null,
      walletAddress: null, // TODO: Add wallet address field to form
      status: 'pending', // Start as pending for committee review
      totalAmount: Number(data.totalAmount.replace(/,/g, '')),
      appliedAt: new Date(),
    }

    const [createdSubmission] = await db
      .insert(submissions)
      .values(newSubmission)
      .returning()

    if (!createdSubmission) {
      return { error: 'Failed to create submission' }
    }

    console.log('[createSubmission]: Created submission', {
      id: createdSubmission.id,
    })

    // Create milestone records (combine description and requirements)
    const milestonePromises = data.milestones.map(async milestone => {
      // Convert requirements string to array using shared utility
      const requirementsArray = parseRequirements(milestone.requirements)

      const combinedDescription = `${milestone.description}\n\n**Acceptance Criteria:**\n${requirementsArray.map(r => `- ${r}`).join('\n')}`

      const newMilestone: NewMilestone = {
        submissionId: createdSubmission.id,
        groupId: user.primaryGroupId ?? 1, // Use user's primary group
        title: milestone.title,
        description: combinedDescription, // Include requirements in description
        requirements: requirementsArray,
        amount: Number(milestone.amount.replace(/,/g, '')),
        dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
        status: 'pending',
      }

      const [createdMilestone] = await db
        .insert(milestones)
        .values(newMilestone)
        .returning()

      // Create discussion thread for each milestone
      if (createdMilestone) {
        await ensureDiscussionForMilestone(createdMilestone.id)
        console.log('[createSubmission]: Created discussion for milestone', {
          milestoneId: createdMilestone.id,
        })
      }

      return createdMilestone
    })

    await Promise.all(milestonePromises)

    console.log('[createSubmission]: Created milestones', {
      count: data.milestones.length,
    })

    // Create discussion thread for the submission
    await ensureDiscussionForSubmission(createdSubmission.id)
    console.log('[createSubmission]: Created discussion for submission', {
      submissionId: createdSubmission.id,
    })

    // Submission is already set to 'submitted' status - no PR needed

    // Revalidate the submissions page
    revalidatePath('/dashboard/submissions')

    console.log('[createSubmission]: Submission process completed successfully')

    // Return success response (client will handle redirect)
    return { success: true, submissionId: createdSubmission.id }
  } catch (error) {
    console.error('[createSubmission]: Error creating submission', error)
    return {
      error: 'Failed to create submission. Please try again.',
    }
  }
}

// Get user's submissions
export async function getUserSubmissions() {
  const user = await getUser()
  if (!user) {
    return []
  }

  try {
    const userSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.submitterId, user.id),
      with: {
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
        milestones: {
          columns: {
            id: true,
            title: true,
            status: true,
            amount: true,
          },
        },
      },
      orderBy: [submissions.createdAt],
    })

    return userSubmissions
  } catch (error) {
    console.error('[getUserSubmissions]: Error fetching submissions', error)
    return []
  }
}

// Pure function: Check if user already has a review
async function findExistingReview(params: NewReview) {
  const conditions = [
    eq(reviews.submissionId, params.submissionId),
    eq(reviews.reviewerId, params.reviewerId),
  ]

  // If milestoneId is provided, include it in the check
  if (params.milestoneId) {
    conditions.push(eq(reviews.milestoneId, params.milestoneId))
  }

  return await db.query.reviews.findFirst({
    where: and(...conditions),
  })
}

// Pure function: Build review record
function buildReviewRecord(params: NewReview): NewReview {
  return {
    submissionId: params.submissionId,
    milestoneId: params.milestoneId ?? null,
    reviewerId: params.reviewerId,
    groupId: params.groupId,
    vote: params.vote,
    feedback: params.feedback ?? null,
    reviewType: 'standard',
    weight: 1,
    isBinding: false,
  }
}

// Pure function: Determine which paths to revalidate
function getRevalidationPaths(
  submissionId: number,
  milestoneId?: number
): string[] {
  const paths = [
    '/dashboard/submissions',
    `/dashboard/submissions/${submissionId}`,
    '/dashboard/review',
  ]

  // Add milestone-specific path if applicable
  if (milestoneId) {
    paths.push(
      `/dashboard/submissions/${submissionId}/milestones/${milestoneId}`
    )
  }

  return paths
}

/**
 * Check if quorum is reached and update submission/milestone status
 * Called after each review submission
 */
async function checkQuorumAndUpdateStatus(params: {
  submissionId: number
  milestoneId: number | null | undefined
  reviewerGroupId: number
}) {
  const { submissionId, milestoneId, reviewerGroupId } = params

  try {
    // Get the committee/group with settings
    const committee = await db.query.groups.findFirst({
      where: eq(groups.id, reviewerGroupId),
      with: {
        members: {
          where: eq(groupMemberships.isActive, true),
        },
      },
    })

    if (!committee) {
      console.warn(
        '[checkQuorumAndUpdateStatus]: Committee not found',
        reviewerGroupId
      )
      return
    }

    // Get active committee member count
    const activeMemberCount = committee.members?.length ?? 0
    if (activeMemberCount === 0) {
      console.warn(
        '[checkQuorumAndUpdateStatus]: No active members in committee',
        reviewerGroupId
      )
      return
    }

    // Get voting settings from committee (with defaults)
    const votingThreshold = committee.settings?.votingThreshold ?? 0.5 // Default 50% quorum
    const requiredApprovalPercentage =
      committee.settings?.requiredApprovalPercentage ?? 0.6 // Default 60% approval

    const requiredVoteCount = Math.ceil(activeMemberCount * votingThreshold)

    console.log('[checkQuorumAndUpdateStatus]: Voting parameters', {
      activeMemberCount,
      votingThreshold,
      requiredApprovalPercentage,
      requiredVoteCount,
      milestoneId: milestoneId ?? 'none',
    })

    // Get all reviews for this submission/milestone
    const conditions = [eq(reviews.submissionId, submissionId)]
    if (milestoneId) {
      conditions.push(eq(reviews.milestoneId, milestoneId))
    } else {
      // For submission reviews, only count reviews WITHOUT milestoneId
      conditions.push(isNull(reviews.milestoneId))
    }

    const allReviews = await db.query.reviews.findMany({
      where: and(...conditions),
    })

    const totalVotes = allReviews.length
    const approveVotes = allReviews.filter(r => r.vote === 'approve').length
    const rejectVotes = allReviews.filter(r => r.vote === 'reject').length

    console.log('[checkQuorumAndUpdateStatus]: Vote counts', {
      totalVotes,
      approveVotes,
      rejectVotes,
      requiredVoteCount,
    })

    // Check if quorum is reached
    if (totalVotes < requiredVoteCount) {
      console.log('[checkQuorumAndUpdateStatus]: Quorum not yet reached')
      return
    }

    console.log(
      '[checkQuorumAndUpdateStatus]: Quorum reached! Checking outcome...'
    )

    // Calculate approval percentage
    const approvalPercentage = approveVotes / totalVotes

    // Determine new status based on votes
    if (milestoneId) {
      // Milestone status: 'completed' or 'rejected' (single rejection status)
      let milestoneStatus: 'completed' | 'rejected'

      if (approvalPercentage >= requiredApprovalPercentage) {
        milestoneStatus = 'completed'
      } else {
        milestoneStatus = 'rejected' // Single rejection status - work needs revision
      }

      console.log('[checkQuorumAndUpdateStatus]: Outcome determined', {
        approvalPercentage,
        requiredApprovalPercentage,
        newStatus: milestoneStatus,
        approveVotes,
        rejectVotes,
        totalVotes,
      })

      // Get milestone and submission details for notifications
      const milestone = await db.query.milestones.findFirst({
        where: eq(milestones.id, milestoneId),
        with: {
          submission: {
            columns: {
              id: true,
              submitterId: true,
              title: true,
            },
          },
        },
      })

      if (!milestone) {
        console.warn(
          '[checkQuorumAndUpdateStatus]: Milestone not found',
          milestoneId
        )
        return
      }

      // Update milestone status
      await db
        .update(milestones)
        .set({
          status: milestoneStatus,
          reviewedAt: new Date(),
          updatedAt: new Date(),
          // Track rejection for analytics
          ...(milestoneStatus === 'rejected' && {
            rejectionCount: sql`COALESCE(${milestones.rejectionCount}, 0) + 1`,
            lastRejectedAt: new Date(),
          }),
        })
        .where(eq(milestones.id, milestoneId))

      console.log('[checkQuorumAndUpdateStatus]: Updated milestone status', {
        milestoneId,
        newStatus: milestoneStatus,
      })

      // Create notifications when milestone is rejected
      if (milestoneStatus === 'rejected' && milestone.submission) {
        try {
          const { createNotification } =
            await import('@/lib/db/writes/notifications')

          // Get rejection feedback summary from reviews
          const rejectionReviews = allReviews.filter(r => r.vote === 'reject')
          const feedbackSummary = rejectionReviews
            .map(r => r.feedback)
            .filter(Boolean)
            .slice(0, 3) // First 3 feedback items
            .join('; ')

          // Notify grantee (submitter)
          await createNotification({
            userId: milestone.submission.submitterId,
            type: 'milestone_rejected',
            content: JSON.stringify({
              title: `Milestone "${milestone.title}" rejected`,
              message: `Your submission for milestone "${milestone.title}" has been rejected. Please review the feedback and resubmit when ready.`,
              actionUrl: `/dashboard/submissions/${milestone.submission.id}`,
              metadata: {
                milestoneId,
                milestoneTitle: milestone.title,
                feedbackSummary:
                  feedbackSummary || 'Review feedback from reviewers',
                rejectionCount: (milestone.rejectionCount ?? 0) + 1,
              },
            }),
            submissionId: milestone.submission.id,
            milestoneId,
            groupId: milestone.groupId,
          })

          console.log(
            '[checkQuorumAndUpdateStatus]: Created rejection notification for grantee',
            {
              milestoneId,
              submitterId: milestone.submission.submitterId,
            }
          )
        } catch (notificationError) {
          console.error(
            '[checkQuorumAndUpdateStatus]: Failed to create rejection notification',
            notificationError
          )
          // Don't fail the whole operation for notification errors
        }
      }
    } else {
      // Submission status: 'approved', 'rejected', or 'changes-requested'
      let submissionStatus: 'approved' | 'rejected' | 'changes-requested'

      if (approvalPercentage >= requiredApprovalPercentage) {
        submissionStatus = 'approved'
      } else if (rejectVotes > approveVotes) {
        submissionStatus = 'rejected'
      } else {
        submissionStatus = 'changes-requested'
      }

      console.log('[checkQuorumAndUpdateStatus]: Outcome determined', {
        approvalPercentage,
        requiredApprovalPercentage,
        newStatus: submissionStatus,
      })

      // Update submission status
      await db
        .update(submissions)
        .set({
          status: submissionStatus,
          updatedAt: new Date(),
        })
        .where(eq(submissions.id, submissionId))

      console.log('[checkQuorumAndUpdateStatus]: Updated submission status', {
        submissionId,
        newStatus: submissionStatus,
      })
    }
  } catch (error) {
    console.error('[checkQuorumAndUpdateStatus]: Error', error)
    // Don't throw - we don't want to fail the review submission if status update fails
  }
}

/**
 * Unified action for submitting reviews
 * Handles both submission-level and milestone-level reviews
 * Client sends: submissionId, milestoneId?, vote, feedback?
 * Server adds: reviewerId (from user), groupId (from submission)
 */
export const submitReview = validatedActionWithUser(
  submitReviewSchema,
  async (data: SubmitReviewInput, user) => {
    const reviewType = data.milestoneId ? 'milestone' : 'submission'

    console.log(`[submitReview]: Submitting ${reviewType} review`, {
      submissionId: data.submissionId,
      milestoneId: data.milestoneId,
      vote: data.vote,
      userId: user.id,
    })

    try {
      // Verify submission exists
      const submission = await getSubmissionById(data.submissionId)
      if (!submission) {
        return { error: 'Submission not found' }
      }

      // Check if user already has a review for this submission/milestone
      const existingReview = await findExistingReview({
        groupId: submission.submitterGroupId,
        submissionId: data.submissionId,
        milestoneId: data.milestoneId,
        reviewerId: user.id,
      })

      if (existingReview) {
        const target = data.milestoneId ? 'milestone' : 'submission'
        return { error: `You already have a review for this ${target}` }
      }

      // Build and create the review record
      // Server determines groupId and reviewerId - client doesn't send these
      const newReview = buildReviewRecord({
        submissionId: data.submissionId,
        milestoneId: data.milestoneId,
        reviewerId: user.id, // From authenticated user
        groupId: submission.reviewerGroupId ?? 1, // From submission
        vote: data.vote,
        feedback: data.feedback,
      })

      const [createdReview] = await db
        .insert(reviews)
        .values(newReview)
        .returning()

      if (!createdReview) {
        return { error: 'Failed to create review' }
      }

      console.log(`[submitReview]: ${reviewType} review created successfully`, {
        reviewId: createdReview.id,
        submissionId: data.submissionId,
        milestoneId: data.milestoneId,
      })

      // Check if quorum is reached and update status accordingly
      await checkQuorumAndUpdateStatus({
        submissionId: data.submissionId,
        milestoneId: data.milestoneId,
        reviewerGroupId: submission.reviewerGroupId,
      })

      // Revalidate all relevant paths
      const paths = getRevalidationPaths(
        data.submissionId,
        data.milestoneId ?? undefined
      )
      paths.forEach(path => revalidatePath(path))

      return {
        success: true,
        reviewId: createdReview.id,
        message: `Review submitted successfully for ${reviewType}`,
      }
    } catch (error) {
      console.error('[submitReview]: Error submitting review', error)
      return { error: 'Failed to submit review. Please try again.' }
    }
  }
)

export type UserSubmissions = Awaited<ReturnType<typeof getUserSubmissions>>
