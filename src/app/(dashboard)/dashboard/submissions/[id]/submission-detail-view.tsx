'use client'

import {
  Award,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  Eye,
  FilePenLine,
  GitBranch,
  Hash,
  type LucideIcon,
  MessageSquare,
  Target,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GranteeSubmissionView } from '@/components/submissions/grantee-submission-view'
import { PublicSubmissionView } from '@/components/submissions/public-submission-view'
import { ReviewerSubmissionView } from '@/components/submissions/reviewer-submission-view'
import { calculateSubmissionMetrics } from '@/components/submissions/submission-metrics'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { SubmissionWithMilestones, User } from '@/lib/db/schema'
import { useSubmissionContext } from '@/lib/hooks/use-submission-context'
import { postMessageToSubmission } from '../discussion-actions'

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
      return Array.isArray(parsed)
        ? parsed.filter(label => typeof label === 'string')
        : []
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
              <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
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
                className="text-muted-foreground flex items-center gap-1.5 rounded-full text-xs tracking-wide uppercase"
              >
                <Eye className="h-3.5 w-3.5" />
                Viewing as: {context.viewType}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="border-border/70 bg-muted/30 rounded-lg border p-4 shadow-sm">
              <div className="text-foreground mb-2 flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-blue-600" />
                Review Status
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-lg font-semibold text-emerald-600">
                    {metrics.approveVotes}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-lg font-semibold text-red-600">
                    {metrics.rejectVotes}
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                {metrics.totalVotes} total review
                {metrics.totalVotes !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="border-border/70 bg-muted/30 rounded-lg border p-4 shadow-sm">
              <div className="text-foreground mb-2 flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Funding
              </div>
              <p className="text-xl font-semibold">{funding}</p>
              <div className="text-muted-foreground mt-1 text-xs">
                <span className="text-emerald-600 font-medium">
                  ${metrics.claimedAmount.toLocaleString()}
                </span>{' '}
                claimed of total requested
              </div>
            </div>

            <div className="border-border/70 bg-muted/30 rounded-lg border p-4 shadow-sm">
              <div className="text-foreground mb-2 flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4 text-orange-500" />
                Milestone Progress
              </div>
              <div className="mt-3">
                <div className="bg-muted h-2 w-full rounded-full">
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
                <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
                  <span>
                    {metrics.completedMilestones}/{metrics.totalMilestones}{' '}
                    completed
                  </span>
                  <span>{metrics.milestoneProgressPercent}%</span>
                </div>
              </div>
            </div>

            <div className="border-border/70 bg-muted/30 rounded-lg border p-4 shadow-sm">
              <div className="text-foreground mb-2 flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-purple-500" />
                Timeline
              </div>
              <p className="text-xl font-semibold">
                {metrics.daysSinceApplied != null
                  ? `${metrics.daysSinceApplied} days`
                  : 'Unknown'}
              </p>
              <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                <MessageSquare className="h-3.5 w-3.5" />
                {metrics.totalMessages} messages across discussions
              </div>
            </div>
          </div>

          {/* Committee (which IS the grant program now) */}
          {submission.reviewerGroup && (
            <div className="border-border border-t border-dashed pt-4 text-sm">
              <Link
                href={`/dashboard/committees/${submission.reviewerGroup.id}`}
                className="border-border/60 bg-muted/40 hover:border-primary/40 hover:bg-background dark:hover:border-primary/60 inline-flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
              >
                <Users className="text-muted-foreground h-5 w-5" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs font-medium uppercase">
                    Committee
                  </span>
                  <span className="text-primary font-medium">
                    {submission.reviewerGroup.name}
                  </span>
                </div>
              </Link>
            </div>
          )}

          {hasSummaryContent && (
            <div className="border-border border-t border-dashed pt-4">
              <div className="text-muted-foreground mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                <Award className="h-4 w-4 text-blue-600" />
                Project Summary
              </div>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="text-muted-foreground space-y-4 text-sm leading-6">
                  {submission.executiveSummary && (
                    <div>
                      <h4 className="text-foreground/70 mb-1 text-xs font-semibold tracking-wide uppercase">
                        Executive Summary
                      </h4>
                      <p className="text-foreground/80">
                        {submission.executiveSummary}
                      </p>
                    </div>
                  )}

                  {submission.description && (
                    <div>
                      <h4 className="text-foreground/70 mb-1 text-xs font-semibold tracking-wide uppercase">
                        Project Goals
                      </h4>
                      <p className="text-foreground/80">
                        {submission.description}
                      </p>
                    </div>
                  )}

                  {submission.postGrantPlan && (
                    <div>
                      <h4 className="text-foreground/70 mb-1 text-xs font-semibold tracking-wide uppercase">
                        Post-Grant Development
                      </h4>
                      <p className="text-foreground/80">
                        {submission.postGrantPlan}
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-muted-foreground space-y-4 text-sm">
                  <div>
                    <h4 className="text-foreground/70 mb-2 text-xs font-semibold tracking-wide uppercase">
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
                      {submission.walletAddress && (
                        <div className="pt-2 border-t border-border/50">
                          <span className="text-xs text-muted-foreground block mb-1">
                            Beneficiary Address
                          </span>
                          <div className="flex items-center gap-2">
                            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-foreground font-mono text-xs">
                              {submission.walletAddress.slice(0, 8)}...
                              {submission.walletAddress.slice(-6)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  submission.walletAddress!
                                )
                              }}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Copy address"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <a
                              href={`https://paseo.subscan.io/account/${submission.walletAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title="View on explorer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      )}
                      {submission.githubRepoUrl && (
                        <a
                          href={submission.githubRepoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-primary flex items-center gap-2 transition-colors"
                        >
                          <GitBranch className="h-3.5 w-3.5" />
                          View Code
                        </a>
                      )}
                    </div>
                  </div>

                  {projectLabels.length > 0 && (
                    <div>
                      <h4 className="text-foreground/70 mb-2 text-xs font-semibold tracking-wide uppercase">
                        Project Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {projectLabels.map(label => (
                          <Badge
                            key={label}
                            variant="outline"
                            className="text-xs"
                          >
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
