/**
 * Multisig Database Write Functions
 * 
 * Functions for creating and updating multisig approvals and votes.
 */

import { eq } from 'drizzle-orm'
import { db } from '../drizzle'
import {
  multisigApprovals,
  signatoryVotes,
  type NewMultisigApproval,
  type NewSignatoryVote,
  type MultisigApproval,
  type SignatoryVote,
  type ApprovalStatus,
  type Timepoint,
} from '../schema/multisig-approvals'

/**
 * Create a new multisig approval
 */
export async function createMultisigApproval(
  data: NewMultisigApproval
): Promise<MultisigApproval> {
  console.log(`[createMultisigApproval]: Creating approval for milestone ${data.milestoneId}`)

  const [approval] = await db
    .insert(multisigApprovals)
    .values(data)
    .returning()

  console.log(`[createMultisigApproval]: Created approval ${approval.id}`)
  return approval
}

/**
 * Update multisig approval status
 */
export async function updateMultisigApprovalStatus(
  approvalId: number,
  status: ApprovalStatus,
  additionalData?: {
    executionTxHash?: string
    executionBlockNumber?: number
    executedAt?: Date
  }
): Promise<MultisigApproval> {
  console.log(`[updateMultisigApprovalStatus]: Updating approval ${approvalId} to status ${status}`)

  const [updated] = await db
    .update(multisigApprovals)
    .set({
      status,
      updatedAt: new Date(),
      ...additionalData,
    })
    .where(eq(multisigApprovals.id, approvalId))
    .returning()

  console.log(`[updateMultisigApprovalStatus]: Updated approval ${approvalId}`)
  return updated
}

/**
 * Update multisig approval timepoint
 * 
 * Called after first approval to set the timepoint
 */
export async function updateMultisigApprovalTimepoint(
  approvalId: number,
  timepoint: Timepoint
): Promise<MultisigApproval> {
  console.log(`[updateMultisigApprovalTimepoint]: Setting timepoint for approval ${approvalId}`, JSON.stringify(timepoint, null, 2))

  const [updated] = await db
    .update(multisigApprovals)
    .set({
      timepoint,
      updatedAt: new Date(),
    })
    .where(eq(multisigApprovals.id, approvalId))
    .returning()

  console.log(`[updateMultisigApprovalTimepoint]: Updated approval ${approvalId}`)
  return updated
}

/**
 * Record execution of multisig approval
 */
export async function recordMultisigExecution(
  approvalId: number,
  txHash: string,
  blockNumber: number
): Promise<MultisigApproval> {
  console.log(`[recordMultisigExecution]: Recording execution for approval ${approvalId}`)

  const [updated] = await db
    .update(multisigApprovals)
    .set({
      status: 'executed',
      executionTxHash: txHash,
      executionBlockNumber: blockNumber,
      executedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(multisigApprovals.id, approvalId))
    .returning()

  console.log(`[recordMultisigExecution]: Recorded execution for approval ${approvalId}`)
  return updated
}

/**
 * Cancel multisig approval
 */
export async function cancelMultisigApproval(
  approvalId: number
): Promise<MultisigApproval> {
  console.log(`[cancelMultisigApproval]: Cancelling approval ${approvalId}`)

  const [updated] = await db
    .update(multisigApprovals)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(multisigApprovals.id, approvalId))
    .returning()

  console.log(`[cancelMultisigApproval]: Cancelled approval ${approvalId}`)
  return updated
}

/**
 * Create a signatory vote
 */
export async function createSignatoryVote(
  data: NewSignatoryVote
): Promise<SignatoryVote> {
  console.log(`[createSignatoryVote]: Recording vote from ${data.signatoryAddress} on approval ${data.approvalId}`)

  const [vote] = await db
    .insert(signatoryVotes)
    .values(data)
    .returning()

  console.log(`[createSignatoryVote]: Recorded vote ${vote.id}`)
  return vote
}

/**
 * Update committee multisig configuration
 */
export async function updateCommitteeMultisigConfig(
  committeeId: number,
  config: {
    multisigAddress?: string
    multisigThreshold?: number
    multisigSignatories?: string[]
    multisigApprovalPattern?: 'combined' | 'separated'
  }
) {
  console.log(`[updateCommitteeMultisigConfig]: Updating multisig config for committee ${committeeId}`, JSON.stringify(config, null, 2))

  const { groups } = await import('../schema/groups')

  const [updated] = await db
    .update(groups)
    .set({
      ...config,
      updatedAt: new Date(),
    })
    .where(eq(groups.id, committeeId))
    .returning()

  console.log(`[updateCommitteeMultisigConfig]: Updated committee ${committeeId}`)
  return updated
}

/**
 * Helper: Create approval and first vote in one transaction
 */
export async function createApprovalWithInitialVote(
  approvalData: NewMultisigApproval,
  voteData: Omit<NewSignatoryVote, 'approvalId'>
): Promise<{
  approval: MultisigApproval
  vote: SignatoryVote
}> {
  console.log(`[createApprovalWithInitialVote]: Creating approval and initial vote for milestone ${approvalData.milestoneId}`)

  return await db.transaction(async (tx) => {
    // Create approval
    const [approval] = await tx
      .insert(multisigApprovals)
      .values(approvalData)
      .returning()

    // Create initial vote
    const [vote] = await tx
      .insert(signatoryVotes)
      .values({
        ...voteData,
        approvalId: approval.id,
      })
      .returning()

    console.log(`[createApprovalWithInitialVote]: Created approval ${approval.id} and vote ${vote.id}`)

    return { approval, vote }
  })
}

/**
 * Helper: Record vote and update approval status if threshold met
 */
export async function recordVoteAndCheckThreshold(
  approvalId: number,
  voteData: NewSignatoryVote,
  threshold: number
): Promise<{
  vote: SignatoryVote
  approval: MultisigApproval
  thresholdMet: boolean
}> {
  console.log(`[recordVoteAndCheckThreshold]: Recording vote and checking threshold for approval ${approvalId}`)

  return await db.transaction(async (tx) => {
    // Create vote
    const [vote] = await tx
      .insert(signatoryVotes)
      .values(voteData)
      .returning()

    // Get current vote count
    const votes = await tx
      .select()
      .from(signatoryVotes)
      .where(eq(signatoryVotes.approvalId, approvalId))

    const approveCount = votes.filter(v => v.vote === 'approve').length
    const thresholdMet = approveCount >= threshold

    // Update approval status if threshold met
    let approval: MultisigApproval
    if (thresholdMet) {
      const [updated] = await tx
        .update(multisigApprovals)
        .set({
          status: 'threshold_met',
          updatedAt: new Date(),
        })
        .where(eq(multisigApprovals.id, approvalId))
        .returning()
      approval = updated
    } else {
      const [current] = await tx
        .select()
        .from(multisigApprovals)
        .where(eq(multisigApprovals.id, approvalId))
      approval = current
    }

    console.log(`[recordVoteAndCheckThreshold]: Recorded vote. Threshold met: ${thresholdMet}`)

    return { vote, approval, thresholdMet }
  })
}

