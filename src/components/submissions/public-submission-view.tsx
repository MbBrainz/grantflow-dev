'use client'

import {
  CheckCircle,
  Clock,
  GitBranch,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import type { SubmissionWithMilestones } from '@/lib/db/schema'

interface PublicSubmissionViewProps {
  submission: SubmissionWithMilestones
}

export function PublicSubmissionView({
  submission,
}: PublicSubmissionViewProps) {
  // Calculate public metrics from server data
  const reviews = submission.reviews ?? []
  const approveVotes = reviews.filter(r => r.vote === 'approve').length
  const totalVotes = reviews.length
  // Only show messages from public discussions
  const publicDiscussion = submission.discussions?.find(d => d.isPublic)
  const publicMessages = publicDiscussion?.messages ?? []

  return (
    <div className="space-y-6">
      {/* Voting Results */}
      {reviews.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-xl font-semibold">Committee Review Results</h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 font-medium">Voting Summary</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Approve</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">
                    {approveVotes}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Concerns/Reject</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">
                    {totalVotes - approveVotes}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-medium">Review Timeline</h4>
              <div className="space-y-2">
                {reviews.slice(0, 3).map((review, index: number) => (
                  <div
                    key={review.id}
                    className="flex items-center gap-3 rounded border p-2"
                  >
                    <div
                      className={`h-3 w-3 rounded-full ${
                        review.vote === 'approve'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Reviewer {index + 1} • {review.vote}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {reviews.length > 3 && (
                  <p className="pt-2 text-center text-xs text-gray-500">
                    +{reviews.length - 3} more reviews
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Milestone Progress */}
      {submission.milestones?.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="text-xl font-semibold">Milestone Progress</h3>
          </div>

          <div className="space-y-4">
            {submission.milestones.map((milestone, index: number) => (
              <div key={milestone.id} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-white ${
                        milestone.status === 'completed'
                          ? 'bg-green-500'
                          : milestone.status === 'changes-requested'
                            ? 'bg-blue-500'
                            : 'bg-gray-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{milestone.title}</h4>
                      <p className="text-sm text-gray-600">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        milestone.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : milestone.status === 'changes-requested'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {milestone.status?.replace('_', ' ')}
                    </Badge>
                    <p className="mt-1 text-sm font-medium">
                      ${milestone.amount?.toLocaleString() ?? 0}
                    </p>
                  </div>
                </div>

                {milestone.status === 'completed' &&
                  milestone.githubRepoUrl && (
                    <div className="mt-2 flex items-center gap-2 rounded bg-green-50 p-2">
                      <GitBranch className="h-4 w-4 text-green-600" />
                      <a
                        href={milestone.githubRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-700 hover:underline"
                      >
                        View Deliverables
                      </a>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Public Discussion */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="text-xl font-semibold">Public Discussion</h3>
        </div>

        {publicMessages.length > 0 ? (
          <div className="space-y-3">
            {publicMessages.slice(0, 5).map(message => (
              <div key={message.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-xs font-medium text-blue-600">
                      {message.author?.name?.[0] ?? 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {message.author?.name ?? 'Anonymous'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {message.author?.primaryRole ?? 'user'}
                  </Badge>
                  <span className="ml-auto text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{message.content}</p>
              </div>
            ))}
            {publicMessages.length > 5 && (
              <div className="py-2 text-center">
                <Button variant="outline" size="sm">
                  View All Discussion ({publicMessages.length} messages)
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600">No public discussion yet</p>
            <p className="text-sm text-gray-500">
              Public comments will appear here
            </p>
          </div>
        )}
      </Card>

      {/* Transparency Footer */}
      <Card className="border-gray-200 bg-gray-50 p-6">
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-1 h-5 w-5 text-gray-600" />
          <div>
            <h3 className="font-semibold text-gray-900">
              Transparency Commitment
            </h3>
            <p className="mb-3 text-sm text-gray-700">
              This submission is part of our public transparency initiative. All
              committee decisions, voting rationale, and project progress are
              openly shared with the community to build trust and
              accountability.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Learn About Our Process
              </Button>
              <Button variant="outline" size="sm">
                View Committee Info
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
