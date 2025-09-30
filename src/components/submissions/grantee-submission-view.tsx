'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DiscussionThread } from '@/components/discussion/discussion-thread'
import { MilestoneStatusOverview } from '@/components/submissions/milestone-status-overview'
import {
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Target,
  GitBranch,
  Edit,
  Send,
  HelpCircle,
  AlertTriangle,
  Github,
  ExternalLink,
  Lock,
} from 'lucide-react'
import { MilestoneSubmissionForm } from '@/components/milestone-submission-form'
import { submitMilestone } from '@/app/(dashboard)/dashboard/submissions/milestone-actions'

import type { SubmissionWithMilestones, User, Milestone } from '@/lib/db/schema'

interface GranteeSubmissionViewProps {
  submission: SubmissionWithMilestones
  currentUser: User | null
  onPostMessage: (content: string, type?: string) => Promise<void>
  onVoteSubmitted: () => void
}

export function GranteeSubmissionView({
  submission,
  currentUser,
  onPostMessage,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onVoteSubmitted,
}: GranteeSubmissionViewProps) {
  const reviews = submission.reviews ?? []
  const [activeTab, setActiveTab] = useState<
    'status' | 'feedback' | 'milestones'
  >('status')
  const [submittingMilestone, setSubmittingMilestone] = useState<Pick<Milestone, 'id' | 'title' | 'description' | 'requirements' | 'amount' | 'dueDate' | 'status' | 'deliverables' | 'githubRepoUrl' | 'githubCommitHash'> | null>(
    null
  )

  // Determine current stage and required actions
  const getApplicationStage = () => {
    switch (submission.status) {
      case 'pending':
      case 'submitted':
        return {
          stage: 'Under Review',
          description:
            'Your application is being reviewed by the committee reviewers.',
          color: 'blue',
          icon: Clock,
          nextStep: 'Wait for reviewer feedback and voting to complete.',
          canEdit: false,
        }
      case 'changes_requested':
        return {
          stage: 'Changes Requested',
          description:
            'The committee has requested changes to your application.',
          color: 'orange',
          icon: AlertCircle,
          nextStep: 'Review reviewer feedback and submit updated application.',
          canEdit: true,
        }
      case 'approved':
        return {
          stage: 'Approved!',
          description: 'Congratulations! Your application has been approved.',
          color: 'green',
          icon: CheckCircle,
          nextStep: 'Begin working on your first milestone.',
          canEdit: false,
        }
      case 'rejected':
        return {
          stage: 'Not Approved',
          description:
            'Unfortunately, your application was not approved this time.',
          color: 'red',
          icon: AlertCircle,
          nextStep:
            'Review feedback and consider applying again with improvements.',
          canEdit: false,
        }
      default:
        return {
          stage: 'In Progress',
          description: 'Your application is being processed.',
          color: 'gray',
          icon: Clock,
          nextStep: 'Please wait for updates.',
          canEdit: false,
        }
    }
  }

  const stage = getApplicationStage()
  const StageIcon = stage.icon

  // Calculate funding timeline
  const completedMilestones =
    submission.milestones?.filter(m => m.status === 'completed').length ?? 0
  const totalMilestones = submission.milestones?.length ?? 0

  // Get previous milestone commit SHA for commit selection
  const getPreviousMilestoneCommitSha = (currentMilestoneIndex: number) => {
    if (currentMilestoneIndex === 0) return null // First milestone, no previous

    const sortedMilestones = [...(submission.milestones ?? [])].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    // Find the last completed milestone before the current one
    for (let i = currentMilestoneIndex - 1; i >= 0; i--) {
      const milestone = sortedMilestones[i]
      if (milestone.status === 'completed' && milestone.githubCommitHash) {
        return milestone.githubCommitHash
      }
    }
    return null
  }

  const handleMilestoneSubmission = async (data: {
    milestoneId: number
    selectedCommits: string[]
    deliverables: string
    githubCommitHashes: string[]
  }) => {
    try {
      const formData = new FormData()
      formData.append('milestoneId', data.milestoneId.toString())
      formData.append('selectedCommits', JSON.stringify(data.selectedCommits))
      formData.append('deliverables', data.deliverables)
      formData.append(
        'githubCommitHashes',
        JSON.stringify(data.githubCommitHashes)
      )

      const result = await submitMilestone({}, formData)

      if (result.error) {
        throw new Error(result.error)
      }

      // Close the submission form
      setSubmittingMilestone(null)

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error(
        '[GranteeSubmissionView]: Error submitting milestone',
        error
      )
      throw error
    }
  }

  const canSubmitMilestone = (milestone: Pick<Milestone, 'id' | 'status' | 'createdAt'>) => {
    // Check basic requirements
    if (
      !['pending', 'in_progress'].includes(milestone.status) ||
      currentUser?.id !== submission.submitterId
    ) {
      return { canSubmit: false, reason: 'Not available for submission' }
    }

    // Check sequential milestone requirement
    if (submission.milestones) {
      const sortedMilestones = [...submission.milestones].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )

      const targetIndex = sortedMilestones.findIndex(
        (m) => m.id === milestone.id
      )

      // Check all previous milestones are completed
      for (let i = 0; i < targetIndex; i++) {
        const previousMilestone = sortedMilestones[i]
        if (previousMilestone.status !== 'completed') {
          return {
            canSubmit: false,
            reason: `Complete "${previousMilestone.title}" first`,
          }
        }
      }
    }

    return { canSubmit: true }
  }

  return (
    <div className="space-y-6">
      {/* Status Hero */}
      <Card
        className={`border-l-4 p-6 ${
          stage.color === 'blue'
            ? 'border-l-blue-500 bg-blue-50/50'
            : stage.color === 'green'
              ? 'border-l-green-500 bg-green-50/50'
              : stage.color === 'orange'
                ? 'border-l-orange-500 bg-orange-50/50'
                : stage.color === 'red'
                  ? 'border-l-red-500 bg-red-50/50'
                  : 'border-l-gray-500 bg-gray-50/50'
        }`}
      >
        <div className="mb-6 flex items-start gap-4">
          <div
            className={`rounded-full p-3 ${
              stage.color === 'blue'
                ? 'bg-blue-100 text-blue-600'
                : stage.color === 'green'
                  ? 'bg-green-100 text-green-600'
                  : stage.color === 'orange'
                    ? 'bg-orange-100 text-orange-600'
                    : stage.color === 'red'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-600'
            }`}
          >
            <StageIcon className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-2xl font-bold">{stage.stage}</h2>
              {stage.canEdit && (
                <Badge className="bg-blue-100 text-blue-800">
                  Action Available
                </Badge>
              )}
            </div>
            <p className="mb-4 text-lg text-gray-600">{stage.description}</p>

            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Next Step</span>
              </div>
              <p className="text-gray-700">{stage.nextStep}</p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Timeline</span>
            </div>
            <p className="text-sm text-gray-600">
              Applied {new Date(submission.appliedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium">Funding</span>
            </div>
            <p className="text-lg font-bold">
              ${submission.totalAmount?.toLocaleString() ?? 'TBD'}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Milestones</span>
            </div>
            <p className="text-sm">
              {completedMilestones} of {totalMilestones} completed
            </p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              <span className="font-medium">Messages</span>
            </div>
            <p className="text-sm">
              {submission.discussions?.[0]?.messages?.length ?? 0} total
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {stage.canEdit && (
          <div className="mt-6 flex gap-3">
            <Button className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Application
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Submit Response
            </Button>
          </div>
        )}
      </Card>

      {/* Tabbed Content */}
      <Card className="p-6">
        <div className="mb-6 flex items-center gap-1 border-b">
          <Button
            variant={activeTab === 'status' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('status')}
            className="rounded-b-none"
          >
            <Clock className="mr-2 h-4 w-4" />
            Progress Status
          </Button>
          <Button
            variant={activeTab === 'feedback' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('feedback')}
            className="rounded-b-none"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Feedback & Discussion
          </Button>
          <Button
            variant={activeTab === 'milestones' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('milestones')}
            className="rounded-b-none"
          >
            <Target className="mr-2 h-4 w-4" />
            Milestones
          </Button>
        </div>

        {/* Status Tab */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            <MilestoneStatusOverview submission={submission} />

            {/* Reviewer Voting Summary */}
            {reviews.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">Reviewer Voting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Approve</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {reviews.filter(r => r.vote === 'approve').length}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Concerns</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {
                        reviews.filter(
                          r =>
                            r.vote === 'reject' || r.vote === 'abstain'
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {/* Reviewer Feedback Summary */}
            {reviews.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">
                  Reviewer Feedback
                </h3>
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge
                          className={
                            review.vote === 'approve'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {review.vote}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">
                        {review.feedback ?? 'No specific feedback provided'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discussion Thread */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Discussion</h3>
              <DiscussionThread
                discussion={submission.discussions?.[0] ?? undefined}
                submissionId={submission.id}
                currentUser={currentUser}
                onPostMessage={onPostMessage}
                title={submission.title}
                isPublic={true}
              />
            </div>
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            {submittingMilestone ? (
              <MilestoneSubmissionForm
                milestone={submittingMilestone}
                submissionRepoUrl={submission.githubRepoUrl}
                previousMilestoneCommitSha={getPreviousMilestoneCommitSha(
                  submission.milestones?.findIndex(
                    (m) => m.id === submittingMilestone.id
                  ) ?? 0
                )}
                onSubmit={handleMilestoneSubmission}
                onCancel={() => setSubmittingMilestone(null)}
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Project Milestones</h3>
                  {submission.githubRepoUrl && (
                    <a
                      href={submission.githubRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Github className="h-4 w-4" />
                      View Repository
                    </a>
                  )}
                </div>

                {submission.milestones?.length > 0 ? (
                  <div className="space-y-4">
                    {submission.milestones.map(
                      (milestone, index: number) => (
                        <div
                          key={milestone.id}
                          className="rounded-lg border p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-white ${
                                  milestone.status === 'completed'
                                    ? 'bg-green-500'
                                    : milestone.status === 'in-review'
                                      ? 'bg-yellow-500'
                                      : milestone.status === 'in-progress'
                                        ? 'bg-orange-500'
                                        : milestone.status === 'pending'
                                          ? 'bg-gray-400'
                                        : 'bg-gray-400'
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {milestone.title}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {milestone.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={
                                    milestone.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : milestone.status === 'in-review'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : milestone.status === 'in-progress'
                                          ? 'bg-orange-100 text-orange-800'
                                          : milestone.status === 'pending'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {milestone.status?.replace('_', ' ')}
                                </Badge>
                                {(() => {
                                  const { canSubmit, reason } =
                                    canSubmitMilestone(milestone)
                                  return canSubmit ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setSubmittingMilestone(milestone)
                                      }
                                      disabled={!submission.githubRepoUrl}
                                      className="flex items-center gap-1"
                                    >
                                      <GitBranch className="h-3 w-3" />
                                      Submit
                                    </Button>
                                  ) : (
                                    <div className="text-right">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled
                                        className="flex items-center gap-1 opacity-60"
                                      >
                                        <Lock className="h-3 w-3" />
                                        Blocked
                                      </Button>
                                      {reason && (
                                        <p className="mt-1 max-w-32 text-xs text-gray-500">
                                          {reason}
                                        </p>
                                      )}
                                    </div>
                                  )
                                })()}
                              </div>
                              <p className="mt-1 text-sm font-medium">
                                ${milestone.amount?.toLocaleString() ?? 0}
                              </p>
                            </div>
                          </div>

                          {milestone.requirements && (
                            <div className="mt-3 rounded bg-gray-50 p-3">
                              <p className="mb-1 text-sm font-medium text-gray-700">
                                Requirements:
                              </p>
                              <div className="text-sm text-gray-600">
                                {typeof milestone.requirements === 'string'
                                  ? milestone.requirements
                                  : milestone.requirements.map((req: string, i: number) => (
                                    <div key={i}>• {req}</div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {milestone.dueDate && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              Due:{' '}
                              {new Date(milestone.dueDate).toLocaleDateString()}
                            </div>
                          )}

                          {milestone.status === 'in-review' &&
                            milestone.deliverables && (
                              <div className="mt-3 rounded border border-blue-200 bg-blue-50 p-3">
                                <p className="mb-1 text-sm font-medium text-blue-700">
                                  Submitted Deliverables:
                                </p>
                                <div className="text-sm text-blue-600">
                                  {(() => {
                                    const items = Array.isArray(milestone.deliverables)
                                      ? milestone.deliverables
                                      : [milestone.deliverables as unknown as Record<string, unknown>]

                                    const latest = items[items.length - 1] as {
                                      description?: string
                                      commits?: { shortSha: string; url: string }[]
                                    }

                                    if (!latest) return null

                                    return (
                                      <div>
                                        {latest.description && (
                                          <p className="mb-2">{latest.description}</p>
                                        )}
                                        {latest.commits && latest.commits.length > 0 && (
                                          <div>
                                            <p className="mb-1 font-medium">Commits included:</p>
                                            <div className="space-y-1">
                                              {latest.commits.map(
                                                (commit, i: number) => (
                                                  <div key={i} className="flex items-center gap-2">
                                                    <code className="rounded bg-blue-100 px-2 py-1 text-xs">
                                                      {commit.shortSha}
                                                    </code>
                                                    <a
                                                      href={commit.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-blue-600 hover:underline"
                                                    >
                                                      <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>
                            )}

                          {!submission.githubRepoUrl &&
                            canSubmitMilestone(milestone) && (
                              <div className="mt-3 rounded border border-yellow-200 bg-yellow-50 p-3">
                                <p className="text-sm text-yellow-700">
                                  <AlertTriangle className="mr-1 inline h-4 w-4" />
                                  GitHub repository required to submit
                                  milestones
                                </p>
                              </div>
                            )}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Target className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <p className="text-gray-600">No milestones defined yet</p>
                    <p className="text-sm text-gray-500">
                      Milestones will be set up after approval
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      {/* Help & Support */}
      <Card className="border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-3">
          <HelpCircle className="mt-1 h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-900">Need Help?</h3>
            <p className="mb-3 text-sm text-blue-700">
              If you have questions about your application or need assistance
              with the process, feel free to ask in the discussion thread or
              contact the committee directly.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
