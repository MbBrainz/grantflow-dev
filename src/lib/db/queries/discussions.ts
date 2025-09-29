import { eq, and, desc } from 'drizzle-orm'
import { db } from '../drizzle'
import { discussions, messages, type Discussion } from '../schema'

export async function getDiscussionsBySubmission(
  submissionId: number
): Promise<Discussion[]> {
  return await db
    .select()
    .from(discussions)
    .where(eq(discussions.submissionId, submissionId))
    .orderBy(desc(discussions.createdAt))
}

export async function getDiscussionById(
  discussionId: number
): Promise<Discussion | null> {
  const result = await db
    .select()
    .from(discussions)
    .where(eq(discussions.id, discussionId))
    .limit(1)

  return result.length > 0 ? result[0] : null
}

export async function getMessagesByDiscussion(discussionId: number) {
  return await db.query.messages.findMany({
    where: eq(messages.discussionId, discussionId),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
          primaryRole: true,
        },
      },
    },
    orderBy: [messages.createdAt],
  })
}

export async function getDiscussionForSubmission(submissionId: number) {
  return await db.query.discussions.findFirst({
    where: and(
      eq(discussions.submissionId, submissionId),
      eq(discussions.type, 'submission')
    ),
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
  })
}

export async function getDiscussionForMilestone(milestoneId: number) {
  return await db.query.discussions.findFirst({
    where: and(
      eq(discussions.milestoneId, milestoneId),
      eq(discussions.type, 'milestone')
    ),
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
  })
}
