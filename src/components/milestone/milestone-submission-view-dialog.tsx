'use client'

import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  GitCommit,
  Target,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Milestone } from '@/lib/db/schema'
import type { GitHubCommitDetail } from '@/lib/github/simple-client'
import { getCommitDetails } from '@/lib/github/simple-client'

interface MilestoneSubmissionViewDialogProps {
  milestone: Pick<
    Milestone,
    | 'id'
    | 'title'
    | 'description'
    | 'status'
    | 'deliverables'
    | 'submittedAt'
    | 'githubCommitHash'
    | 'amount'
    | 'dueDate'
    | 'requirements'
  > & {
    submission?: {
      githubRepoUrl?: string | null
    }
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DeliverableItem {
  description?: string
  commits?: {
    sha: string
    shortSha: string
    url: string
  }[]
  submittedAt?: string
  submittedBy?: number
}

export function MilestoneSubmissionViewDialog({
  milestone,
  open,
  onOpenChange,
}: MilestoneSubmissionViewDialogProps) {
  const [commitDetails, setCommitDetails] = useState<
    Record<string, GitHubCommitDetail>
  >({})
  const [loadingCommits, setLoadingCommits] = useState(false)

  // Parse deliverables - can be array or single object
  const parseDeliverables = (): DeliverableItem[] | null => {
    if (!milestone.deliverables) return null

    try {
      // If it's already an array
      if (Array.isArray(milestone.deliverables)) {
        return milestone.deliverables as DeliverableItem[]
      }

      // If it's a single object, wrap it in an array
      if (typeof milestone.deliverables === 'object') {
        return [milestone.deliverables as DeliverableItem]
      }

      // If it's a string, try to parse it
      if (typeof milestone.deliverables === 'string') {
        const parsed = JSON.parse(milestone.deliverables) as
          | DeliverableItem[]
          | DeliverableItem
        return Array.isArray(parsed) ? parsed : [parsed]
      }

      return null
    } catch {
      return null
    }
  }

  const deliverables = parseDeliverables()
  const latestSubmission = deliverables?.[deliverables.length - 1]

  // Fetch commit details from GitHub when dialog opens
  useEffect(() => {
    if (
      !open ||
      !latestSubmission?.commits ||
      !milestone.submission?.githubRepoUrl
    ) {
      return
    }

    const fetchCommitDetails = async () => {
      setLoadingCommits(true)
      const details: Record<string, GitHubCommitDetail> = {}

      try {
        if (latestSubmission.commits) {
          await Promise.all(
            latestSubmission.commits.map(async commit => {
              try {
                const detail = await getCommitDetails(
                  milestone.submission!.githubRepoUrl!,
                  commit.sha
                )
                if (detail) {
                  details[commit.sha] = detail
                }
              } catch (error) {
                console.error(
                  `[MilestoneSubmissionViewDialog]: Failed to fetch commit ${commit.sha}`,
                  error
                )
              }
            })
          )
        }
        setCommitDetails(details)
      } catch (error) {
        console.error(
          '[MilestoneSubmissionViewDialog]: Error fetching commit details',
          error
        )
      } finally {
        setLoadingCommits(false)
      }
    }

    void fetchCommitDetails()
  }, [
    open,
    latestSubmission?.commits,
    milestone.submission?.githubRepoUrl,
    milestone.submission,
  ])

  if (!latestSubmission) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Milestone Submission Details
          </DialogTitle>
          <DialogDescription>
            View the details of your submission for "{milestone.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Milestone Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Milestone Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Status:
                </span>
                <Badge
                  className={
                    milestone.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : milestone.status === 'in-review'
                        ? 'bg-yellow-100 text-yellow-800'
                        : milestone.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                  }
                >
                  {milestone.status?.replace('_', ' ')}
                </Badge>
              </div>

              {/* Milestone Info */}
              <div className="grid grid-cols-2 gap-4">
                {milestone.amount && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">
                      ${milestone.amount.toLocaleString()}
                    </span>
                  </div>
                )}
                {milestone.dueDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">
                      Due:{' '}
                      {new Date(milestone.dueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {milestone.description && (
                <div>
                  <h4 className="mb-1 text-sm font-medium">Description:</h4>
                  <p className="text-sm text-gray-600">
                    {milestone.description}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {milestone.requirements &&
                Array.isArray(milestone.requirements) &&
                milestone.requirements.length > 0 && (
                  <div>
                    <h4 className="mb-1 text-sm font-medium">Requirements:</h4>
                    <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                      {milestone.requirements.map((req: string, i: number) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Submission Date */}
          {milestone.submittedAt && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                Submitted on{' '}
                {new Date(milestone.submittedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {/* Deliverables Description */}
          {latestSubmission.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Deliverables Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-gray-700">
                  {latestSubmission.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Commits */}
          {latestSubmission.commits && latestSubmission.commits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitCommit className="h-4 w-4" />
                  Commits Included ({latestSubmission.commits.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Commit Statistics Summary */}
                {loadingCommits ? (
                  <div className="mb-4 flex items-center justify-center py-4">
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">
                      Loading commit details from GitHub...
                    </span>
                  </div>
                ) : (
                  (() => {
                    const stats = Object.values(commitDetails).reduce(
                      (total, commit) => ({
                        additions:
                          total.additions + (commit.stats?.additions ?? 0),
                        deletions:
                          total.deletions + (commit.stats?.deletions ?? 0),
                        total: total.total + (commit.stats?.total ?? 0),
                      }),
                      { additions: 0, deletions: 0, total: 0 }
                    )
                    if (stats.total > 0) {
                      return (
                        <div className="mb-4 rounded-lg bg-blue-50 p-3">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">
                              Total Changes: {stats.total} lines
                            </span>
                            <span className="text-green-600">
                              +{stats.additions}
                            </span>
                            <span className="text-red-600">
                              -{stats.deletions}
                            </span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()
                )}

                {/* Commit List */}
                <div className="space-y-3">
                  {latestSubmission.commits?.map((commit, index) => {
                    const detail = commitDetails[commit.sha]
                    return (
                      <div
                        key={commit.sha || index}
                        className="rounded-lg border bg-gray-50 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex min-w-0 flex-1 flex-col gap-2">
                            {/* Commit SHA and Link */}
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-gray-200 px-2 py-1 font-mono text-xs">
                                {commit.shortSha || commit.sha?.substring(0, 7)}
                              </code>
                              {commit.url && (
                                <a
                                  href={commit.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  <span className="text-xs">
                                    View on GitHub
                                  </span>
                                </a>
                              )}
                            </div>

                            {/* Commit Message - fetched from GitHub */}
                            {detail?.message && (
                              <p className="text-sm font-medium text-gray-900">
                                {detail.message.split('\n')[0]}
                              </p>
                            )}

                            {/* Commit Metadata - fetched from GitHub */}
                            {detail && (
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {detail.author.name && (
                                  <span>{detail.author.name}</span>
                                )}
                                {detail.author.date && (
                                  <span>
                                    {new Date(
                                      detail.author.date
                                    ).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                )}
                                {detail.stats && (
                                  <div className="flex gap-2">
                                    <span className="text-green-600">
                                      +{detail.stats.additions}
                                    </span>
                                    <span className="text-red-600">
                                      -{detail.stats.deletions}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Loading state for individual commit */}
                            {!detail && !loadingCommits && (
                              <p className="text-xs text-gray-400 italic">
                                Click GitHub link to view commit details
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Primary Commit Hash */}
          {milestone.githubCommitHash && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle className="h-4 w-4" />
                  Primary Commit Hash
                </CardTitle>
              </CardHeader>
              <CardContent>
                <code className="block rounded bg-gray-100 px-3 py-2 font-mono text-sm break-all">
                  {milestone.githubCommitHash}
                </code>
              </CardContent>
            </Card>
          )}

          {/* Multiple Submissions Notice */}
          {deliverables && deliverables.length > 1 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-700">
                This milestone has been submitted {deliverables.length} times.
                Showing the latest submission.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
