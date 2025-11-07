import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { MetadataGrid } from '@/components/ui/metadata-grid'
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  GitBranch,
  Calendar,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Milestone } from '@/lib/db/schema'

interface MilestoneCardProps {
  milestone: Pick<
    Milestone,
    | 'id'
    | 'title'
    | 'description'
    | 'status'
    | 'amount'
    | 'dueDate'
    | 'submittedAt'
    | 'githubRepoUrl'
    | 'githubPrUrl'
    | 'githubCommitHash'
  >
  milestoneNumber: number
  isExpanded?: boolean
  onToggleExpand?: () => void
  userVote?: {
    vote: 'approve' | 'reject' | 'abstain'
    feedback?: string | null
  } | null
  approvalCount?: number
  rejectionCount?: number
  votesNeeded?: number
  showReviewButton?: boolean
  onReviewClick?: () => void
  className?: string
  variant?: 'compact' | 'detailed' | 'list'
  children?: ReactNode
}

export function MilestoneCard({
  milestone,
  milestoneNumber,
  isExpanded = false,
  onToggleExpand,
  userVote,
  approvalCount = 0,
  rejectionCount = 0,
  votesNeeded,
  showReviewButton = false,
  onReviewClick,
  className,
  variant = 'detailed',
}: MilestoneCardProps) {
  const isCompact = variant === 'compact'
  const isList = variant === 'list'

  if (isCompact) {
    return (
      <div
        className={cn(
          'rounded-lg border border-orange-200 bg-white p-4',
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Milestone {milestoneNumber}
              </span>
              <StatusBadge status={milestone.status} />
            </div>
            <h3 className="mb-1 font-semibold">{milestone.title}</h3>
            {milestone.description && (
              <p className="mb-2 text-sm text-gray-600">
                {milestone.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {milestone.amount && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  ${milestone.amount.toLocaleString()}
                </div>
              )}
              {milestone.submittedAt && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Submitted {new Date(milestone.submittedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          {showReviewButton && (
            <Button
              variant="default"
              size="sm"
              className="ml-4"
              onClick={onReviewClick}
            >
              Review Milestone
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (isList) {
    return (
      <div
        className={cn(
          'rounded-lg border-2 border-gray-200 bg-white transition-all',
          className
        )}
      >
        <button
          onClick={onToggleExpand}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <div className="flex flex-1 items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-500">
                MILESTONE {milestoneNumber}
              </span>
              <span className="font-semibold text-gray-900">
                {milestone.title}
              </span>
              <StatusBadge status={milestone.status} />
              {userVote && (
                <Badge
                  className={cn(
                    'flex items-center gap-1.5',
                    userVote.vote === 'approve'
                      ? 'border-green-300 bg-green-100 text-green-800'
                      : userVote.vote === 'reject'
                        ? 'border-red-300 bg-red-100 text-red-800'
                        : 'border-yellow-300 bg-yellow-100 text-yellow-800'
                  )}
                  variant="outline"
                >
                  {userVote.vote === 'approve' && (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  {userVote.vote === 'reject' && (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {userVote.vote === 'abstain' && (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  You voted: {userVote.vote.charAt(0).toUpperCase() + userVote.vote.slice(1)}
                </Badge>
              )}
              {votesNeeded !== undefined && (
                <div
                  className="flex items-center gap-1 rounded-full border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-medium"
                  title={`${approvalCount} approvals / ${rejectionCount} rejections / ${votesNeeded} needed for quorum`}
                >
                  <span className="text-green-600">{approvalCount}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-red-600">{rejectionCount}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-900">{votesNeeded}</span>
                </div>
              )}
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="border-t bg-gray-50 p-6">
            {milestone.description && (
              <p className="mb-4 whitespace-pre-wrap text-gray-700">
                {milestone.description}
              </p>
            )}

            <MetadataGrid
              items={[
                {
                  icon: <DollarSign className="h-4 w-4 text-gray-500" />,
                  label: 'Amount',
                  value: `$${milestone.amount?.toLocaleString() ?? 0}`,
                },
                {
                  icon: <CheckCircle className="h-4 w-4 text-green-600" />,
                  label: 'Approvals',
                  value: approvalCount,
                  className: 'text-green-600',
                },
                {
                  icon: <XCircle className="h-4 w-4 text-red-600" />,
                  label: 'Rejections',
                  value: rejectionCount,
                  className: 'text-red-600',
                },
                {
                  icon: <Clock className="h-4 w-4 text-gray-500" />,
                  label: 'Submitted',
                  value: milestone.submittedAt
                    ? new Date(milestone.submittedAt).toLocaleDateString()
                    : 'Not yet',
                },
              ]}
              columns={4}
              className="mb-4"
            />

            {(milestone.githubRepoUrl ??
              milestone.githubPrUrl ??
              milestone.githubCommitHash) && (
              <div className="mb-4 rounded-lg border bg-white p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <GitBranch className="h-4 w-4" />
                  Repository Information
                </h4>
                <div className="space-y-1 text-sm">
                  {milestone.githubRepoUrl && (
                    <div>
                      <span className="text-gray-500">Repo: </span>
                      <a
                        href={milestone.githubRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {milestone.githubRepoUrl}
                      </a>
                    </div>
                  )}
                  {milestone.githubPrUrl && (
                    <div>
                      <span className="text-gray-500">PR: </span>
                      <a
                        href={milestone.githubPrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {milestone.githubPrUrl}
                      </a>
                    </div>
                  )}
                  {milestone.githubCommitHash && (
                    <div>
                      <span className="text-gray-500">Commit: </span>
                      <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
                        {milestone.githubCommitHash}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showReviewButton && onReviewClick && (
              <div className="flex justify-end">
                <Button variant="default" onClick={onReviewClick}>
                  Review This Milestone
                </Button>
              </div>
            )}

          </div>
        )}
      </div>
    )
  }

  // Default detailed variant
  return (
    <div className={cn('rounded-lg border bg-white p-4', className)}>
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">
            Milestone {milestoneNumber}
          </span>
          <StatusBadge status={milestone.status} />
        </div>
        <h3 className="mb-2 font-semibold">{milestone.title}</h3>
        {milestone.description && (
          <p className="text-sm text-gray-600">{milestone.description}</p>
        )}
      </div>

      <MetadataGrid
        items={[
          {
            icon: <DollarSign className="h-4 w-4 text-gray-500" />,
            label: 'Amount',
            value: `$${milestone.amount?.toLocaleString() ?? 0}`,
          },
          {
            icon: <Clock className="h-4 w-4 text-gray-500" />,
            label: 'Submitted',
            value: milestone.submittedAt
              ? new Date(milestone.submittedAt).toLocaleDateString()
              : 'Not yet',
          },
          {
            icon: <Calendar className="h-4 w-4 text-gray-500" />,
            label: 'Due Date',
            value: milestone.dueDate
              ? new Date(milestone.dueDate).toLocaleDateString()
              : 'Not specified',
          },
        ]}
        columns={3}
      />
    </div>
  )
}

