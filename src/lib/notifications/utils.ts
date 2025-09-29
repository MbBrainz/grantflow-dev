// Helper function to send notification to specific user
export function sendNotificationToUser(userId: number, notification: any) {
  if (!global.notificationStreams) {
    console.log('[notifications-stream]: No active streams found')
    return false
  }

  const controller = global.notificationStreams.get(userId)
  if (!controller) {
    console.log(`[notifications-stream]: No active stream for user ${userId}`)
    return false
  }

  try {
    const message = {
      type: 'notification',
      ...notification,
      timestamp: new Date().toISOString(),
    }

    controller.enqueue(`data: ${JSON.stringify(message)}\n\n`)
    console.log(
      `[notifications-stream]: Notification sent to user ${userId}`,
      notification
    )
    return true
  } catch (error) {
    console.error(
      `[notifications-stream]: Failed to send notification to user ${userId}`,
      error
    )
    global.notificationStreams.delete(userId)
    return false
  }
}

// Helper to broadcast to multiple users
export function broadcastNotification(userIds: number[], notification: any) {
  let successCount = 0
  userIds.forEach(userId => {
    if (sendNotificationToUser(userId, notification)) {
      successCount++
    }
  })
  console.log(
    `[notifications-stream]: Broadcast sent to ${successCount}/${userIds.length} users`
  )
  return successCount
}
