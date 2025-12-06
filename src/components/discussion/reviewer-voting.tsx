'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { User } from '@/lib/db/schema'
import {
  submitReviewSchema,
  type SubmitReviewInput,
} from '@/lib/db/schema/actions'

interface Vote {
  id: number
  reviewerId: number
  vote: string
  feedback: string | null
  createdAt: string
  reviewer: {
    id: number
    name: string | null
    role: string
  }
}

interface ReviewerVotingProps {
  submissionId: number
  milestoneId?: number
  currentUser: User | null
  existingVotes: Vote[]
  onVoteSubmitted: () => void
  isOpen?: boolean
}

const voteOptions = [
  {
    value: 'approve',
    label: 'Approve',
    icon: CheckCircle,
    color: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100',
    description:
      'This submission meets the requirements and should be approved',
  },
  {
    value: 'abstain',
    label: 'Abstain',
    icon: AlertCircle,
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100',
    description: 'Abstain from voting on this submission',
  },
  {
    value: 'reject',
    label: 'Reject',
    icon: XCircle,
    color: 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100',
    description: 'This submission does not meet the requirements',
  },
]

export function ReviewerVoting({
  submissionId,
  milestoneId,
  currentUser,
  existingVotes,
  onVoteSubmitted,
  isOpen = true,
}: ReviewerVotingProps) {
  const [isPending, startTransition] = useTransition()
  const [showVotingInterface, setShowVotingInterface] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SubmitReviewInput>({
    resolver: zodResolver(submitReviewSchema),
    defaultValues: {
      submissionId,
      milestoneId,
      vote: undefined,
      feedback: '',
    },
  })

  const selectedVote = watch('vote')

  // Check if current user is a reviewer
  const isReviewer = currentUser?.primaryRole === 'committee'

  // Check if current user has already voted
  const userVote = existingVotes.find(
    vote => vote.reviewerId === currentUser?.id
  )

  // Calculate vote summary
  const voteSummary = existingVotes.reduce(
    (acc, vote) => {
      acc[vote.vote] = (acc[vote.vote] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const onSubmit = (data: SubmitReviewInput) => {
    if (!currentUser) return

    startTransition(async () => {
      try {
        console.log('[ReviewerVoting]: Submitting vote with data:', {
          ...data,
          currentUser: currentUser?.id,
        })

        const { submitReview } =
          await import('@/app/(dashboard)/dashboard/submissions/actions')

        // Call the action with typed data object (no FormData!)
        const result = await submitReview(data)

        console.log('[ReviewerVoting]: Action result:', result)

        if (result.error) {
          throw new Error(result.error)
        }

        // Reset form
        reset()
        setShowVotingInterface(false)
        onVoteSubmitted()
      } catch (error) {
        console.error('[ReviewerVoting]: Error submitting vote', error)
      }
    })
  }

  if (!isOpen) return null

  return (
    <Card className="border-2 border-blue-100 bg-blue-50/30 p-6">
      <div className="space-y-4">
        {/* Vote Summary */}
        {existingVotes.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Reviewer Votes ({existingVotes.length})
            </h4>

            <div className="flex gap-4 text-sm">
              {Object.entries(voteSummary).map(([vote, count]) => {
                const option = voteOptions.find(opt => opt.value === vote)
                if (!option) return null
                const Icon = option.icon

                return (
                  <div key={vote} className="flex items-center gap-1">
                    <Icon className="h-4 w-4" />
                    <span className="capitalize">
                      {vote.replace('_', ' ')}: {count}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Show individual votes */}
            <div className="space-y-2">
              {existingVotes.map(vote => (
                <div
                  key={vote.id}
                  className="rounded-lg border bg-white p-3 dark:bg-gray-800"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium">{vote.reviewer.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                        vote.vote === 'approve'
                          ? 'bg-green-100 text-green-800'
                          : vote.vote === 'reject'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {vote.vote.replace('_', ' ')}
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                      {new Date(vote.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {vote.feedback && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {vote.feedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voting Interface */}
        {isReviewer && !userVote && (
          <div className="space-y-4">
            {!showVotingInterface ? (
              <Button
                onClick={() => {
                  setIsLoading(true)
                  // Add a small delay for smooth transition
                  setTimeout(() => {
                    setShowVotingInterface(true)
                    setIsLoading(false)
                  }, 300)
                }}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    Cast Your Vote
                  </>
                )}
              </Button>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <div className="mb-3 block text-sm font-medium">
                    Select your review decision:
                  </div>
                  <div id="vote-options" className="grid gap-2">
                    {voteOptions.map(option => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setValue(
                              'vote',
                              option.value as 'approve' | 'reject' | 'abstain'
                            )
                          }
                          className={`rounded-lg border-2 p-3 text-left transition-colors ${
                            selectedVote === option.value
                              ? option.color
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-600">
                                {option.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {errors.vote && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.vote.message}
                    </p>
                  )}
                </div>

                {selectedVote && (
                  <div>
                    <label htmlFor="feedback" className="text-sm font-medium">
                      Comments{' '}
                      {selectedVote === 'approve'
                        ? '(optional)'
                        : '(recommended)'}
                    </label>
                    <textarea
                      id="feedback"
                      placeholder={
                        selectedVote === 'approve'
                          ? 'Any additional comments on this submission...'
                          : selectedVote === 'abstain'
                            ? 'Reason for abstaining (optional)...'
                            : 'Why should this submission be rejected?'
                      }
                      {...register('feedback')}
                      className="mt-2 min-h-[100px] w-full resize-y rounded-lg border border-gray-300 p-3"
                    />
                    {errors.feedback && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.feedback.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowVotingInterface(false)
                      reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedVote || isPending}
                    className="flex items-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* User already voted */}
        {isReviewer && userVote && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              ✓ You have already submitted your review:{' '}
              <span className="font-medium capitalize">
                {userVote.vote.replace('_', ' ')}
              </span>
            </p>
          </div>
        )}

        {/* Non-reviewer message */}
        {!isReviewer && currentUser && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              Only reviewers can vote on submissions. You can participate in the
              discussion above.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
