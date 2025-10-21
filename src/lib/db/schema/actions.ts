/**
 * Action-specific validation schemas
 *
 * These schemas are for server actions that don't map directly to a single DB table insert.
 * They may combine fields from multiple tables or add validation-only fields.
 */

import { z } from 'zod'

// ============================================================================
// Discussion/Message Actions
// ============================================================================

// For postMessageToSubmission - adds submissionId for routing
export const postMessageToSubmissionSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message content is required')
    .max(2000, 'Message must be less than 2000 characters'),
  submissionId: z.number().min(1, 'Invalid submission ID'),
  messageType: z.enum(['comment', 'status_change', 'vote']).default('comment'),
  metadata: z.string().optional(),
})

// For postMessageToMilestone - adds milestoneId for routing
export const postMessageToMilestoneSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message content is required')
    .max(2000, 'Message must be less than 2000 characters'),
  milestoneId: z.number().min(1, 'Invalid milestone ID'),
  messageType: z.enum(['comment', 'status_change', 'vote']).default('comment'),
  metadata: z.string().optional(),
})

// ============================================================================
// Milestone Actions
// ============================================================================

// For completeMilestone - combines payout data with IDs
export const completeMilestoneSchema = z.object({
  milestoneId: z.number().min(1, 'Invalid milestone ID'),
  committeeId: z.number().min(1, 'Invalid committee ID'),
  transactionHash: z
    .string()
    .min(1, 'Transaction hash is required')
    .max(128, 'Transaction hash too long'),
  blockExplorerUrl: z.string().url('Invalid URL').max(500, 'URL too long'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  walletFrom: z.string().optional(),
  walletTo: z.string().optional(),
})

// For submitMilestone - transforms array inputs
export const submitMilestoneSchema = z.object({
  milestoneId: z.number().min(1, 'Invalid milestone ID'),
  selectedCommits: z
    .array(z.string())
    .min(1, 'At least one commit is required'),
  deliverables: z
    .string()
    .trim()
    .min(10, 'Deliverables description must be at least 10 characters'),
  githubCommitHashes: z
    .array(z.string())
    .min(1, 'At least one commit hash is required'),
})

// ============================================================================
// Type exports
// ============================================================================

// For submitReview - client sends only these fields, server adds groupId and reviewerId
export const submitReviewSchema = z.object({
  submissionId: z.number().min(1, 'Invalid submission ID'),
  milestoneId: z.number().optional(),
  vote: z.enum(['approve', 'reject', 'abstain']),
  feedback: z.string().optional(),
})

export type PostMessageToSubmissionInput = z.infer<
  typeof postMessageToSubmissionSchema
>
export type PostMessageToMilestoneInput = z.infer<
  typeof postMessageToMilestoneSchema
>
export type CompleteMilestoneInput = z.infer<typeof completeMilestoneSchema>
export type SubmitMilestoneInput = z.infer<typeof submitMilestoneSchema>
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>
