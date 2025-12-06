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
  Target,
} from 'lucide-react'
// import { CommitteeInfoCard } from '@/components/committee/committee-info-card'
import { MilestoneVotingPanel } from '@/components/milestone/milestone-voting-panel'
import { MilestoneCard } from '@/components/milestone/milestone-card'
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
  // Get actual active member count from committee
  const activeMemberCount =
    committee && 'members' in committee && Array.isArray(committee.members)
      ? committee.members.length
      : 0

  return (
    <div className="space-y-6">
      {/* Reviewer Action Hero - SUBMISSION REVIEW */}
      {submission.status !== 'approved' && (
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
      )}

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
            {milestonesNeedingReview.map(milestone => {
              const milestoneNumber =
                milestones.findIndex(m => m.id === milestone.id) + 1
              return (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  milestoneNumber={milestoneNumber}
                  variant="compact"
                  showReviewButton={true}
                  onReviewClick={() => {
                    setSelectedMilestone(milestone)
                    setReviewDialogOpen(true)
                  }}
                />
              )
            })}
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
                  className="scroll-mt-6"
                >
                  <MilestoneCard
                    milestone={milestone}
                    milestoneNumber={index + 1}
                    variant="list"
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleMilestone(milestone.id)}
                    userVote={
                      userMilestoneReview
                        ? {
                            vote: userMilestoneReview.vote!,
                            feedback: userMilestoneReview.feedback,
                          }
                        : null
                    }
                    approvalCount={milestoneApproves}
                    rejectionCount={milestoneRejects}
                    totalCommitteeMembers={activeMemberCount}
                    showReviewButton={
                      milestone.status === 'in-review' &&
                      !userMilestoneReview &&
                      !!submission.userContext?.isCommitteeReviewer
                    }
                    onReviewClick={() => {
                      setSelectedMilestone(milestone)
                      setReviewDialogOpen(true)
                    }}
                  >
                    {isExpanded && (
                      <>
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
                        {submission.reviewerGroup?.settings?.multisig
                          ?.approvalWorkflow === 'separated' &&
                          submission.reviewerGroup.settings.multisig
                            .approvalWorkflow === 'separated' &&
                          milestone.status === 'completed' &&
                          submission.userContext?.isCommitteeReviewer && (
                            <div className="mt-4">
                              <MilestoneVotingPanel
                                multisigConfig={
                                  submission.reviewerGroup.settings.multisig
                                }
                                milestoneId={milestone.id}
                                submissionId={submission.id}
                                milestoneAmount={milestone.amount ?? 0}
                                isCommitteeMember={
                                  submission.userContext?.isCommitteeReviewer ??
                                  false
                                }
                                userWalletAddress={
                                  currentUser?.walletAddress ??
                                  '0xForALackOfBetterPlaceholder'
                                }
                              />
                            </div>
                          )}

                        {/* Multisig Payment Approval - MERGED workflow (review + payment together) */}
                        {submission.reviewerGroup?.settings?.multisig
                          ?.approvalWorkflow === 'merged' &&
                          milestone.status === 'in-review' &&
                          !userMilestoneReview &&
                          submission.userContext?.isCommitteeReviewer && (
                            <div className="mt-4">
                              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                <p className="mb-2 text-sm font-medium text-blue-800">
                                  🔗 Merged Approval Workflow
                                </p>
                                <p className="text-sm text-gray-700">
                                  This committee uses a merged workflow. When
                                  you click "Review This Milestone" above,
                                  you'll approve the milestone AND sign the
                                  blockchain transaction in one step.
                                </p>
                              </div>
                            </div>
                          )}

                        {/* Show voting status for MERGED workflow after user has voted */}
                        {submission.reviewerGroup?.settings?.multisig
                          ?.approvalWorkflow === 'merged' &&
                          (milestone.status === 'in-review' ||
                            milestone.status === 'completed') &&
                          userMilestoneReview &&
                          submission.userContext?.isCommitteeReviewer && (
                            <div className="mt-4">
                              <MilestoneVotingPanel
                                multisigConfig={
                                  submission.reviewerGroup.settings.multisig
                                }
                                milestoneId={milestone.id}
                                submissionId={submission.id}
                                milestoneAmount={milestone.amount ?? 0}
                                isCommitteeMember={
                                  submission.userContext?.isCommitteeReviewer ??
                                  false
                                }
                                userWalletAddress={
                                  currentUser?.walletAddress ??
                                  '0xForALackOfBetterPlaceholder'
                                }
                              />
                            </div>
                          )}
                      </>
                    )}
                  </MilestoneCard>
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
