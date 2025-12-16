'use client'

import type { SubmissionWithMilestones } from '@/lib/db/schema'

const MS_PER_DAY = 1000 * 60 * 60 * 24

export interface SubmissionMetrics {
  approveVotes: number
  rejectVotes: number
  abstainVotes: number
  totalVotes: number
  completedMilestones: number
  totalMilestones: number
  milestoneProgressPercent: number
  daysSinceApplied: number | null
  totalMessages: number
  publicMessages: number
}

export function calculateSubmissionMetrics(
  submission: SubmissionWithMilestones
): SubmissionMetrics {
  const reviews = submission.reviews ?? []
  const approveVotes = reviews.filter(r => r.vote === 'approve').length
  const rejectVotes = reviews.filter(r => r.vote === 'reject').length
  const abstainVotes = reviews.filter(r => r.vote === 'abstain').length
  const totalVotes = reviews.length

  const milestones = submission.milestones ?? []
  const completedMilestones = milestones.filter(
    m => m.status === 'completed'
  ).length
  const totalMilestones = milestones.length
  const milestoneProgressPercent =
    totalMilestones === 0
      ? 0
      : Math.round((completedMilestones / totalMilestones) * 100)

  const appliedAt = submission.appliedAt ? new Date(submission.appliedAt) : null
  const daysSinceApplied =
    appliedAt == null
      ? null
      : Math.max(0, Math.floor((Date.now() - appliedAt.getTime()) / MS_PER_DAY))

  const discussions = submission.discussions ?? []
  const totalMessages = discussions.reduce(
    (count, discussion) => count + (discussion.messages?.length ?? 0),
    0
  )
  const publicMessages =
    discussions.find(discussion => discussion.isPublic)?.messages?.length ?? 0

  return {
    approveVotes,
    rejectVotes,
    abstainVotes,
    totalVotes,
    completedMilestones,
    totalMilestones,
    milestoneProgressPercent,
    daysSinceApplied,
    totalMessages,
    publicMessages,
  }
}
