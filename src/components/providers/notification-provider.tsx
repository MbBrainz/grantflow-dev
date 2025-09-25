'use client';

import { useEffect, createContext, useContext, ReactNode, useState } from 'react';
import { useNotificationStream, useConnectionStatus } from '@/lib/notifications/client';
import { Toaster } from '@/components/ui/toaster';
import useSWR from 'swr';
import { User } from '@/lib/db/schema';

interface NotificationContextType {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnect: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function NotificationProvider({ children }: NotificationProviderProps) {
  // Check if user is authenticated before initializing notifications
  const { data: user, error: userError } = useSWR<User>('/api/user', fetcher);
  const [shouldConnect, setShouldConnect] = useState(false);

  // Only attempt to connect if user is authenticated
  useEffect(() => {
    if (user && !userError) {
      console.log('[NotificationProvider]: User authenticated, enabling notifications');
      setShouldConnect(true);
    } else {
      console.log('[NotificationProvider]: No authenticated user, skipping notifications');
      setShouldConnect(false);
    }
  }, [user, userError]);

  // Initialize the notification stream only for authenticated users
  const notificationStream = useNotificationStream(shouldConnect);

  // Auto-reconnect on connection failures (only if should connect)
  useEffect(() => {
    if (shouldConnect && notificationStream.error && !notificationStream.isConnecting) {
      console.log('[NotificationProvider]: Connection error detected, attempting reconnect in 5 seconds');
      const reconnectTimer = setTimeout(() => {
        if (notificationStream.reconnect) {
          notificationStream.reconnect();
        }
      }, 5000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [shouldConnect, notificationStream.error, notificationStream.isConnecting, notificationStream.reconnect]);

  // Log connection status changes
  useEffect(() => {
    if (!shouldConnect) return;
    
    if (notificationStream.isConnected) {
      console.log('[NotificationProvider]: ✅ Real-time notifications active');
    } else if (notificationStream.isConnecting) {
      console.log('[NotificationProvider]: 🔄 Connecting to notifications...');
    } else if (notificationStream.error) {
      console.log('[NotificationProvider]: ❌ Notification connection failed:', notificationStream.error);
    }
  }, [shouldConnect, notificationStream.isConnected, notificationStream.isConnecting, notificationStream.error]);

  const contextValue: NotificationContextType = {
    isConnected: shouldConnect ? notificationStream.isConnected : false,
    isConnecting: shouldConnect ? notificationStream.isConnecting : false,
    error: shouldConnect ? notificationStream.error : null,
    reconnect: shouldConnect ? (notificationStream.reconnect || (() => {})) : (() => {})
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Toast notifications will be rendered here */}
      <Toaster />
      
      {/* Optional: Global connection status indicator (only show for authenticated users) */}
      {shouldConnect && notificationStream.error && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
            <div className="flex items-center">
              <span className="text-sm">
                ⚠️ Real-time notifications offline
              </span>
              <button
                onClick={notificationStream.reconnect}
                className="ml-3 text-xs underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

// Optional: Connection status indicator component
export function ConnectionStatusIndicator() {
  const { isConnected, isConnecting, error } = useNotificationContext();

  if (isConnected) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs">Live</span>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-xs">Connecting...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-xs">Offline</span>
      </div>
    );
  }

  return null;
} 