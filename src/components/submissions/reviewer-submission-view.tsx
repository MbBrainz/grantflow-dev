'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DiscussionThread } from '@/components/discussion/discussion-thread'
import { ReviewerVoting } from '@/components/discussion/reviewer-voting'
import { MilestoneReviewDialog } from '@/components/review/milestone-review-dialog'
import {
  Vote,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  GitBranch,
  DollarSign,
  Target,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { CommitteeInfoCard } from '@/components/committee/committee-info-card'
import { MilestoneVotingPanel } from '@/components/milestone/milestone-voting-panel'
import type { Milestone, SubmissionWithMilestones, User } from '@/lib/db/schema'

interface ReviewerSubmissionViewProps {
  submission: SubmissionWithMilestones
  currentUser: User | null
  onPostMessage: (content: string, type?: string) => Promise<void>
  onVoteSubmitted: () => void
}

export function ReviewerSubmissionView({
  submission,
  currentUser,
  onPostMessage,
  onVoteSubmitted,
}: ReviewerSubmissionViewProps) {
  const [activeTab, setActiveTab] = useState<
    'review' | 'technical' | 'analytics'
  >('review')
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null
  )
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(
    new Set()
  )

  const toggleMilestone = (milestoneId: number) => {
    setExpandedMilestones(prev => {
      const newSet = new Set(prev)
      if (newSet.has(milestoneId)) {
        newSet.delete(milestoneId)
      } else {
        newSet.add(milestoneId)
      }
      return newSet
    })
  }

  // Calculate voting status from server data
  const reviews = submission.reviews ?? []
  const approveVotes = reviews.filter(r => r.vote === 'approve').length
  const rejectVotes = reviews.filter(
    r => r.vote === 'reject' || r.vote === 'abstain'
  ).length
  const userVote = reviews.find(r => r.reviewerId === currentUser?.id)
  const userHasVoted = !!userVote
  const needsMyVote =
    !userHasVoted && submission.userContext?.isCommitteeReviewer

  // Calculate milestone review status
  const milestones = submission.milestones ?? []
  const milestonesNeedingReview = milestones.filter(milestone => {
    // Only consider milestones in 'in-review' status
    // 'changes-requested' means committee has reviewed and grantee needs to make changes
    if (milestone.status !== 'in-review') {
      return false
    }

    // Check if current user has already reviewed this milestone
    const milestoneReviews =
      submission.reviews?.filter(r => r.milestoneId === milestone.id) ?? []
    const userHasReviewedMilestone = milestoneReviews.some(
      r => r.reviewerId === currentUser?.id
    )

    return !userHasReviewedMilestone
  })

  // Calculate quorum requirement from committee settings
  const committee = submission.reviewerGroup
  const committeeSettings = committee?.settings as {
    votingThreshold?: number
    requiredApprovalPercentage?: number
  } | null
  const votingThreshold = committeeSettings?.votingThreshold ?? 0.5
  const activeMemberCount = 5 // TODO: Get actual active member count from committee
  const votesNeeded = Math.ceil(activeMemberCount * votingThreshold)

  return (
    <div className="space-y-6">
      {/* Committee Context */}
      {submission.reviewerGroup && (
        <CommitteeInfoCard
          committee={submission.reviewerGroup}
          userRole={null}
          isUserMember={submission.userContext?.isCommitteeReviewer ?? false}
          className="border-l-4 border-l-blue-500"
        />
      )}

      {/* Reviewer Action Hero - SUBMISSION REVIEW */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 p-6">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-full bg-blue-100 p-3 text-blue-600">
            <Vote className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-2xl font-bold">
                Submission Review {needsMyVote ? '- Vote Required' : ''}
              </h2>
              {needsMyVote && (
                <Badge className="animate-pulse bg-red-100 text-red-800">
                  Action Required
                </Badge>
              )}
              {userHasVoted && userVote && (
                <Badge
                  className={`flex items-center gap-1.5 ${
                    userVote.vote === 'approve'
                      ? 'border-green-300 bg-green-100 text-green-800'
                      : userVote.vote === 'reject'
                        ? 'border-red-300 bg-red-100 text-red-800'
                        : 'border-yellow-300 bg-yellow-100 text-yellow-800'
                  }`}
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
                  You voted:{' '}
                  {userVote.vote!.charAt(0).toUpperCase() +
                    userVote.vote?.slice(1)}
                </Badge>
              )}
            </div>
            <p className="text-lg text-gray-600">
              {needsMyVote
                ? 'Your vote is needed to proceed with this submission review.'
                : userHasVoted
                  ? 'Thank you for submitting your review. Continue collaborating with other reviewers below.'
                  : 'Review the submission details and collaborate with other reviewers.'}
            </p>
          </div>
        </div>

        {/* Review Status Grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">Approve Votes</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{approveVotes}</p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium">Reject Votes</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{rejectVotes}</p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="font-medium">Review Time</span>
            </div>
            <p className="text-sm text-gray-600">
              {Math.floor(
                (Date.now() - new Date(submission.appliedAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{' '}
              days
            </p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Funding</span>
            </div>
            <p className="text-sm font-medium">
              ${submission.totalAmount?.toLocaleString() ?? 'TBD'}
            </p>
          </div>
        </div>

        {/* Voting Interface */}
        {needsMyVote && (
          <div className="rounded-lg border border-blue-200 bg-white p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Vote className="h-5 w-5" />
              Cast Your Vote
            </h3>
            <ReviewerVoting
              submissionId={submission.id}
              currentUser={currentUser}
              existingVotes={reviews.map(r => ({
                id: r.id,
                reviewerId: r.reviewerId,
                vote: r.vote ?? '',
                feedback: r.feedback,
                createdAt: r.createdAt.toISOString(),
                reviewer: {
                  id: r.reviewer.id,
                  name: r.reviewer.name,
                  role: r.reviewer.primaryRole ?? 'reviewer',
                },
              }))}
              onVoteSubmitted={() => onVoteSubmitted()}
              isOpen={true}
            />
          </div>
        )}
      </Card>

      {/* Milestone Reviews Needed */}
      {milestonesNeedingReview.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50/50 p-6">
          <div className="mb-4 flex items-start gap-4">
            <div className="rounded-full bg-orange-100 p-3 text-orange-600">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h2 className="text-2xl font-bold">Milestone Reviews Needed</h2>
                <Badge className="animate-pulse bg-orange-100 text-orange-800">
                  {milestonesNeedingReview.length} Pending
                </Badge>
              </div>
              <p className="text-lg text-gray-600">
                The following milestones are awaiting your review.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {milestonesNeedingReview.map(milestone => (
              <div
                key={milestone.id}
                className="rounded-lg border border-orange-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        Milestone{' '}
                        {milestones.findIndex(m => m.id === milestone.id) + 1}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          milestone.status === 'in-review'
                            ? 'border-purple-300 bg-purple-50 text-purple-700'
                            : 'border-blue-300 bg-blue-50 text-blue-700'
                        }
                      >
                        {milestone.status.replace('-', ' ')}
                      </Badge>
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
                          <DollarSign className="h-4 w-4" />$
                          {milestone.amount.toLocaleString()}
                        </div>
                      )}
                      {milestone.submittedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Submitted{' '}
                          {new Date(milestone.submittedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="ml-4"
                    onClick={() => {
                      setSelectedMilestone(milestone)
                      setReviewDialogOpen(true)
                    }}
                  >
                    Review Milestone
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabbed Content */}
      <Card className="p-6">
        <div className="mb-6 flex items-center gap-1 border-b">
          <Button
            variant={activeTab === 'review' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('review')}
            className="rounded-b-none"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Review & Discussion
          </Button>
          <Button
            variant={activeTab === 'technical' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('technical')}
            className="rounded-b-none"
          >
            <GitBranch className="mr-2 h-4 w-4" />
            Technical Review
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('analytics')}
            className="rounded-b-none"
          >
            <Target className="mr-2 h-4 w-4" />
            Risk & Analytics
          </Button>
        </div>

        {/* Review Tab */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            {/* Discussion */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Discussion</h3>
              <DiscussionThread
                discussion={submission.discussions?.[0]}
                submissionId={submission.id}
                currentUser={currentUser}
                onPostMessage={onPostMessage}
                title={submission.title}
                isPublic={true}
              />
            </div>
          </div>
        )}

        {/* Technical Review Tab */}
        {activeTab === 'technical' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Repository Analysis</h3>
                {submission.githubRepoUrl ? (
                  <div className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      <a
                        href={submission.githubRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        View Repository
                      </a>
                    </div>
                    <p className="text-sm text-gray-600">
                      AI-powered code analysis coming soon
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No repository linked</p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Milestones</h3>
                <div className="space-y-2">
                  {submission.milestones?.map(
                    (
                      milestone: Pick<
                        Milestone,
                        'id' | 'status' | 'title' | 'amount'
                      >,
                      index: number
                    ) => (
                      <div key={milestone.id} className="rounded border p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            Milestone {index + 1}
                          </span>
                          <Badge variant="outline">{milestone.status}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {milestone.title}
                        </p>
                        <p className="text-sm font-medium">
                          ${milestone.amount?.toLocaleString() ?? 0}
                        </p>
                      </div>
                    )
                  ) ?? (
                    <p className="text-gray-500 italic">
                      No milestones defined
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-4 text-lg font-semibold">Risk Assessment</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Funding amount within range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">
                      New applicant - limited history
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">GitHub repository provided</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold">
                  Similar Applications
                </h3>
                <div className="space-y-2">
                  <div className="rounded border p-3">
                    <p className="text-sm font-medium">
                      SDK Development Project
                    </p>
                    <p className="text-xs text-gray-600">
                      Approved • $85K • 6 months ago
                    </p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm font-medium">Developer Tools Suite</p>
                    <p className="text-xs text-gray-600">
                      Approved • $120K • 1 year ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* All Milestones - Detailed View with Anchors */}
      {milestones.length > 0 && (
        <Card className="p-6">
          <div className="mb-6 flex items-start gap-4">
            <div className="rounded-full bg-gray-100 p-3 text-gray-600">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">All Milestones</h2>
              <p className="text-gray-600">
                Detailed view of all milestones for this submission
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {milestones.map((milestone, index) => {
              // Get reviews for this specific milestone
              const milestoneReviews =
                submission.reviews?.filter(
                  r => r.milestoneId === milestone.id
                ) ?? []
              const userMilestoneReview = milestoneReviews.find(
                r => r.reviewerId === currentUser?.id
              )
              const milestoneApproves = milestoneReviews.filter(
                r => r.vote === 'approve'
              ).length
              const milestoneRejects = milestoneReviews.filter(
                r => r.vote === 'reject'
              ).length
              const isExpanded = expandedMilestones.has(milestone.id)

              return (
                <div
                  key={milestone.id}
                  id={`milestone-${milestone.id}`}
                  className="scroll-mt-6 rounded-lg border-2 border-gray-200 bg-white transition-all"
                >
                  {/* Collapsible Header */}
                  <button
                    onClick={() => toggleMilestone(milestone.id)}
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
                          MILESTONE {index + 1}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {milestone.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            milestone.status === 'in-review'
                              ? 'border-purple-300 bg-purple-50 text-purple-700'
                              : milestone.status === 'completed'
                                ? 'border-green-300 bg-green-50 text-green-700'
                                : milestone.status === 'changes-requested'
                                  ? 'border-orange-300 bg-orange-50 text-orange-700'
                                  : 'border-blue-300 bg-blue-50 text-blue-700'
                          }
                        >
                          {milestone.status.replace('-', ' ')}
                        </Badge>
                        {userMilestoneReview && (
                          <Badge
                            className={`flex items-center gap-1.5 ${
                              userMilestoneReview.vote === 'approve'
                                ? 'border-green-300 bg-green-100 text-green-800'
                                : userMilestoneReview.vote === 'reject'
                                  ? 'border-red-300 bg-red-100 text-red-800'
                                  : 'border-yellow-300 bg-yellow-100 text-yellow-800'
                            }`}
                            variant="outline"
                          >
                            {userMilestoneReview.vote === 'approve' && (
                              <CheckCircle className="h-3.5 w-3.5" />
                            )}
                            {userMilestoneReview.vote === 'reject' && (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            {userMilestoneReview.vote === 'abstain' && (
                              <Clock className="h-3.5 w-3.5" />
                            )}
                            You voted:{' '}
                            {userMilestoneReview.vote!.charAt(0).toUpperCase() +
                              userMilestoneReview.vote?.slice(1)}
                          </Badge>
                        )}
                        {/* Vote Count Badge */}
                        <div
                          className="flex items-center gap-1 rounded-full border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-medium"
                          title={`${milestoneApproves} approvals / ${milestoneRejects} rejections / ${votesNeeded} needed for quorum`}
                        >
                          <span className="text-green-600">
                            {milestoneApproves}
                          </span>
                          <span className="text-gray-400">/</span>
                          <span className="text-red-600">
                            {milestoneRejects}
                          </span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-900">{votesNeeded}</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-6">
                      {milestone.description && (
                        <p className="mb-4 whitespace-pre-wrap text-gray-700">
                          {milestone.description}
                        </p>
                      )}

                      {/* Milestone Details Grid */}
                      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-lg border bg-white p-3">
                          <div className="mb-1 flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-500">
                              Amount
                            </span>
                          </div>
                          <p className="text-lg font-bold">
                            ${milestone.amount?.toLocaleString() ?? 0}
                          </p>
                        </div>

                        <div className="rounded-lg border bg-white p-3">
                          <div className="mb-1 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-500">
                              Approvals
                            </span>
                          </div>
                          <p className="text-lg font-bold text-green-600">
                            {milestoneApproves}
                          </p>
                        </div>

                        <div className="rounded-lg border bg-white p-3">
                          <div className="mb-1 flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-gray-500">
                              Rejections
                            </span>
                          </div>
                          <p className="text-lg font-bold text-red-600">
                            {milestoneRejects}
                          </p>
                        </div>

                        <div className="rounded-lg border bg-white p-3">
                          <div className="mb-1 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-500">
                              Submitted
                            </span>
                          </div>
                          <p className="text-sm">
                            {milestone.submittedAt
                              ? new Date(
                                  milestone.submittedAt
                                ).toLocaleDateString()
                              : 'Not yet'}
                          </p>
                        </div>
                      </div>

                      {/* GitHub Info */}
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

                      {/* Review Action */}
                      {milestone.status === 'in-review' &&
                        !userMilestoneReview &&
                        submission.userContext?.isCommitteeReviewer && (
                          <div className="flex justify-end">
                            <Button
                              variant="default"
                              onClick={() => {
                                setSelectedMilestone(milestone)
                                setReviewDialogOpen(true)
                              }}
                            >
                              Review This Milestone
                            </Button>
                          </div>
                        )}

                      {/* Already Reviewed Message */}
                      {userMilestoneReview && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <p className="flex items-center gap-2 text-sm text-blue-800">
                            <CheckCircle className="h-4 w-4" />
                            You have already reviewed this milestone
                            {userMilestoneReview.feedback && (
                              <span className="ml-2">
                                - Click to view your feedback
                              </span>
                            )}
                          </p>
                          {userMilestoneReview.feedback && (
                            <div className="mt-2 rounded bg-white p-3 text-sm text-gray-700">
                              <span className="font-medium">
                                Your feedback:{' '}
                              </span>
                              {userMilestoneReview.feedback}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Multisig Payment Approval - Only for SEPARATED workflow */}
                      {submission.reviewerGroup?.settings?.multisig &&
                        submission.reviewerGroup.settings.multisig.approvalWorkflow === 'separated' &&
                        milestone.status === 'completed' &&
                        submission.userContext?.isCommitteeReviewer && (
                          <div className="mt-4">
                            <MilestoneVotingPanel
                            multisigConfig={submission.reviewerGroup.settings.multisig}
                            milestoneId={milestone.id}
                              isCommitteeMember={
                                submission.userContext?.isCommitteeReviewer ??
                                false
                              }
                              userWalletAddress={
                                currentUser?.walletAddress ?? '0xForALackOfBetterPlaceholder'
                              }
                            />
                          </div>
                        )}

                      {/* Multisig Payment Approval - MERGED workflow (review + payment together) */}
                      {submission.reviewerGroup?.settings?.multisig &&
                        submission.reviewerGroup.settings.multisig.approvalWorkflow === 'merged' &&
                        milestone.status === 'in-review' &&
                        !userMilestoneReview &&
                        submission.userContext?.isCommitteeReviewer && (
                          <div className="mt-4">
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                              <p className="mb-2 text-sm font-medium text-blue-800">
                                🔗 Merged Approval Workflow
                              </p>
                              <p className="text-sm text-gray-700">
                                This committee uses a merged workflow. When you
                                click "Review This Milestone" above, you'll
                                approve the milestone AND sign the blockchain
                                transaction in one step.
                              </p>
                            </div>
                          </div>
                        )}

                      {/* Show voting status for MERGED workflow after user has voted */}
                      {submission.reviewerGroup?.settings?.multisig &&
                        submission.reviewerGroup.settings.multisig.approvalWorkflow === 'merged' &&
                        (milestone.status === 'in-review' ||
                          milestone.status === 'completed') &&
                        userMilestoneReview &&
                        submission.userContext?.isCommitteeReviewer && (
                          <div className="mt-4">
                            <MilestoneVotingPanel
                              multisigConfig={submission.reviewerGroup.settings.multisig}
                              milestoneId={milestone.id}
                              isCommitteeMember={
                                submission.userContext?.isCommitteeReviewer ??
                                false
                              }
                              userWalletAddress={
                                currentUser?.walletAddress ?? '0xForALackOfBetterPlaceholder'
                              }
                            />
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Milestone Review Dialog */}
      {selectedMilestone && (
        <MilestoneReviewDialog
          milestone={selectedMilestone}
          submissionId={submission.id}
          milestoneNumber={
            milestones.findIndex(m => m.id === selectedMilestone.id) + 1
          }
          committeeId={submission.reviewerGroup?.id ?? 0}
          committeeSettings={submission.reviewerGroup?.settings}
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          onReviewSubmitted={() => {
            setReviewDialogOpen(false)
            onVoteSubmitted() // Refresh the page
            // Scroll to the milestone section after a brief delay for page refresh
            setTimeout(() => {
              if (selectedMilestone) {
                document
                  .getElementById(`milestone-${selectedMilestone.id}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }, 100)
            setSelectedMilestone(null)
          }}
        />
      )}
    </div>
  )
}
