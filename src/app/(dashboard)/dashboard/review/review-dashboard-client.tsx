'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import {
  Clock,
  FileText,
  Users,
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
import type { Committee, Milestone, GrantProgram } from '@/lib/db/schema'

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
  committee?: Pick<
    Committee,
    'id' | 'name' | 'description' | 'logoUrl' | 'focusAreas' | 'isActive'
  >
  grantProgram?: Pick<GrantProgram, 'id' | 'name' | 'fundingAmount'>
  milestones?: Milestone[]
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colors[status as keyof typeof colors] ?? colors.draft
      }`}
    >
      {status.replace('_', ' ').toUpperCase()}
    </span>
  )
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

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">
              {submission.title ?? 'Untitled Submission'}
            </CardTitle>
            <CardDescription>
              by {submission.submitter?.name ?? 'Anonymous'} •{' '}
              {new Date(submission.createdAt).toLocaleDateString()}
            </CardDescription>

            {/* Committee Badge */}
            {submission.committee && (
              <CommitteeBadge
                committee={submission.committee}
                variant="compact"
                className="mt-1"
              />
            )}

            {/* Milestone Progress for Approved Submissions */}
            <MilestoneProgressBadge
              milestones={submission.milestones ?? []}
              submissionStatus={submission.status}
              variant="compact"
            />
          </div>
          <StatusBadge status={submission.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {submission.description ??
              submission.executiveSummary ??
              'No description available'}
          </p>

          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {labels.slice(0, 3).map((label: string) => (
                <span
                  key={label}
                  className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                >
                  {label}
                </span>
              ))}
              {labels.length > 3 && (
                <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                  +{labels.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {submission.milestones?.length ?? 0} milestones
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {submission.totalAmount
                  ? `$${submission.totalAmount.toLocaleString()}`
                  : submission.grantProgram?.fundingAmount
                    ? `$${submission.grantProgram.fundingAmount.toLocaleString()}`
                    : 'Amount TBD'}
              </div>
              {submission.grantProgram && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {submission.grantProgram.name}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Link href={`/dashboard/submissions/${submission.id}`}>
                <Button variant="outline" size="sm">
                  Review & Discuss
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  const filteredSubmissions = useMemo(() => {
    if (selectedFilter === 'all') return initialSubmissions

    const statusMap = {
      pending: ['submitted'],
      under_review: ['under_review'],
      approved: ['approved'],
      rejected: ['rejected'],
    }

    const targetStatuses =
      statusMap[selectedFilter as keyof typeof statusMap] ?? []
    return initialSubmissions.filter(submission =>
      targetStatuses.includes(submission.status)
    )
  }, [initialSubmissions, selectedFilter])

  const filterButtons = [
    {
      key: 'all',
      label: 'All',
      count: stats.total,
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
            {filter.label} ({filter.count})
          </Button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">
              {selectedFilter === 'all'
                ? 'No submissions found. Check back later for new grant applications.'
                : `No ${selectedFilter.replace('_', ' ')} submissions found.`}
            </p>
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
