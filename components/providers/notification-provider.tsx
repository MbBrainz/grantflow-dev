'use client';

import { useEffect, createContext, useContext, ReactNode } from 'react';
import { useNotificationStream, useConnectionStatus } from '@/lib/notifications/client';
import { Toaster } from '@/components/ui/toaster';

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

export function NotificationProvider({ children }: NotificationProviderProps) {
  // Initialize the notification stream for the entire app
  const notificationStream = useNotificationStream();

  // Auto-reconnect on connection failures
  useEffect(() => {
    if (notificationStream.error && !notificationStream.isConnecting) {
      console.log('[NotificationProvider]: Connection error detected, attempting reconnect in 5 seconds');
      const reconnectTimer = setTimeout(() => {
        if (notificationStream.reconnect) {
          notificationStream.reconnect();
        }
      }, 5000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [notificationStream.error, notificationStream.isConnecting, notificationStream.reconnect]);

  // Log connection status changes
  useEffect(() => {
    if (notificationStream.isConnected) {
      console.log('[NotificationProvider]: ✅ Real-time notifications active');
    } else if (notificationStream.isConnecting) {
      console.log('[NotificationProvider]: 🔄 Connecting to notifications...');
    } else if (notificationStream.error) {
      console.log('[NotificationProvider]: ❌ Notification connection failed:', notificationStream.error);
    }
  }, [notificationStream.isConnected, notificationStream.isConnecting, notificationStream.error]);

  const contextValue: NotificationContextType = {
    isConnected: notificationStream.isConnected,
    isConnecting: notificationStream.isConnecting,
    error: notificationStream.error,
    reconnect: notificationStream.reconnect || (() => {})
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Toast notifications will be rendered here */}
      <Toaster />
      
      {/* Optional: Global connection status indicator */}
      {notificationStream.error && (
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