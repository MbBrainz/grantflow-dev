'use client'

import { Badge } from '@/components/ui/badge'
import {
  type LucideIcon,
  Award,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock,
  Eye,
  FilePenLine,
  Hash,
  Layers,
  MessageSquare,
  DollarSign,
  Target,
  GitBranch,
  Users,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { postMessageToSubmission } from '../discussion-actions'
import type { SubmissionWithMilestones } from '@/lib/db/schema'
import type { User } from '@/lib/db/schema'
import { useSubmissionContext } from '@/lib/hooks/use-submission-context'
import { ReviewerSubmissionView } from '@/components/submissions/reviewer-submission-view'
import { GranteeSubmissionView } from '@/components/submissions/grantee-submission-view'
import { PublicSubmissionView } from '@/components/submissions/public-submission-view'
import { calculateSubmissionMetrics } from '@/components/submissions/submission-metrics'

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

function getStatusIcon(status: string): LucideIcon {
  switch (status) {
    case 'approved':
      return CheckCircle2
    case 'rejected':
      return XCircle
    case 'draft':
      return FilePenLine
    case 'submitted':
      return CircleDot
    default:
      return CircleDot
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

    const result = await postMessageToSubmission({
      content,
      submissionId: submission.id,
      messageType,
    })

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
    ? new Date(submission.appliedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown'
  const StatusIcon = getStatusIcon(submission.status)
  const metrics = calculateSubmissionMetrics(submission)
  const funding =
    submission.totalAmount != null
      ? `$${submission.totalAmount.toLocaleString()}`
      : 'TBD'
  const projectLabels = (() => {
    if (!submission.labels) {
      return []
    }
    try {
      const parsed = JSON.parse(submission.labels)
      return Array.isArray(parsed) ? parsed.filter(label => typeof label === 'string') : []
    } catch {
      return []
    }
  })()
  const hasSummaryContent =
    Boolean(submission.executiveSummary) ||
    Boolean(submission.description) ||
    Boolean(submission.postGrantPlan) ||
    projectLabels.length > 0 ||
    Boolean(submission.githubRepoUrl)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold sm:text-3xl">
                {displayTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Hash className="h-4 w-4" />
                  Submission #{submission.id}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Applied {appliedDate}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Badge
                className={`flex items-center gap-1.5 text-xs font-semibold tracking-wide ${getStatusColor(
                  submission.status
                )}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {submission.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 rounded-full text-xs uppercase tracking-wide text-muted-foreground"
              >
                <Eye className="h-3.5 w-3.5" />
                Viewing as: {context.viewType}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-border/70 bg-muted/30 p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="h-4 w-4 text-blue-600" />
                Committee Votes
              </div>
              <p className="text-xl font-semibold">
                {metrics.approveVotes}/{metrics.totalVotes}
              </p>
              <p className="text-xs text-muted-foreground">
                Approve / Total votes
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/30 p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Funding
              </div>
              <p className="text-xl font-semibold">{funding}</p>
              <p className="text-xs text-muted-foreground">Requested amount</p>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/30 p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Target className="h-4 w-4 text-orange-500" />
                Milestone Progress
              </div>
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${
                      metrics.milestoneProgressPercent === 100
                        ? 'bg-emerald-500'
                        : metrics.milestoneProgressPercent > 0
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                    }`}
                    style={{ width: `${metrics.milestoneProgressPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {metrics.completedMilestones}/{metrics.totalMilestones}{' '}
                    completed
                  </span>
                  <span>{metrics.milestoneProgressPercent}%</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/30 p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock className="h-4 w-4 text-purple-500" />
                Timeline
              </div>
              <p className="text-xl font-semibold">
                {metrics.daysSinceApplied != null
                  ? `${metrics.daysSinceApplied} days`
                  : 'Unknown'}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                {metrics.totalMessages} messages across discussions
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-dashed border-border pt-4 text-sm sm:grid-cols-2">
            {submission.grantProgram && (
              <Link
                href={`/dashboard/programs/${submission.grantProgram.id}`}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-background dark:hover:border-primary/60"
              >
                <Layers className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Program
                  </span>
                  <span className="font-medium text-primary">
                    {submission.grantProgram.name}
                  </span>
                </div>
              </Link>
            )}
            {submission.reviewerGroup && (
              <Link
                href={`/dashboard/committees/${submission.reviewerGroup.id}`}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-background dark:hover:border-primary/60"
              >
                <Users className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Committee
                  </span>
                  <span className="font-medium text-primary">
                    {submission.reviewerGroup.name}
                  </span>
                </div>
              </Link>
            )}
          </div>

          {hasSummaryContent && (
            <div className="border-t border-dashed border-border pt-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Award className="h-4 w-4 text-blue-600" />
                Project Summary
              </div>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="space-y-4 text-sm leading-6 text-muted-foreground">
                  {submission.executiveSummary && (
                    <div>
                      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                        Executive Summary
                      </h4>
                      <p className="text-foreground/80">
                        {submission.executiveSummary}
                      </p>
                    </div>
                  )}

                  {submission.description && (
                    <div>
                      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                        Project Goals
                      </h4>
                      <p className="text-foreground/80">
                        {submission.description}
                      </p>
                    </div>
                  )}

                  {submission.postGrantPlan && (
                    <div>
                      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                        Post-Grant Development
                      </h4>
                      <p className="text-foreground/80">
                        {submission.postGrantPlan}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                      Project Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Applied</span>
                        <span className="text-foreground">{appliedDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Milestones</span>
                        <span className="text-foreground">
                          {metrics.totalMilestones}
                        </span>
                      </div>
                      {submission.githubRepoUrl && (
                        <a
                          href={submission.githubRepoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-foreground transition-colors hover:text-primary"
                        >
                          <GitBranch className="h-3.5 w-3.5" />
                          View Code
                        </a>
                      )}
                    </div>
                  </div>

                  {projectLabels.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                        Project Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {projectLabels.map(label => (
                          <Badge key={label} variant="outline" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
