import { eq, desc } from 'drizzle-orm'
import { db } from '../drizzle'
import { notifications } from '../schema'

// Notification queries
export async function getNotificationsByUser(userId: number) {
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
}
