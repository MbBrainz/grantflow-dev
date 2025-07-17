'use server';

import { NextRequest } from 'next/server';
import { getUser } from '@/lib/db/queries';

// Type declaration for global notification streams
declare global {
  var notificationStreams: Map<number, ReadableStreamDefaultController> | undefined;
}

export async function GET(request: NextRequest) {
  console.log('[notifications-stream]: SSE connection attempt');

  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      console.log('[notifications-stream]: Unauthorized access attempt');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log(`[notifications-stream]: Starting SSE stream for user ${user.id}`);

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        console.log(`[notifications-stream]: Stream started for user ${user.id}`);
        
        // Send initial connection confirmation
        const welcomeMessage = {
          type: 'connection',
          message: 'Connected to notification stream',
          timestamp: new Date().toISOString(),
          userId: user.id
        };
        
        controller.enqueue(`data: ${JSON.stringify(welcomeMessage)}\n\n`);

        // Store controller reference for this user (in production, use Redis)
        if (!global.notificationStreams) {
          global.notificationStreams = new Map();
        }
        global.notificationStreams.set(user.id, controller);

        // Keep connection alive with periodic heartbeat
        const heartbeat = setInterval(() => {
          try {
            const heartbeatMessage = {
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            };
            controller.enqueue(`data: ${JSON.stringify(heartbeatMessage)}\n\n`);
          } catch (error) {
            console.log(`[notifications-stream]: Heartbeat failed for user ${user.id}`, error);
            clearInterval(heartbeat);
          }
        }, 30000); // Every 30 seconds

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          console.log(`[notifications-stream]: Connection closed for user ${user.id}`);
          clearInterval(heartbeat);
          global.notificationStreams?.delete(user.id);
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('[notifications-stream]: Error setting up SSE stream', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Helper function to send notification to specific user
export function sendNotificationToUser(userId: number, notification: any) {
  if (!global.notificationStreams) {
    console.log('[notifications-stream]: No active streams found');
    return false;
  }

  const controller = global.notificationStreams.get(userId);
  if (!controller) {
    console.log(`[notifications-stream]: No active stream for user ${userId}`);
    return false;
  }

  try {
    const message = {
      type: 'notification',
      ...notification,
      timestamp: new Date().toISOString()
    };
    
    controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
    console.log(`[notifications-stream]: Notification sent to user ${userId}`, notification);
    return true;
  } catch (error) {
    console.error(`[notifications-stream]: Failed to send notification to user ${userId}`, error);
    global.notificationStreams.delete(userId);
    return false;
  }
}

// Helper to broadcast to multiple users
export function broadcastNotification(userIds: number[], notification: any) {
  let successCount = 0;
  userIds.forEach(userId => {
    if (sendNotificationToUser(userId, notification)) {
      successCount++;
    }
  });
  console.log(`[notifications-stream]: Broadcast sent to ${successCount}/${userIds.length} users`);
  return successCount;
} 