import { createNotification as dbCreateNotification } from '@/lib/db/queries'
import { sendNotificationToUser } from '@/lib/notifications/utils'

// Notification types
export const NOTIFICATION_TYPES = {
  NEW_MESSAGE: 'new_message',
  VOTE_CAST: 'vote_cast',
  STATUS_CHANGE: 'status_change',
  SUBMISSION_CREATED: 'submission_created',
  REVIEW_REQUESTED: 'review_requested',
} as const

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]

// Notification data structure
export interface NotificationData {
  type: NotificationType
  title: string
  message: string
  submissionId?: number
  discussionId?: number
  actionUrl?: string
  metadata?: Record<string, unknown>
}

// Create and store notification in database
export async function createNotification(
  userId: number,
  data: NotificationData
): Promise<boolean> {
  try {
    console.log(
      `[notifications-server]: Creating notification for user ${userId}`,
      data
    )

    // Store in database
    await dbCreateNotification({
      userId,
      type: data.type,
      submissionId: data.submissionId ?? undefined,
      discussionId: data.discussionId ?? undefined,
      content: JSON.stringify({
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        metadata: data.metadata,
      }),
    })

    // Send real-time notification via SSE
    const realtimeNotification = {
      ...data,
      userId,
      id: Date.now(), // Temporary ID for real-time
    }

    const sent = sendNotificationToUser(userId, realtimeNotification)

    console.log(
      `[notifications-server]: Notification created and sent via SSE: ${sent}`
    )
    return true
  } catch (error) {
    console.error(
      `[notifications-server]: Failed to create notification for user ${userId}`,
      error
    )
    return false
  }
}

// Helper functions for specific notification types

export async function notifyNewMessage(
  submissionId: number,
  discussionId: number,
  authorName: string,
  messageContent: string,
  excludeUserId?: number
) {
  try {
    // Get submission details to find relevant users
    const submission = await getSubmissionWithParticipants(submissionId)
    if (!submission) return

    // Determine who should be notified
    const usersToNotify = getNotificationTargets(submission, excludeUserId)

    const notification: NotificationData = {
      type: NOTIFICATION_TYPES.NEW_MESSAGE,
      title: `New message in "${submission.title}"`,
      message: `${authorName}: ${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}`,
      submissionId,
      discussionId,
      actionUrl: `/dashboard/submissions/${submissionId}`,
      metadata: { authorName },
    }

    // Create notifications for all relevant users
    const promises = usersToNotify.map(userId =>
      createNotification(userId, notification)
    )

    await Promise.all(promises)
    console.log(
      `[notifications-server]: New message notifications sent to ${usersToNotify.length} users`
    )
  } catch (error) {
    console.error('[notifications-server]: Failed to notify new message', error)
  }
}

export async function notifyVoteCast(
  submissionId: number,
  reviewerName: string,
  vote: string,
  excludeUserId?: number
) {
  try {
    const submission = await getSubmissionWithParticipants(submissionId)
    if (!submission) return

    const usersToNotify = getNotificationTargets(submission, excludeUserId)

    const notification: NotificationData = {
      type: NOTIFICATION_TYPES.VOTE_CAST,
      title: `New vote on "${submission.title}"`,
      message: `${reviewerName} voted: ${vote}`,
      submissionId,
      actionUrl: `/dashboard/submissions/${submissionId}`,
      metadata: { reviewerName, vote },
    }

    const promises = usersToNotify.map(userId =>
      createNotification(userId, notification)
    )

    await Promise.all(promises)
    console.log(
      `[notifications-server]: Vote cast notifications sent to ${usersToNotify.length} users`
    )
  } catch (error) {
    console.error('[notifications-server]: Failed to notify vote cast', error)
  }
}

export async function notifyStatusChange(
  submissionId: number,
  newStatus: string,
  excludeUserId?: number
) {
  try {
    const submission = await getSubmissionWithParticipants(submissionId)
    if (!submission) return

    const usersToNotify = getNotificationTargets(submission, excludeUserId)

    const notification: NotificationData = {
      type: NOTIFICATION_TYPES.STATUS_CHANGE,
      title: `Status changed for "${submission.title}"`,
      message: `Submission status updated to: ${newStatus}`,
      submissionId,
      actionUrl: `/dashboard/submissions/${submissionId}`,
      metadata: { newStatus },
    }

    const promises = usersToNotify.map(userId =>
      createNotification(userId, notification)
    )

    await Promise.all(promises)
    console.log(
      `[notifications-server]: Status change notifications sent to ${usersToNotify.length} users`
    )
  } catch (error) {
    console.error(
      '[notifications-server]: Failed to notify status change',
      error
    )
  }
}

// Helper function to get submission with participants (simplified for now)
// eslint-disable-next-line @typescript-eslint/require-await
async function getSubmissionWithParticipants(submissionId: number) {
  // TODO: Implement proper query to get submission with all participants
  // For now, return a basic structure
  return {
    id: submissionId,
    title: `Submission ${submissionId}`,
    submitterId: 1, // This should come from actual DB query
    participants: [1, 2], // This should include all users who have participated
  }
}

// Helper to determine who should receive notifications
function getNotificationTargets(
  submission: {
    id: number
    title: string
    submitterId: number
    participants: number[]
  },
  excludeUserId?: number
): number[] {
  const targets = new Set<number>()

  // Always notify the submission author
  targets.add(submission.submitterId)

  // Add any participants in discussions
  submission.participants?.forEach((userId: number) => targets.add(userId))

  // Remove the user who triggered the notification
  if (excludeUserId) {
    targets.delete(excludeUserId)
  }

  return Array.from(targets)
}
