'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DiscussionThread } from '@/components/discussion/discussion-thread'
import { ReviewerVoting } from '@/components/discussion/reviewer-voting'
import {
  Vote,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  GitBranch,
  DollarSign,
  Target,
} from 'lucide-react'
import { CommitteeInfoCard } from '@/components/committee/committee-info-card'
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

  // Calculate voting status from server data
  const reviews = submission.reviews ?? []
  const approveVotes = reviews.filter(r => r.vote === 'approve').length
  const rejectVotes = reviews.filter(
    r => r.vote === 'reject' || r.vote === 'abstain'
  ).length
  const userHasVoted = reviews.some(r => r.reviewerId === currentUser?.id)
  const needsMyVote =
    !userHasVoted && submission.userContext?.isCommitteeReviewer

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

      {/* Reviewer Action Hero */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 p-6">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-full bg-blue-100 p-3 text-blue-600">
            <Vote className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-2xl font-bold">
                {needsMyVote ? 'Vote Required' : 'Review in Progress'}
              </h2>
              {needsMyVote && (
                <Badge className="animate-pulse bg-red-100 text-red-800">
                  Action Required
                </Badge>
              )}
            </div>
            <p className="text-lg text-gray-600">
              {needsMyVote
                ? 'Your vote is needed to proceed with this submission review.'
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
    </div>
  )
}
