'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import {
  PendingActionsPanel,
  type PendingAction,
} from '@/components/review/pending-actions-panel'
import { CommitteeBadge } from '@/components/submissions/committee-badge'
import { MilestoneProgressBadge } from '@/components/submissions/milestone-progress-badge'
import { ActionableCard } from '@/components/submissions/actionable-card'
import { ArrowRight } from 'lucide-react'
import type { Committee, Milestone } from '@/lib/db/schema'

interface Submitter {
  name: string | null
}

interface Submission {
  id: number
  title: string | null
  description: string | null
  executiveSummary: string | null
  status: string
  createdAt: string | Date
  labels: string | null
  totalAmount?: number | null
  submitter?: Submitter
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
  milestones?: Milestone[]
}

function parseLabels(labelsString: string | null): string[] {
  if (!labelsString) return []
  try {
    const parsed: unknown = JSON.parse(labelsString)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

function SubmissionCard({ submission }: { submission: Submission }) {
  const labels = parseLabels(submission.labels)
  const labelBadges =
    labels.length > 0
      ? labels.slice(0, 3).map((label: string) => (
          <span
            key={label}
            className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
          >
            {label}
          </span>
        ))
      : []

  if (labels.length > 3) {
    labelBadges.push(
      <span
        key="more"
        className="rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-600"
      >
        +{labels.length - 3} more
      </span>
    )
  }

  return (
    <ActionableCard
      title={submission.title ?? 'Untitled Submission'}
      subtitle={`by ${submission.submitter?.name ?? 'Anonymous'} • ${new Date(submission.createdAt).toLocaleDateString()}`}
      description={
        submission.description ??
        submission.executiveSummary ??
        'No description available'
      }
      status={submission.status}
      badges={[
        submission.committee && (
          <CommitteeBadge
            key="committee"
            committee={submission.committee}
            variant="compact"
          />
        ),
        <MilestoneProgressBadge
          key="milestones"
          milestones={submission.milestones ?? []}
          submissionStatus={submission.status}
          variant="compact"
        />,
        ...labelBadges,
      ].filter(Boolean)}
      metadata={[
        {
          icon: <FileText className="h-4 w-4" />,
          value: `${submission.milestones?.length ?? 0} milestones`,
        },
        {
          icon: <Clock className="h-4 w-4" />,
          value: submission.totalAmount
            ? `$${submission.totalAmount.toLocaleString()}`
            : submission.committee?.fundingAmount
              ? `$${submission.committee.fundingAmount.toLocaleString()}`
              : 'Amount TBD',
        },
      ].filter(Boolean)}
      actionButton={{
        label: 'Review & Discuss',
        href: `/dashboard/submissions/${submission.id}`,
        variant: 'outline',
        icon: <ArrowRight className="h-4 w-4" />,
      }}
    />
  )
}

interface Stats {
  total: number
  submitted: number
  underReview: number
  approved: number
  rejected: number
}

interface PendingActions {
  submissionsNeedingVote: PendingAction[]
  milestonesNeedingReview: PendingAction[]
}

interface ReviewDashboardClientProps {
  initialSubmissions: Submission[]
  stats: Stats
  pendingActions: PendingActions
}

export function ReviewDashboardClient({
  initialSubmissions,
  stats,
  pendingActions,
}: ReviewDashboardClientProps) {
  // Default filter is 'active' (pending, in-review, changes-requested, approved)
  const [selectedFilter, setSelectedFilter] = useState<string>('active')

  const filteredSubmissions = useMemo(() => {
    if (selectedFilter === 'all') {
      return initialSubmissions
    } else if (selectedFilter === 'active') {
      // Active = pending, in-review, changes-requested, approved (not rejected)
      return initialSubmissions.filter(
        s =>
          s.status === 'pending' ||
          s.status === 'in-review' ||
          s.status === 'changes-requested' ||
          s.status === 'approved'
      )
    } else if (selectedFilter === 'rejected') {
      return initialSubmissions.filter(s => s.status === 'rejected')
    }

    return initialSubmissions
  }, [initialSubmissions, selectedFilter])

  // Calculate active count
  const activeCount = initialSubmissions.filter(
    s =>
      s.status === 'pending' ||
      s.status === 'in-review' ||
      s.status === 'changes-requested' ||
      s.status === 'approved'
  ).length

  const filterButtons = [
    {
      key: 'active',
      label: 'Active',
      count: activeCount,
      variant: 'default' as const,
    },
    {
      key: 'pending',
      label: 'Pending',
      count: stats.submitted,
      variant: 'outline' as const,
    },
    {
      key: 'under_review',
      label: 'Under Review',
      count: stats.underReview,
      variant: 'outline' as const,
    },
    {
      key: 'approved',
      label: 'Approved',
      count: stats.approved,
      variant: 'outline' as const,
    },
    {
      key: 'rejected',
      label: 'Rejected',
      count: stats.rejected,
      variant: 'outline' as const,
    },
    {
      key: 'all',
      label: 'All',
      count: stats.total,
      variant: 'outline' as const,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Dashboard</h1>
          <p className="text-muted-foreground">
            Review grant submissions and manage the approval process
          </p>
        </div>
      </div>

      {/* Pending Actions - Priority Section */}
      <PendingActionsPanel
        submissionsNeedingVote={pendingActions.submissionsNeedingVote}
        milestonesNeedingReview={pendingActions.milestonesNeedingReview}
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Submissions
            </CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.submitted}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.underReview}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Filter Tabs */}
      <div className="flex gap-2">
        {filterButtons.map(filter => (
          <Button
            key={filter.key}
            variant={selectedFilter === filter.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter(filter.key)}
            className="transition-all duration-200"
          >
            {filter.label}
            {filter.count > 0 && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                {filter.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-muted-foreground mb-4">
              {selectedFilter === 'all'
                ? 'No submissions found. Check back later for new grant applications.'
                : selectedFilter === 'active'
                  ? 'No active submissions found.'
                  : `No ${selectedFilter.replace('_', ' ')} submissions found.`}
            </p>
            {selectedFilter !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFilter('all')}
              >
                View All Submissions
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSubmissions.map(submission => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
