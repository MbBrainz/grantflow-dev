'use client'

import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Target,
  Vote,
} from 'lucide-react'
import { useState } from 'react'
import type { MetadataItem } from '@/components/submissions/actionable-card'
import { ActionableCard } from '@/components/submissions/actionable-card'
import { CommitteeBadge } from '@/components/submissions/committee-badge'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Committee } from '@/lib/db/schema'

export interface PendingAction {
  id: number
  title: string
  actionType: 'submission_vote' | 'milestone_review'
  actionDescription: string
  daysOld: number
  submitter?: {
    id: number
    name: string | null
    email: string | null
  }
  // Committee IS the grant program now
  committee?: Pick<
    Committee,
    | 'id'
    | 'name'
    | 'description'
    | 'logoUrl'
    | 'focusAreas'
    | 'isActive'
    | 'fundingAmount'
  >
  // For milestone actions
  submission?: {
    id: number
    title: string
    status: string
    submitter?: {
      id: number
      name: string | null
      email: string | null
    }
    committee?: Pick<
      Committee,
      'id' | 'name' | 'description' | 'logoUrl' | 'focusAreas'
    >
  }
}

interface PendingActionsPanelProps {
  submissionsNeedingVote: PendingAction[]
  milestonesNeedingReview: PendingAction[]
}

function ActionCard({ action }: { action: PendingAction }) {
  const isSubmissionVote = action.actionType === 'submission_vote'
  const isUrgent = action.daysOld > 7
  const isCritical = action.daysOld > 14

  const linkHref = isSubmissionVote
    ? `/dashboard/submissions/${action.id}`
    : `/dashboard/submissions/${action.submission?.id}`

  const urgencyBadges = []
  if (isCritical || isUrgent) {
    urgencyBadges.push(
      <Badge
        key="urgency"
        variant={isCritical ? 'destructive' : 'secondary'}
        className="text-xs"
      >
        {isCritical ? 'Critical' : 'Urgent'}
      </Badge>
    )
  }

  urgencyBadges.push(
    <Badge key="action" variant="outline" className="text-xs">
      {isSubmissionVote ? 'Vote Required' : 'Review Required'}
    </Badge>
  )

  return (
    <ActionableCard
      title={
        isSubmissionVote
          ? action.title
          : `${action.submission?.title} - ${action.title}`
      }
      subtitle={`by ${
        (isSubmissionVote
          ? action.submitter?.name
          : action.submission?.submitter?.name) ?? 'Anonymous'
      } • ${action.daysOld} days old`}
      urgency={isCritical ? 'critical' : isUrgent ? 'urgent' : 'normal'}
      badges={[
        action.committee && (
          <CommitteeBadge
            key="committee"
            committee={action.committee}
            variant="compact"
          />
        ),
        ...urgencyBadges,
      ].filter(Boolean)}
      metadata={
        isSubmissionVote
          ? ([
              {
                icon: <Target className="h-4 w-4" />,
                value: action.committee?.name ?? 'General Program',
              },
              action.committee?.fundingAmount
                ? {
                    icon: <span>$</span>,
                    value: `$${action.committee.fundingAmount.toLocaleString()}`,
                  }
                : undefined,
            ].filter(Boolean) as MetadataItem[])
          : [
              {
                icon: <Target className="h-4 w-4" />,
                value: 'Milestone Review',
              },
            ]
      }
      actionButton={{
        label: isSubmissionVote ? 'Review & Vote' : 'Review Milestone',
        href: linkHref,
        icon: <ArrowRight className="h-4 w-4" />,
      }}
    />
  )
}

export function PendingActionsPanel({
  submissionsNeedingVote,
  milestonesNeedingReview,
}: PendingActionsPanelProps) {
  const [isMilestonesExpanded, setIsMilestonesExpanded] = useState(true)
  const [isSubmissionsExpanded, setIsSubmissionsExpanded] = useState(true)
  const totalActions =
    submissionsNeedingVote.length + milestonesNeedingReview.length

  if (totalActions === 0) {
    return (
      <Card className="border-l-4 border-l-green-500 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <Vote className="h-4 w-4 text-green-600" />
            </div>
            <CardTitle className="text-green-800">All Caught Up!</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            No pending actions require your immediate attention. Great work!
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
            <CardTitle className="text-orange-800">
              {totalActions} Action{totalActions > 1 ? 's' : ''} Awaiting Your
              Response
            </CardTitle>
          </div>
          <CardDescription className="text-orange-700">
            The following submissions and milestones require your immediate
            review and approval.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Milestones Needing Review */}
      {milestonesNeedingReview.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setIsMilestonesExpanded(!isMilestonesExpanded)}
            className="flex w-full items-center justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">
                Milestones Awaiting Your Review (
                {milestonesNeedingReview.length})
              </h3>
            </div>
            {isMilestonesExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          {isMilestonesExpanded && (
            <div className="space-y-3">
              {milestonesNeedingReview.map(action => (
                <ActionCard key={`milestone-${action.id}`} action={action} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submissions Needing Vote */}
      {submissionsNeedingVote.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setIsSubmissionsExpanded(!isSubmissionsExpanded)}
            className="flex w-full items-center justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Vote className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">
                New Grant Submissions Awaiting Your Vote (
                {submissionsNeedingVote.length})
              </h3>
            </div>
            {isSubmissionsExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          {isSubmissionsExpanded && (
            <div className="space-y-3">
              {submissionsNeedingVote.map(action => (
                <ActionCard key={`submission-${action.id}`} action={action} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
