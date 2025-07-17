'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, Clock, User, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import type { Discussion, Message, User as UserType } from '@/lib/db/schema';
import { useSubmissionNotifications, useConnectionStatus } from '@/lib/notifications/client';

interface DiscussionMessage extends Message {
  author: {
    id: number;
    name: string | null;
    role: string;
  };
}

interface DiscussionData extends Discussion {
  messages: DiscussionMessage[];
}

interface DiscussionThreadProps {
  discussion: DiscussionData | null;
  submissionId?: number;
  milestoneId?: number;
  currentUser: UserType | null;
  onPostMessage: (content: string, type?: string) => Promise<void>;
  title: string;
  isPublic?: boolean;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'curator': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

export function DiscussionThread({
  discussion,
  submissionId,
  milestoneId,
  currentUser,
  onPostMessage,
  title,
  isPublic = false
}: DiscussionThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  // Real-time notifications for this submission
  const notificationStatus = useSubmissionNotifications(submissionId);
  const connectionStatus = useConnectionStatus();

  // Auto-refresh page when new messages arrive for this discussion
  useEffect(() => {
    const handleNewMessage = () => {
      console.log('[DiscussionThread]: New message notification received, refreshing...');
      // Simple page refresh for now - could be optimized to just refetch discussion data
      window.location.reload();
    };

    // Set up listener for new messages in this submission
    if (submissionId && (window as any).handleRealtimeNotification) {
      const originalHandler = (window as any).handleRealtimeNotification;
      (window as any).handleRealtimeNotification = (notification: any) => {
        originalHandler?.(notification);
        if (notification.type === 'new_message' && notification.submissionId === submissionId) {
          handleNewMessage();
        }
      };
    }
  }, [submissionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    startTransition(async () => {
      try {
        await onPostMessage(newMessage.trim());
        setNewMessage('');
      } catch (error) {
        console.error('[DiscussionThread]: Error posting message', error);
      }
    });
  };

  const canPostMessage = currentUser && !isPublic;
  const messages = discussion?.messages || [];

  return (
    <div className="space-y-6">
      {/* Discussion Header */}
      <div className="flex items-center gap-3">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Discussion: {title}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({messages.length} message{messages.length !== 1 ? 's' : ''})
        </span>
        
        {/* Real-time connection status */}
        <div className="flex items-center gap-1 ml-auto">
          {connectionStatus.isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">Live</span>
            </>
          ) : connectionStatus.isConnecting ? (
            <>
              <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />
              <span className="text-xs text-yellow-600 dark:text-yellow-400">Connecting...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No messages yet. {canPostMessage ? 'Start the conversation!' : 'Be the first to comment when logged in.'}
            </p>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {message.author.name || 'Anonymous'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getRoleBadgeColor(message.author.role)}`}>
                      {message.author.role}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(new Date(message.createdAt))}
                    </div>
                  </div>
                  
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {message.content}
                  </div>
                  
                  {message.messageType !== 'comment' && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {message.messageType === 'status_change' && '• Status updated'}
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
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isPending}
                  className="min-h-[80px]"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your message will be visible to all users
              </p>
              <Button
                type="submit"
                disabled={!newMessage.trim() || isPending}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isPending ? 'Posting...' : 'Post Message'}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <p className="text-center text-gray-600 dark:text-gray-400">
            {currentUser ? 'You need curator permissions to post messages' : 'Please sign in to participate in the discussion'}
          </p>
        </Card>
      )}
    </div>
  );
} 