/**
 * Database write operations for milestone approvals and signatory votes
 */

import { eq, and } from 'drizzle-orm'
import { db } from '../drizzle'
import {
  milestoneApprovals,
  multisigSignatures,
  milestones,
  type ApprovalStatus,
  type Timepoint,
} from '../schema'

/**
 * Create a new milestone approval record
 * Called when first signatory initiates multisig approval
 */
export async function createMilestoneApproval(data: {
  milestoneId: number
  groupId: number
  multisigCallHash: string
  multisigCallData: string // Hex-encoded
  timepoint: Timepoint | null
  initiatorId: number
  initiatorAddress: string
  approvalWorkflow: 'merged' | 'separated'
  payoutAmount?: string
  beneficiaryAddress: string
  // Child bounty tracking
  parentBountyId: number // Parent bounty ID from committee config
  childBountyId?: number // Predicted child bounty ID (set during initiation)
}) {
  console.log('[db/writes/milestone-approvals]: Creating approval', {
    ...data,
  })

  const [approval] = await db
    .insert(milestoneApprovals)
    .values({
      milestoneId: data.milestoneId,
      groupId: data.groupId,
      multisigCallHash: data.multisigCallHash,
      multisigCallData: data.multisigCallData,
      timepoint: data.timepoint,
      status: 'pending',
      initiatorId: data.initiatorId,
      initiatorAddress: data.initiatorAddress,
      approvalWorkflow: data.approvalWorkflow,
      payoutAmount: data.payoutAmount,
      beneficiaryAddress: data.beneficiaryAddress,
      parentBountyId: data.parentBountyId,
      childBountyId: data.childBountyId,
    })
    .returning()

  return approval
}

/**
 * Update milestone approval status
 */
export async function updateMilestoneApproval(
  approvalId: number,
  updates: {
    status?: ApprovalStatus
    executedAt?: Date
    executionTxHash?: string
    executionBlockNumber?: number
  }
) {
  console.log('[db/writes/milestone-approvals]: Updating approval', {
    approvalId,
    updates,
  })

  const [updated] = await db
    .update(milestoneApprovals)
    .set(updates)
    .where(eq(milestoneApprovals.id, approvalId))
    .returning()

  return updated
}

/**
 * Record a multisig signature
 * Called after each committee member signs the multisig transaction
 */
export async function createMultisigSignature(data: {
  approvalId: number
  reviewId?: number
  userId?: number
  signatoryAddress: string
  signatureType: 'signed' | 'rejected'
  txHash: string
  isInitiator?: boolean
  isFinalApproval?: boolean
}) {
  console.log('[db/writes/milestone-approvals]: Recording signature', {
    approvalId: data.approvalId,
    signatoryAddress: data.signatoryAddress,
    signatureType: data.signatureType,
  })

  const [signature] = await db
    .insert(multisigSignatures)
    .values({
      approvalId: data.approvalId,
      reviewId: data.reviewId,
      userId: data.userId,
      signatoryAddress: data.signatoryAddress,
      signatureType: data.signatureType,
      txHash: data.txHash,
      isInitiator: data.isInitiator ?? false,
      isFinalApproval: data.isFinalApproval ?? false,
    })
    .returning()

  return signature
}

/**
 * Get milestone approval with all signatures
 */
export async function getMilestoneApprovalWithVotes(approvalId: number) {
  const approval = await db.query.milestoneApprovals.findFirst({
    where: eq(milestoneApprovals.id, approvalId),
    with: {
      signatures: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          review: true,
        },
      },
      milestone: true,
      group: true,
      initiator: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return approval
}

/**
 * Get all approvals for a milestone
 */
export async function getMilestoneApprovals(milestoneId: number) {
  const approvals = await db.query.milestoneApprovals.findMany({
    where: eq(milestoneApprovals.milestoneId, milestoneId),
    with: {
      signatures: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          review: true,
        },
      },
      initiator: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: (approvals, { desc }) => [desc(approvals.createdAt)],
  })

  return approvals
}

/**
 * Get active approval for a milestone (if any)
 * Returns the most recent non-cancelled, non-executed approval
 */
export async function getActiveMilestoneApproval(milestoneId: number) {
  const approval = await db.query.milestoneApprovals.findFirst({
    where: and(
      eq(milestoneApprovals.milestoneId, milestoneId),
      eq(milestoneApprovals.status, 'pending')
    ),
    with: {
      signatures: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          review: true,
        },
      },
      milestone: true,
      group: true,
      initiator: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: (approvals, { desc }) => [desc(approvals.createdAt)],
  })

  return approval
}

/**
 * Check if user has already voted on an approval
 */
export async function hasUserVoted(
  approvalId: number,
  signatoryAddress: string
): Promise<boolean> {
  const signature = await db.query.multisigSignatures.findFirst({
    where: and(
      eq(multisigSignatures.approvalId, approvalId),
      eq(multisigSignatures.signatoryAddress, signatoryAddress)
    ),
  })

  return !!signature
}

/**
 * Get signature count for an approval
 */
export async function getApprovalVoteCount(approvalId: number) {
  const signatures = await db
    .select()
    .from(multisigSignatures)
    .where(eq(multisigSignatures.approvalId, approvalId))

  return {
    total: signatures.length,
    approvals: signatures.filter(s => s.signatureType === 'signed').length,
    rejections: signatures.filter(s => s.signatureType === 'rejected').length,
  }
}

/**
 * Complete milestone approval and update milestone status
 * Called after final signatory executes the transaction
 */
export async function completeMilestoneApproval(params: {
  approvalId: number
  milestoneId: number
  executionTxHash: string
  executionBlockNumber: number
  // Child bounty tracking (optional - set when executing childBounty type)
  childBountyId?: number
}) {
  console.log('[db/writes/milestone-approvals]: Completing approval', params)

  const results = await db.transaction(async tx => {
    // Build the update object
    const approvalUpdates: {
      status: 'executed'
      executedAt: Date
      executionTxHash: string
      executionBlockNumber: number
      childBountyId?: number
    } = {
      status: 'executed',
      executedAt: new Date(),
      executionTxHash: params.executionTxHash,
      executionBlockNumber: params.executionBlockNumber,
    }

    // Include childBountyId if provided (for childBounty call type)
    if (params.childBountyId !== undefined) {
      approvalUpdates.childBountyId = params.childBountyId
    }

    // Update approval status
    const [updatedApproval] = await tx
      .update(milestoneApprovals)
      .set(approvalUpdates)
      .where(eq(milestoneApprovals.id, params.approvalId))
      .returning()

    // Update milestone status
    const [updatedMilestone] = await tx
      .update(milestones)
      .set({
        status: 'completed',
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(milestones.id, params.milestoneId))
      .returning()

    return { approval: updatedApproval, milestone: updatedMilestone }
  })

  return results
}

/**
 * Cancel a pending approval
 * Used when a new approval process needs to be started
 */
export async function cancelMilestoneApproval(approvalId: number) {
  console.log('[db/writes/milestone-approvals]: Cancelling approval', {
    approvalId,
  })

  const [cancelled] = await db
    .update(milestoneApprovals)
    .set({
      status: 'cancelled',
    })
    .where(eq(milestoneApprovals.id, approvalId))
    .returning()

  return cancelled
}
