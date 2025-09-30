'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { postMessageToSubmission } from '../discussion-actions'
import type { SubmissionWithMilestones } from '@/lib/db/schema'
import type { User } from '@/lib/db/schema'
import { useSubmissionContext } from '@/lib/hooks/use-submission-context'
import { ReviewerSubmissionView } from '@/components/submissions/reviewer-submission-view'
import { GranteeSubmissionView } from '@/components/submissions/grantee-submission-view'
import { PublicSubmissionView } from '@/components/submissions/public-submission-view'

interface SubmissionDetailViewProps {
  submission: SubmissionWithMilestones
  currentUser: User | null
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'submitted':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    default:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  }
}

export function SubmissionDetailView({
  submission,
  currentUser,
}: SubmissionDetailViewProps) {
  const router = useRouter()


  // Simple context - just determines view type
  const context = useSubmissionContext(submission, currentUser)

  const handlePostMessage = async (content: string, type?: string) => {
    const messageType =
      type === 'comment' || type === 'status_change' || type === 'vote'
        ? type
        : 'comment'

    const fd = new FormData()
    fd.append('content', content)
    fd.append('submissionId', String(submission.id))
    fd.append('messageType', messageType)

    const result = await postMessageToSubmission({}, fd)

    if (result.error) {
      throw new Error(result.error)
    }

    // Refresh the page to get updated data
    router.refresh()
  }

  const handleVoteSubmitted = () => {
    // Refresh the page to get updated data
    router.refresh()
  }

  const displayTitle = submission.title || 'Untitled Submission'
  const appliedDate = submission.appliedAt
    ? new Date(submission.appliedAt).toLocaleDateString()
    : 'Unknown'

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex-1">
          <h1 className="text-2xl font-bold">{displayTitle}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <span>Submission #{submission.id}</span>
            <Badge className={getStatusColor(submission.status)}>
              {submission.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <span>Applied {appliedDate}</span>
            <Badge variant="outline" className="text-xs">
              Viewing as: {context.viewType}
            </Badge>
          </div>
        </div>
      </div>

      {/* Role-Based View Routing */}
      {context.viewType === 'reviewer' && (
        <ReviewerSubmissionView
          submission={submission}
          currentUser={currentUser}
          onPostMessage={handlePostMessage}
          onVoteSubmitted={handleVoteSubmitted}
        />
      )}

      {context.viewType === 'grantee' && (
        <GranteeSubmissionView
          submission={submission}
          currentUser={currentUser}
          onPostMessage={handlePostMessage}
          onVoteSubmitted={handleVoteSubmitted}
        />
      )}

      {context.viewType === 'public' && (
        <PublicSubmissionView submission={submission} />
      )}
    </div>
  )
}
