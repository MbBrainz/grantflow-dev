import { eq, and } from 'drizzle-orm'
import { db } from '../drizzle'
import { notifications } from '../schema'

export async function createNotification(data: {
  userId: number
  type: string
  content: string
  submissionId?: number
  discussionId?: number
  milestoneId?: number
  groupId?: number
}) {
  const result = await db.insert(notifications).values(data).returning()
  return result[0]
}

export async function markNotificationAsRead(
  notificationId: number,
  userId: number
) {
  return await db
    .update(notifications)
    .set({
      read: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
}
