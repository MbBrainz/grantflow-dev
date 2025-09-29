'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import {
  getUser,
  createMessage,
  getDiscussionForSubmission,
  getDiscussionForMilestone,
  ensureDiscussionForSubmission,
  ensureDiscussionForMilestone,
  getReviewsForSubmission,
} from '@/lib/db/queries'
import { validatedActionWithUser } from '@/lib/auth/middleware'
import {
  notifyNewMessage,
  notifyVoteCast,
  notifyStatusChange,
} from '@/lib/notifications/server'

const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(2000, 'Message too long'),
  discussionId: z.number(),
  messageType: z.enum(['comment', 'status_change', 'vote']).default('comment'),
  metadata: z.string().optional(),
})

const discussionParamsSchema = z.object({
  submissionId: z.number().optional(),
  milestoneId: z.number().optional(),
})

export const postMessage = validatedActionWithUser(
  messageSchema,
  async (data, formData, user) => {
    console.log('[postMessage]: Creating new message', {
      userId: user.id,
      discussionId: data.discussionId,
      messageType: data.messageType,
    })

    try {
      // Create the message
      const newMessage = await createMessage({
        discussionId: data.discussionId,
        content: data.content,
        messageType: data.messageType,
        metadata: data.metadata,
      })

      console.log('[postMessage]: Message created successfully', {
        messageId: newMessage.id,
      })

      // TODO: Create notifications for relevant users
      // For now, we'll implement basic notification logic
      // This should notify submission authors and other participants

      // Revalidate the page to show the new message
      revalidatePath('/dashboard/submissions')

      return { success: true, messageId: newMessage.id }
    } catch (error) {
      console.error('[postMessage]: Error creating message', error)
      return {
        error: 'Failed to post message. Please try again.',
      }
    }
  }
)

export async function getSubmissionDiscussion(submissionId: number) {
  try {
    const user = await getUser()
    console.log('[getSubmissionDiscussion]: Fetching discussion', {
      submissionId,
      userId: user?.id,
    })

    // Ensure discussion exists
    await ensureDiscussionForSubmission(submissionId)

    // Get discussion with messages
    const discussion = await getDiscussionForSubmission(submissionId)

    return {
      discussion,
      currentUser: user,
      canPost: !!user, // Allow any authenticated user to post for now
    }
  } catch (error) {
    console.error('[getSubmissionDiscussion]: Error fetching discussion', error)
    return {
      discussion: null,
      currentUser: null,
      canPost: false,
    }
  }
}

export async function getMilestoneDiscussion(milestoneId: number) {
  try {
    const user = await getUser()
    console.log('[getMilestoneDiscussion]: Fetching discussion', {
      milestoneId,
      userId: user?.id,
    })

    // Ensure discussion exists
    await ensureDiscussionForMilestone(milestoneId)

    // Get discussion with messages
    const discussion = await getDiscussionForMilestone(milestoneId)

    return {
      discussion,
      currentUser: user,
      canPost: !!user, // Allow any authenticated user to post for now
    }
  } catch (error) {
    console.error('[getMilestoneDiscussion]: Error fetching discussion', error)
    return {
      discussion: null,
      currentUser: null,
      canPost: false,
    }
  }
}

export async function getSubmissionReviews(submissionId: number) {
  try {
    const user = await getUser()
    console.log('[getSubmissionReviews]: Fetching reviews', {
      submissionId,
      userId: user?.id,
    })

    const reviews = await getReviewsForSubmission(submissionId)

    return {
      reviews,
      currentUser: user,
    }
  } catch (error) {
    console.error('[getSubmissionReviews]: Error fetching reviews', error)
    return {
      reviews: [],
      currentUser: null,
    }
  }
}

// Helper function to post a message with automatic discussion creation
export const postMessageToSubmission = validatedActionWithUser(
  z.object({
    content: z.string().min(1).max(2000),
    submissionId: z.coerce.number(),
    messageType: z
      .enum(['comment', 'status_change', 'vote'])
      .default('comment'),
  }),
  async (data, formData, user) => {
    try {
      // Ensure discussion exists
      const discussion = await ensureDiscussionForSubmission(data.submissionId)

      // Create the message
      const message = await createMessage({
        discussionId: discussion.id,
        content: data.content,
        messageType: data.messageType,
      })

      console.log('[postMessageToSubmission]: Message posted successfully', {
        messageId: message.id,
        submissionId: data.submissionId,
      })

      // Trigger real-time notifications
      try {
        if (data.messageType === 'vote') {
          await notifyVoteCast(
            data.submissionId,
            user.name || 'Anonymous Reviewer',
            data.content,
            user.id
          )
        } else if (data.messageType === 'status_change') {
          await notifyStatusChange(data.submissionId, data.content, user.id)
        } else {
          await notifyNewMessage(
            data.submissionId,
            discussion.id,
            user.name || 'Anonymous User',
            data.content,
            user.id
          )
        }
        console.log(
          '[postMessageToSubmission]: Notifications sent successfully'
        )
      } catch (notificationError) {
        console.error(
          '[postMessageToSubmission]: Failed to send notifications',
          notificationError
        )
        // Don't fail the whole operation if notifications fail
      }

      // Revalidate the submissions page
      revalidatePath('/dashboard/submissions')
      revalidatePath(`/dashboard/submissions/${data.submissionId}`)

      return { success: true, messageId: message.id }
    } catch (error) {
      console.error('[postMessageToSubmission]: Error posting message', error)
      return { error: 'Failed to post message. Please try again.' }
    }
  }
)

// Enhanced server actions for reviewer review interface
export const getSubmissionForReviewerReviewAction = validatedActionWithUser(
  z.object({
    submissionId: z.coerce.number(),
  }),
  async (data, formData, user) => {
    try {
      console.log(
        '[getSubmissionForReviewerReview]: Fetching comprehensive submission data',
        {
          submissionId: data.submissionId,
          userId: user.id,
        }
      )

      const submissionData = await import('@/lib/db/queries').then(m =>
        m.getSubmissionForReviewerReview(data.submissionId)
      )

      if (!submissionData) {
        return { error: 'Submission not found' }
      }

      return {
        success: true,
        submission: submissionData,
        currentUser: user,
      }
    } catch (error) {
      console.error(
        '[getSubmissionForReviewerReview]: Error fetching submission data',
        error
      )
      return {
        error: 'Failed to load submission data. Please try again.',
      }
    }
  }
)

export const getSubmissionCurrentState = validatedActionWithUser(
  z.object({
    submissionId: z.coerce.number(),
  }),
  async (data, formData, user) => {
    try {
      console.log('[getSubmissionCurrentState]: Fetching current state data', {
        submissionId: data.submissionId,
        userId: user.id,
      })

      const currentStateData = await import('@/lib/db/queries').then(m =>
        m.getSubmissionCurrentState(data.submissionId)
      )

      return {
        success: true,
        currentState: currentStateData,
        currentUser: user,
      }
    } catch (error) {
      console.error(
        '[getSubmissionCurrentState]: Error fetching current state',
        error
      )
      return {
        error: 'Failed to load current state data. Please try again.',
      }
    }
  }
)

export const getSubmissionMilestonesOverview = validatedActionWithUser(
  z.object({
    submissionId: z.coerce.number(),
  }),
  async (data, formData, user) => {
    try {
      console.log(
        '[getSubmissionMilestonesOverview]: Fetching milestones overview',
        {
          submissionId: data.submissionId,
          userId: user.id,
        }
      )

      const milestonesData = await import('@/lib/db/queries').then(m =>
        m.getSubmissionMilestonesOverview(data.submissionId)
      )

      return {
        success: true,
        milestonesOverview: milestonesData,
        currentUser: user,
      }
    } catch (error) {
      console.error(
        '[getSubmissionMilestonesOverview]: Error fetching milestones overview',
        error
      )
      return {
        error: 'Failed to load milestones overview. Please try again.',
      }
    }
  }
)

// Helper function to post a message to a milestone discussion
export const postMessageToMilestone = validatedActionWithUser(
  z.object({
    content: z.string().min(1).max(2000),
    milestoneId: z.coerce.number(),
    messageType: z
      .enum(['comment', 'status_change', 'vote'])
      .default('comment'),
  }),
  async (data, formData, user) => {
    try {
      // Ensure discussion exists for milestone
      const { ensureDiscussionForMilestone, createMessage } = await import(
        '@/lib/db/queries'
      )
      const discussion = await ensureDiscussionForMilestone(data.milestoneId)

      // Create the message
      const message = await createMessage({
        discussionId: discussion.id,
        content: data.content,
        messageType: data.messageType,
      })

      console.log('[postMessageToMilestone]: Message posted successfully', {
        messageId: message.id,
        milestoneId: data.milestoneId,
      })

      // Get milestone to find submission ID for notifications
      const { getMilestoneById } = await import('@/lib/db/queries')
      const milestone = await getMilestoneById(data.milestoneId)

      // Trigger real-time notifications for milestone messages
      try {
        // For milestones, we'll reuse the submission notification system
        // but could be enhanced to be milestone-specific
        if (milestone?.submissionId) {
          const { notifyNewMessage } = await import(
            '@/lib/notifications/server'
          )
          await notifyNewMessage(
            milestone.submissionId,
            discussion.id,
            user.name || 'Anonymous User',
            `Milestone update: ${data.content}`,
            user.id
          )
        }
        console.log('[postMessageToMilestone]: Notifications sent successfully')
      } catch (notificationError) {
        console.error(
          '[postMessageToMilestone]: Failed to send notifications',
          notificationError
        )
        // Don't fail the whole operation if notifications fail
      }

      // Revalidate the submissions page
      revalidatePath('/dashboard/submissions')
      if (milestone?.submissionId) {
        revalidatePath(`/dashboard/submissions/${milestone.submissionId}`)
      }

      return { success: true, messageId: message.id }
    } catch (error) {
      console.error(
        '[postMessageToMilestone]: Error creating milestone message',
        error
      )
      return {
        error: 'Failed to post message. Please try again.',
      }
    }
  }
)
