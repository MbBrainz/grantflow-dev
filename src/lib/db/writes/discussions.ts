import { eq, and } from 'drizzle-orm'
import { db } from '../drizzle'
import { discussions, messages, submissions, milestones } from '../schema'
import { getUser } from '../queries/users'

export async function ensureDiscussionForSubmission(submissionId: number) {
  const existingDiscussion = await db.query.discussions.findFirst({
    where: and(
      eq(discussions.submissionId, submissionId),
      eq(discussions.type, 'submission')
    ),
  })

  if (!existingDiscussion) {
    const submission = await db
      .select({ reviewerGroupId: submissions.reviewerGroupId })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1)

    if (!submission[0]) {
      throw new Error('Submission not found')
    }

    const result = await db
      .insert(discussions)
      .values({
        submissionId,
        groupId: submission[0].reviewerGroupId,
        type: 'submission',
      })
      .returning()

    return result[0]
  }

  return existingDiscussion
}

export async function ensureDiscussionForMilestone(milestoneId: number) {
  const existingDiscussion = await db.query.discussions.findFirst({
    where: and(
      eq(discussions.milestoneId, milestoneId),
      eq(discussions.type, 'milestone')
    ),
  })

  if (!existingDiscussion) {
    const milestone = await db
      .select({ groupId: milestones.groupId })
      .from(milestones)
      .where(eq(milestones.id, milestoneId))
      .limit(1)

    if (!milestone[0]) {
      throw new Error('Milestone not found')
    }

    const result = await db
      .insert(discussions)
      .values({
        milestoneId,
        groupId: milestone[0].groupId,
        type: 'milestone',
      })
      .returning()

    return result[0]
  }

  return existingDiscussion
}

export async function createMessage(data: {
  discussionId: number
  content: string
  messageType?: string
  metadata?: string
}) {
  const user = await getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const result = await db
    .insert(messages)
    .values({
      ...data,
      authorId: user.id,
      messageType: data.messageType || 'comment',
    })
    .returning()

  // Update discussion timestamp
  await db
    .update(discussions)
    .set({ updatedAt: new Date() })
    .where(eq(discussions.id, data.discussionId))

  return result[0]
}
