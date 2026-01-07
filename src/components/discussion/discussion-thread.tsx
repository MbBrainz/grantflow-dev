'use client'

import {
  AlertCircle,
  Clock,
  MessageCircle,
  Send,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DiscussionWithMessages, User as UserType } from '@/lib/db/schema'
import type {
  RealtimeNotification,
  WindowWithNotificationHandler,
} from '@/lib/notifications/client'
import {
  useConnectionStatus,
  useSubmissionNotifications,
} from '@/lib/notifications/client'

// Type alias for backwards compatibility

interface DiscussionThreadProps {
  discussion: DiscussionWithMessages | undefined
  submissionId?: number
  milestoneId?: number
  currentUser: UserType | null
  onPostMessage: (content: string, type?: string) => Promise<void>
  title: string
  isPublic?: boolean
  submissionContext?: {
    isCommitteeReviewer?: boolean
    isSubmissionOwner?: boolean
    canViewPrivateDiscussions?: boolean
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'reviewer':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

export function DiscussionThread({
  discussion,
  submissionId,
  currentUser,
  onPostMessage,
  title,
  isPublic = false,
  submissionContext,
}: DiscussionThreadProps) {
  const [newMessage, setNewMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  // Real-time notifications for this submission
  useSubmissionNotifications(submissionId)
  const connectionStatus = useConnectionStatus()

  // Auto-refresh page when new messages arrive for this discussion
  useEffect(() => {
    const handleNewMessage = () => {
      console.log(
        '[DiscussionThread]: New message notification received, refreshing...'
      )
      // Simple page refresh for now - could be optimized to just refetch discussion data
      window.location.reload()
    }

    interface NotificationWithSubmission extends RealtimeNotification {
      submissionId?: number
    }

    // Set up listener for new messages in this submission

    const windowWithHandler = window as WindowWithNotificationHandler
    if (submissionId && windowWithHandler.handleRealtimeNotification) {
      const originalHandler = windowWithHandler.handleRealtimeNotification
      windowWithHandler.handleRealtimeNotification = (
        notification: NotificationWithSubmission
      ) => {
        originalHandler?.(notification)
        if (
          notification.type === 'new_message' &&
          notification.submissionId === submissionId
        ) {
          handleNewMessage()
        }
      }
    }
  }, [submissionId])

  // eslint-disable-next-line @typescript-eslint/require-await
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    startTransition(async () => {
      try {
        await onPostMessage(newMessage.trim())
        setNewMessage('')
      } catch (error) {
        console.error('[DiscussionThread]: Error posting message', error)
      }
    })
  }

  // Determine if user can post messages based on context
  const canPostMessage =
    currentUser &&
    (isPublic ?? // Public discussions allow authenticated users to post
      submissionContext?.isCommitteeReviewer ?? // Committee reviewers can always post
      submissionContext?.isSubmissionOwner) // Submission owners can always post
  const messages = discussion?.messages ?? []

  return (
    <div className="space-y-6">
      {/* Discussion Header */}
      <div className="flex items-center gap-3">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Discussion: {title}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({messages.length} message{messages.length !== 1 ? 's' : ''})
        </span>

        {/* Real-time connection status */}
        <div className="ml-auto flex items-center gap-1">
          {connectionStatus.isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">
                Live
              </span>
            </>
          ) : connectionStatus.isConnecting ? (
            <>
              <AlertCircle className="h-4 w-4 animate-pulse text-yellow-500" />
              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                Connecting...
              </span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Offline
              </span>
            </>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">
              No messages yet.{' '}
              {canPostMessage
                ? 'Start the conversation!'
                : 'Be the first to comment when logged in.'}
            </p>
          </Card>
        ) : (
          messages.map(message => (
            <Card key={message.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {message.author.name ?? 'Anonymous'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${getRoleBadgeColor(message.author.primaryRole)}`}
                    >
                      {message.author.primaryRole}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(new Date(message.createdAt))}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {message.content}
                  </div>

                  {message.messageType !== 'comment' && (
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {message.messageType === 'status_change' &&
                        '• Status updated'}
                      {message.messageType === 'vote' && '• Vote cast'}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Message Input Form */}
      {canPostMessage ? (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="message" className="text-sm font-medium">
                Add a comment
              </Label>
              <div className="mt-2">
                <Input
                  id="message"
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  disabled={isPending}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your message will be visible to all users
              </p>
              <Button
                type="submit"
                disabled={!newMessage.trim() || isPending}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isPending ? 'Posting...' : 'Post Message'}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="bg-gray-50 p-4 dark:bg-gray-800">
          <p className="text-center text-gray-600 dark:text-gray-400">
            {currentUser
              ? isPublic
                ? 'You need reviewer permissions to post messages'
                : 'This discussion is not open for public comments'
              : 'Please sign in to participate in the discussion'}
          </p>
        </Card>
      )}
    </div>
  )
}
