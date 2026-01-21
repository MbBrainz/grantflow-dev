'use server'

/**
 * Server actions for Polkadot multisig milestone approvals
 *
 * These actions coordinate between the blockchain (Polkadot API) and database,
 * implementing the milestone approval workflow with multisig wallets.
 */

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { getMilestoneById, isUserReviewer } from '@/lib/db/queries'
import { groups, submissions } from '@/lib/db/schema'
import {
  completeMilestoneApproval,
  createMilestoneApproval,
  createMultisigSignature,
  getActiveMilestoneApproval,
  getApprovalVoteCount,
  getMilestoneApprovalWithVotes,
  hasUserVoted,
} from '@/lib/db/writes/milestone-approvals'
import { createNotification } from '@/lib/db/writes/notifications'
import { createPayout } from '@/lib/db/writes/payouts'

// ============================================================================
// Validation Schemas
// ============================================================================

const initiateApprovalSchema = z.object({
  milestoneId: z.number().int().positive(),
  approvalWorkflow: z.enum(['merged', 'separated']),
  initiatorWalletAddress: z.string().min(1, 'Wallet address is required'),
  txHash: z.string().min(1, 'Transaction hash is required'),
  callHash: z.string().min(1, 'Call hash is required'),
  callDataHex: z.string().min(1, 'Call data is required'),
  timepoint: z.object({
    height: z.number().int(),
    index: z.number().int(),
  }),
  reviewId: z.number().int().positive().optional(), // Link to review for merged workflow
  // Child bounty tracking (required for on-chain indexing)
  parentBountyId: z.number().int().positive(),
  predictedChildBountyId: z.number().int().nonnegative(), // Allow 0 for first child bounty
  // Price conversion info (for transparency)
  priceUsd: z.string().optional(), // Price per token in USD
  priceDate: z.string().optional(), // ISO date string when price was fetched
  priceSource: z.string().optional(), // Source: 'mock', 'coingecko', etc.
  tokenSymbol: z.string().optional(), // Token symbol (e.g., 'PAS', 'DOT')
  tokenAmount: z.string().optional(), // Amount in tokens
})

const castVoteSchema = z.object({
  approvalId: z.number().int().positive(),
  signatoryAddress: z.string().min(1, 'Wallet address is required'),
  signatureType: z.enum(['signed', 'rejected']),
  txHash: z.string().min(1, 'Transaction hash is required'),
  reviewId: z.number().int().positive().optional(), // Link to review for merged workflow
  // Auto-execution tracking (when this vote hits quorum)
  wasExecuted: z.boolean().optional(),
  executionBlockNumber: z.number().int().optional(),
  childBountyId: z.number().int().optional(), // Actual child bounty ID after execution
})

const finalizeApprovalSchema = z.object({
  approvalId: z.number().int().positive(),
  signatoryAddress: z.string().min(1, 'Wallet address is required'),
  executionTxHash: z.string().min(1, 'Execution transaction hash is required'),
  executionBlockNumber: z.number().int().positive(),
})

export type InitiateApprovalInput = z.infer<typeof initiateApprovalSchema>
export type CastVoteInput = z.infer<typeof castVoteSchema>
export type FinalizeApprovalInput = z.infer<typeof finalizeApprovalSchema>

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Initiate multisig approval for a milestone
 * Called by the first committee member to start the approval process
 * This records the on-chain multisig call and the initiator's vote
 */
export const initiateMultisigApproval = validatedActionWithUser(
  initiateApprovalSchema,
  async (
    data: InitiateApprovalInput,
    user: { id: number; email: string | null }
  ) => {
    console.log('[multisig-actions]: Initiating approval', {
      milestoneId: data.milestoneId,
      userId: user.id,
      workflow: data.approvalWorkflow,
    })

    try {
      // Verify user is a reviewer
      const isAuthorized = await isUserReviewer(user.id)
      if (!isAuthorized) {
        console.log('[multisig-actions]: User not authorized', {
          userId: user.id,
        })
        return { error: 'You are not authorized to initiate approvals' }
      }

      // Get milestone details (includes submission for groupId)
      const milestone = await getMilestoneById(data.milestoneId)
      if (!milestone?.submission) {
        return { error: 'Milestone not found' }
      }

      // Check if there's already an active approval
      const existingApproval = await getActiveMilestoneApproval(
        data.milestoneId
      )
      if (existingApproval) {
        return {
          error:
            'There is already an active approval process for this milestone',
        }
      }

      // Get committee/group details (via submission.reviewerGroupId)
      const committee = await db.query.groups.findFirst({
        where: eq(groups.id, milestone.submission.reviewerGroupId),
      })

      if (!committee) {
        return { error: 'Committee not found' }
      }

      // Verify committee has multisig configured
      const multisigConfig = committee.settings?.multisig
      if (!multisigConfig) {
        return {
          error: 'Committee does not have multisig wallet configured',
        }
      }

      // Verify initiator is a signatory
      const signatoryAddresses = multisigConfig.signatories.map(s => s.address)
      if (!signatoryAddresses.includes(data.initiatorWalletAddress)) {
        return {
          error: 'Your wallet address is not a signatory for this committee',
        }
      }

      // Get submission for beneficiary wallet
      const [submission] = await db
        .select()
        .from(submissions)
        .where(eq(submissions.id, milestone.submissionId))
        .limit(1)

      if (!submission?.walletAddress) {
        return {
          error: 'Submission or beneficiary wallet address not found',
        }
      }

      // Create approval record with child bounty tracking and price info
      const approval = await createMilestoneApproval({
        milestoneId: data.milestoneId,
        groupId: milestone.submission.reviewerGroupId,
        multisigCallHash: data.callHash,
        multisigCallData: data.callDataHex,
        timepoint: data.timepoint,
        initiatorId: user.id,
        initiatorAddress: data.initiatorWalletAddress,
        approvalWorkflow: data.approvalWorkflow,
        payoutAmount: milestone.amount?.toString(),
        beneficiaryAddress: submission.walletAddress,
        // Child bounty tracking
        parentBountyId: data.parentBountyId,
        childBountyId: data.predictedChildBountyId,
        // Price conversion info (for transparency to other signatories)
        priceUsd: data.priceUsd,
        priceDate: data.priceDate ? new Date(data.priceDate) : undefined,
        priceSource: data.priceSource,
        tokenSymbol: data.tokenSymbol,
        tokenAmount: data.tokenAmount,
      })

      // Record initiator's signature (first signatory is automatic)
      await createMultisigSignature({
        approvalId: approval.id,
        reviewId: data.reviewId, // Link to review if merged workflow
        userId: user.id,
        signatoryAddress: data.initiatorWalletAddress,
        signatureType: 'signed',
        txHash: data.txHash,
        isInitiator: true,
        isFinalApproval: false,
      })

      // Notify other committee members
      // TODO: Implement notification to other signatories

      console.log('[multisig-actions]: Approval initiated successfully', {
        approvalId: approval.id,
        milestoneId: data.milestoneId,
      })

      // Revalidate paths
      revalidatePath(`/dashboard/submissions/${milestone.submissionId}`)
      revalidatePath('/dashboard/review')

      return {
        success: true,
        approvalId: approval.id,
        message: 'Milestone approval initiated successfully',
      }
    } catch (error) {
      console.error('[multisig-actions]: Failed to initiate approval', error)
      return {
        error: 'Failed to initiate approval. Please try again.',
      }
    }
  }
)

/**
 * Cast a vote on an existing multisig approval
 * Called by committee members (except the last one) to approve/reject
 */
export const castMultisigVote = validatedActionWithUser(
  castVoteSchema,
  async (data: CastVoteInput, user: { id: number; email: string | null }) => {
    console.log('[multisig-actions]: Recording signature', {
      approvalId: data.approvalId,
      userId: user.id,
      signatureType: data.signatureType,
    })

    try {
      // Verify user is a reviewer
      const isAuthorized = await isUserReviewer(user.id)
      if (!isAuthorized) {
        return { error: 'You are not authorized to vote on approvals' }
      }

      // Get approval details
      const approval = await getMilestoneApprovalWithVotes(data.approvalId)
      if (!approval) {
        return { error: 'Approval not found' }
      }

      if (approval.status !== 'pending') {
        return { error: 'This approval is no longer active' }
      }

      // Get committee details
      const committee = await db.query.groups.findFirst({
        where: eq(groups.id, approval.groupId),
      })

      if (!committee?.settings?.multisig) {
        return { error: 'Committee multisig configuration not found' }
      }

      const multisigConfig = committee.settings.multisig

      // Verify voter is a signatory
      const signatoryAddresses = multisigConfig.signatories.map(s => s.address)
      if (!signatoryAddresses.includes(data.signatoryAddress)) {
        return {
          error: 'Your wallet address is not a signatory for this committee',
        }
      }

      // Check if user already voted
      const alreadyVoted = await hasUserVoted(
        data.approvalId,
        data.signatoryAddress
      )
      if (alreadyVoted) {
        return { error: 'You have already voted on this approval' }
      }

      // Record the signature
      // If this vote triggered execution (wasExecuted=true), mark as final approval
      await createMultisigSignature({
        approvalId: data.approvalId,
        reviewId: data.reviewId, // Link to review if merged workflow
        userId: user.id,
        signatoryAddress: data.signatoryAddress,
        signatureType: data.signatureType,
        txHash: data.txHash,
        isInitiator: false,
        isFinalApproval: data.wasExecuted ?? false,
      })

      // Check if threshold is met
      const voteCount = await getApprovalVoteCount(data.approvalId)
      const thresholdMet = voteCount.approvals >= multisigConfig.threshold

      console.log('[multisig-actions]: Vote recorded', {
        approvalId: data.approvalId,
        voteCount,
        threshold: multisigConfig.threshold,
        thresholdMet,
        wasExecuted: data.wasExecuted,
      })

      // If this vote also executed the transaction, complete the approval
      if (data.wasExecuted && data.executionBlockNumber) {
        console.log(
          '[multisig-actions]: Vote triggered execution, completing approval'
        )

        // Complete the approval and update milestone
        await completeMilestoneApproval({
          approvalId: data.approvalId,
          milestoneId: approval.milestoneId,
          executionTxHash: data.txHash, // The tx that executed is the same as the vote tx
          executionBlockNumber: data.executionBlockNumber,
          childBountyId: data.childBountyId, // Track actual child bounty ID if available
        })

        // Create payout record
        if (approval.payoutAmount) {
          await createPayout({
            submissionId: approval.milestone.submissionId,
            milestoneId: approval.milestoneId,
            groupId: approval.groupId,
            amount: parseInt(approval.payoutAmount),
            transactionHash: data.txHash,
            blockExplorerUrl: `https://paseo.subscan.io/extrinsic/${data.txHash}`,
            triggeredBy: approval.initiatorId,
            walletFrom: multisigConfig.multisigAddress,
            walletTo: approval.beneficiaryAddress,
          })
        }

        // Notify submission owner
        try {
          await createNotification({
            userId: approval.milestone.submissionId, // Need to get actual submitter ID
            type: 'milestone_completed',
            content: `Milestone "${approval.milestone.title}" has been approved and payment has been executed.`,
            submissionId: approval.milestone.submissionId,
            milestoneId: approval.milestoneId,
            groupId: approval.groupId,
          })
        } catch (notificationError) {
          console.error(
            '[multisig-actions]: Failed to send notification',
            notificationError
          )
          // Don't fail the operation for notification errors
        }

        // Revalidate paths
        revalidatePath(
          `/dashboard/submissions/${approval.milestone.submissionId}`
        )
        revalidatePath('/dashboard/review')
        revalidatePath('/dashboard/submissions')

        return {
          success: true,
          message: 'Milestone approved and payment executed successfully',
          thresholdMet: true,
          wasExecuted: true,
          votesNeeded: 0,
        }
      }

      // Notify relevant parties
      // TODO: Implement notifications

      // Revalidate paths
      revalidatePath(
        `/dashboard/submissions/${approval.milestone.submissionId}`
      )
      revalidatePath('/dashboard/review')

      return {
        success: true,
        message: 'Vote recorded successfully',
        thresholdMet,
        wasExecuted: false,
        votesNeeded: Math.max(
          0,
          multisigConfig.threshold - voteCount.approvals
        ),
      }
    } catch (error) {
      console.error('[multisig-actions]: Failed to cast vote', error)
      return {
        error: 'Failed to record vote. Please try again.',
      }
    }
  }
)

/**
 * Finalize multisig approval (final vote that executes)
 * Called by the last required committee member
 * This records the execution and updates milestone/payout status
 */
export const finalizeMultisigApproval = validatedActionWithUser(
  finalizeApprovalSchema,
  async (
    data: FinalizeApprovalInput,
    user: { id: number; email: string | null }
  ) => {
    console.log('[multisig-actions]: Finalizing approval', {
      approvalId: data.approvalId,
      userId: user.id,
    })

    try {
      // Verify user is a reviewer
      const isAuthorized = await isUserReviewer(user.id)
      if (!isAuthorized) {
        return { error: 'You are not authorized to finalize approvals' }
      }

      // Get approval details
      const approval = await getMilestoneApprovalWithVotes(data.approvalId)
      if (!approval) {
        return { error: 'Approval not found' }
      }

      if (approval.status !== 'pending') {
        return { error: 'This approval is no longer active' }
      }

      // Get committee details
      const committee = await db.query.groups.findFirst({
        where: eq(groups.id, approval.groupId),
      })

      if (!committee?.settings?.multisig) {
        return { error: 'Committee multisig configuration not found' }
      }

      const multisigConfig = committee.settings.multisig
      const signatoryAddresses = multisigConfig.signatories.map(s => s.address)

      // Verify finalizer is a signatory
      if (!signatoryAddresses.includes(data.signatoryAddress)) {
        return {
          error: 'Your wallet address is not a signatory for this committee',
        }
      }

      // Check if user already voted
      const alreadyVoted = await hasUserVoted(
        data.approvalId,
        data.signatoryAddress
      )
      if (alreadyVoted) {
        return { error: 'You have already voted on this approval' }
      }

      // Record final signature
      await createMultisigSignature({
        approvalId: data.approvalId,
        reviewId: undefined, // No review link in final execution
        userId: user.id,
        signatoryAddress: data.signatoryAddress,
        signatureType: 'signed',
        txHash: data.executionTxHash,
        isInitiator: false,
        isFinalApproval: true,
      })

      // Complete the approval and update milestone
      await completeMilestoneApproval({
        approvalId: data.approvalId,
        milestoneId: approval.milestoneId,
        executionTxHash: data.executionTxHash,
        executionBlockNumber: data.executionBlockNumber,
      })

      // Create payout record
      if (approval.payoutAmount) {
        await createPayout({
          submissionId: approval.milestone.submissionId,
          milestoneId: approval.milestoneId,
          groupId: approval.groupId,
          amount: parseInt(approval.payoutAmount),
          transactionHash: data.executionTxHash,
          blockExplorerUrl: `https://paseo.subscan.io/extrinsic/${data.executionTxHash}`,
          triggeredBy: approval.initiatorId,
          walletFrom: multisigConfig.multisigAddress,
          walletTo: approval.beneficiaryAddress,
        })
      }

      // Notify submission owner
      try {
        await createNotification({
          userId: approval.milestone.submissionId, // Need to get actual submitter ID
          type: 'milestone_completed',
          content: `Milestone "${approval.milestone.title}" has been approved and payment has been executed.`,
          submissionId: approval.milestone.submissionId,
          milestoneId: approval.milestoneId,
          groupId: approval.groupId,
        })
      } catch (notificationError) {
        console.error(
          '[multisig-actions]: Failed to send notification',
          notificationError
        )
        // Don't fail the operation for notification errors
      }

      console.log('[multisig-actions]: Approval finalized successfully', {
        approvalId: data.approvalId,
        milestoneId: approval.milestoneId,
      })

      // Revalidate paths
      revalidatePath(
        `/dashboard/submissions/${approval.milestone.submissionId}`
      )
      revalidatePath('/dashboard/review')
      revalidatePath('/dashboard/submissions')

      return {
        success: true,
        message: 'Milestone approved and payment executed successfully',
      }
    } catch (error) {
      console.error('[multisig-actions]: Failed to finalize approval', error)
      return {
        error: 'Failed to finalize approval. Please try again.',
      }
    }
  }
)

/**
 * Get approval status for a milestone
 * This is a read-only action that doesn't require authentication
 */
export async function getMilestoneApprovalStatus(milestoneId: number) {
  try {
    const approval = await getActiveMilestoneApproval(milestoneId)

    if (!approval) {
      return { status: 'no_active_approval' as const }
    }

    const voteCount = await getApprovalVoteCount(approval.id)

    // Get committee config
    const committee = await db.query.groups.findFirst({
      where: eq(groups.id, approval.groupId),
    })

    const threshold = committee?.settings?.multisig?.threshold ?? 2

    return {
      status: 'active' as const,
      approval: {
        id: approval.id,
        callHash: approval.multisigCallHash,
        callData: approval.multisigCallData,
        timepoint: approval.timepoint,
        initiatorAddress: approval.initiatorAddress,
        approvalWorkflow: approval.approvalWorkflow,
        createdAt: approval.createdAt,
        // Price conversion info (for transparency to subsequent signatories)
        priceUsd: approval.priceUsd,
        priceDate: approval.priceDate,
        priceSource: approval.priceSource,
        tokenSymbol: approval.tokenSymbol,
        tokenAmount: approval.tokenAmount,
      },
      votes: {
        total: voteCount.total,
        approvals: voteCount.approvals,
        rejections: voteCount.rejections,
        threshold,
        thresholdMet: voteCount.approvals >= threshold,
      },
      signatories: approval.signatures.map(signature => ({
        address: signature.signatoryAddress,
        signatureType: signature.signatureType,
        txHash: signature.txHash,
        signedAt: signature.signedAt,
        isInitiator: signature.isInitiator,
        user: signature.user,
      })),
    }
  } catch (error) {
    console.error('[multisig-actions]: Failed to get approval status', error)
    return { status: 'error' as const, error: 'Failed to get approval status' }
  }
}
