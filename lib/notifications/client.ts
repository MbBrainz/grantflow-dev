'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from '@/lib/hooks/use-toast';
import type { NotificationData } from './server';

export interface RealtimeNotification extends NotificationData {
  id: number;
  userId: number;
  timestamp: string;
}

interface SSEMessage {
  type: 'connection' | 'heartbeat' | 'notification';
  timestamp: string;
  [key: string]: any;
}

interface NotificationConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastHeartbeat: Date | null;
}

// Hook for managing SSE connection and receiving real-time notifications
export function useNotificationStream() {
  const [state, setState] = useState<NotificationConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastHeartbeat: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('[notifications-client]: Already connected or connecting');
      return;
    }

    console.log('[notifications-client]: Establishing SSE connection');
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[notifications-client]: SSE connection opened');
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null
        }));
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          console.log('[notifications-client]: Received SSE message', message);

          switch (message.type) {
            case 'connection':
              console.log('[notifications-client]: Connection confirmed');
              break;

            case 'heartbeat':
              setState(prev => ({
                ...prev,
                lastHeartbeat: new Date(message.timestamp)
              }));
              break;

            case 'notification':
              handleRealtimeNotification(message as unknown as RealtimeNotification);
              break;

            default:
              console.log('[notifications-client]: Unknown message type', message.type);
          }
        } catch (error) {
          console.error('[notifications-client]: Failed to parse SSE message', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[notifications-client]: SSE connection error', error);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: 'Connection lost'
        }));

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          console.log(`[notifications-client]: Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            eventSource.close();
            eventSourceRef.current = null;
            connect();
          }, delay);
        } else {
          console.error('[notifications-client]: Max reconnection attempts reached');
          setState(prev => ({ ...prev, error: 'Unable to connect to notifications' }));
        }
      };

    } catch (error) {
      console.error('[notifications-client]: Failed to establish SSE connection', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: 'Failed to connect'
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    console.log('[notifications-client]: Disconnecting SSE');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState({
      isConnected: false,
      isConnecting: false,
      error: null,
      lastHeartbeat: null,
    });
  }, []);

  // Auto-connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect: () => {
      disconnect();
      setTimeout(connect, 1000);
    }
  };
}

// Hook for displaying notifications with specific submission context
export function useSubmissionNotifications(submissionId?: number) {
  const notificationStream = useNotificationStream();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);

  useEffect(() => {
    const handleNotification = (notification: RealtimeNotification) => {
      // Only show notifications related to current submission if specified
      if (submissionId && notification.submissionId !== submissionId) {
        return;
      }

      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
    };

    // Set up global notification handler
    const originalHandler = (window as any).handleRealtimeNotification;
    (window as any).handleRealtimeNotification = handleNotification;

    return () => {
      (window as any).handleRealtimeNotification = originalHandler;
    };
  }, [submissionId]);

  return {
    ...notificationStream,
    notifications,
    clearNotifications: () => setNotifications([])
  };
}

// Global notification handler function
function handleRealtimeNotification(notification: RealtimeNotification) {
  console.log('[notifications-client]: Processing notification', notification);

  // Show toast notification based on type
  toast({
    title: notification.title,
    description: notification.message,
    duration: getNotificationDuration(notification.type)
  });

  // Trigger any registered handlers
  if ((window as any).handleRealtimeNotification) {
    (window as any).handleRealtimeNotification(notification);
  }

  // Update page data if needed
  updatePageData(notification);
}

// Get toast duration based on notification type
function getNotificationDuration(type: string): number {
  switch (type) {
    case 'new_message':
      return 5000;
    case 'vote_cast':
      return 4000;
    case 'status_change':
      return 6000;
    default:
      return 4000;
  }
}

// Update page data when relevant notifications arrive
function updatePageData(notification: RealtimeNotification) {
  // Trigger page refresh for certain notification types
  if (notification.type === 'new_message' && notification.submissionId) {
    // Check if we're on the submission page
    const currentPath = window.location.pathname;
    if (currentPath.includes(`/submissions/${notification.submissionId}`)) {
      // Refresh the discussion data (this could be improved with more specific updates)
      console.log('[notifications-client]: Refreshing submission data due to new message');
      window.location.reload();
    }
  }
}

// Connection status component data
export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastHeartbeat: Date | null;
}

// Hook for displaying connection status
export function useConnectionStatus(): ConnectionStatus {
  const { isConnected, isConnecting, error, lastHeartbeat } = useNotificationStream();
  
  return {
    isConnected,
    isConnecting, 
    error,
    lastHeartbeat
  };
} 