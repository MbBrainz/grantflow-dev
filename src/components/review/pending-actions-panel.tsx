'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Clock,
  Vote,
  Target,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { CommitteeBadge } from '@/components/submissions/committee-badge'

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
  committee?: {
    id: number
    name: string
    description: string | null
    logoUrl: string | null
    focusAreas: string | null
  }
  grantProgram?: {
    id: number
    name: string
    fundingAmount: number | null
  }
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
    committee?: {
      id: number
      name: string
      description: string | null
      logoUrl: string | null
    }
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

  const urgencyColor = isCritical
    ? 'border-red-500 bg-red-50'
    : isUrgent
      ? 'border-orange-500 bg-orange-50'
      : 'border-blue-500 bg-blue-50'

  const urgencyIcon = isCritical ? (
    <AlertCircle className="h-4 w-4 text-red-600" />
  ) : isUrgent ? (
    <Clock className="h-4 w-4 text-orange-600" />
  ) : (
    <Vote className="h-4 w-4 text-blue-600" />
  )

  return (
    <Card
      className={`border-l-4 ${urgencyColor} transition-shadow hover:shadow-md`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {urgencyIcon}
              <CardTitle className="text-lg">
                {isSubmissionVote
                  ? action.title
                  : `${action.submission?.title} - ${action.title}`}
              </CardTitle>
              {(isCritical ?? isUrgent) && (
                <Badge
                  variant={isCritical ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {isCritical ? 'Critical' : 'Urgent'}
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-4">
              <span>
                by{' '}
                {(isSubmissionVote
                  ? action.submitter?.name
                  : action.submission?.submitter?.name) ?? 'Anonymous'}
              </span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{action.daysOld} days old</span>
              </div>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {isSubmissionVote ? 'Vote Required' : 'Review Required'}
            </Badge>
          </div>
        </div>

        {/* Committee Badge */}
        {(action.committee ?? action.submission?.committee) && (
          <CommitteeBadge
            committee={{
              id: (action.committee ?? action.submission?.committee!).id,
              name: (action.committee ?? action.submission?.committee!).name,
              description:
                (action.committee ?? action.submission?.committee!)
                  ?.description ?? undefined,
              logoUrl:
                (action.committee ?? action.submission?.committee!)?.logoUrl ||
                undefined,
              focusAreas: action.committee?.focusAreas ?? undefined,
              isActive: true,
            }}
            variant="compact"
            className="mt-2"
          />
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {isSubmissionVote ? (
              <>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {action.grantProgram?.name ?? 'General Program'}
                </div>
                {action.grantProgram?.fundingAmount && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      ${action.grantProgram.fundingAmount.toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Milestone Review
              </div>
            )}
          </div>

          <Link href={linkHref}>
            <Button size="sm" className="flex items-center gap-2">
              {isSubmissionVote ? 'Review & Vote' : 'Review Milestone'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export function PendingActionsPanel({
  submissionsNeedingVote,
  milestonesNeedingReview,
}: PendingActionsPanelProps) {
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

      {/* Submissions Needing Vote */}
      {submissionsNeedingVote.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">
              Submissions Awaiting Your Vote ({submissionsNeedingVote.length})
            </h3>
          </div>
          <div className="space-y-3">
            {submissionsNeedingVote.map(action => (
              <ActionCard key={`submission-${action.id}`} action={action} />
            ))}
          </div>
        </div>
      )}

      {/* Milestones Needing Review */}
      {milestonesNeedingReview.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">
              Milestones Awaiting Your Review ({milestonesNeedingReview.length})
            </h3>
          </div>
          <div className="space-y-3">
            {milestonesNeedingReview.map(action => (
              <ActionCard key={`milestone-${action.id}`} action={action} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
