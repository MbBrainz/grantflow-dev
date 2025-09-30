'use client'

import type { ReactNode } from 'react'
import { useEffect, createContext, useContext, useState } from 'react'
import { useNotificationStream } from '@/lib/notifications/client'
import { Toaster } from '@/components/ui/toaster'
import useSWR from 'swr'
import type { User } from '@/lib/db/schema'

interface NotificationContextType {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  reconnect: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within NotificationProvider'
    )
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function NotificationProvider({ children }: NotificationProviderProps) {
  // Check if user is authenticated before initializing notifications
  const { data: user, error: userError } = useSWR<User>(
    '/api/user',
    fetcher
  ) as { data: User | undefined; error: Error | undefined }
  const [shouldConnect, setShouldConnect] = useState<boolean>(false)

  // Only attempt to connect if user is authenticated
  useEffect(() => {
    if (user && !userError) {
      console.log(
        '[NotificationProvider]: User authenticated, enabling notifications'
      )
      setShouldConnect(true)
    } else {
      console.log(
        '[NotificationProvider]: No authenticated user, skipping notifications'
      )
      setShouldConnect(false)
    }
  }, [user, userError])

  // Initialize the notification stream only for authenticated users
  const notificationStream = useNotificationStream(shouldConnect)

  // Auto-reconnect on connection failures (only if should connect)
  useEffect(() => {
    if (
      !(
        shouldConnect &&
        notificationStream.error &&
        !notificationStream.isConnecting
      )
    ) {
      return
    }

    console.log(
      '[NotificationProvider]: Connection error detected, attempting reconnect in 5 seconds'
    )
    const reconnectTimer = setTimeout(() => {
      if (notificationStream.reconnect) {
        notificationStream.reconnect()
      }
    }, 5000)

    return () => clearTimeout(reconnectTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shouldConnect,
    notificationStream.error,
    notificationStream.isConnecting,
    notificationStream.reconnect,
  ])

  // Log connection status changes
  useEffect(() => {
    if (!shouldConnect) return

    if (notificationStream.isConnected) {
      console.log('[NotificationProvider]: ✅ Real-time notifications active')
    } else if (notificationStream.isConnecting) {
      console.log('[NotificationProvider]: 🔄 Connecting to notifications...')
    } else if (notificationStream.error) {
      console.log(
        '[NotificationProvider]: ❌ Notification connection failed:',
        notificationStream.error
      )
    }
  }, [
    shouldConnect,
    notificationStream.isConnected,
    notificationStream.isConnecting,
    notificationStream.error,
  ])

  const contextValue: NotificationContextType = {
    isConnected: shouldConnect ? notificationStream.isConnected : false,
    isConnecting: shouldConnect ? notificationStream.isConnecting : false,
    error: shouldConnect ? notificationStream.error : null,
    reconnect: shouldConnect
      ? (notificationStream.reconnect ??
        (() => {
          return
        }))
      : () => {
          return
        },
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Toast notifications will be rendered here */}
      <Toaster />

      {/* Optional: Global connection status indicator (only show for authenticated users) */}
      {shouldConnect && notificationStream.error && (
        <div className="fixed right-4 bottom-4 z-50">
          <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 shadow-lg">
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
  )
}

// Optional: Connection status indicator component
export function ConnectionStatusIndicator() {
  const { isConnected, isConnecting, error } = useNotificationContext()

  if (isConnected) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
        <span className="text-xs">Live</span>
      </div>
    )
  }

  if (isConnecting) {
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500"></div>
        <span className="text-xs">Connecting...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <div className="h-2 w-2 rounded-full bg-red-500"></div>
        <span className="text-xs">Offline</span>
      </div>
    )
  }

  return null
}
