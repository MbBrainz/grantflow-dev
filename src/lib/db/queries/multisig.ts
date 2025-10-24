/**
 * Multisig Database Queries
 * 
 * Query functions for multisig approvals and signatory votes.
 */

import { eq, and, desc, isNull } from 'drizzle-orm'
import { db } from '../drizzle'
import {
  multisigApprovals,
  signatoryVotes,
  type MultisigApproval,
  type MultisigApprovalWithVotes,
  type SignatoryVote,
} from '../schema/multisig-approvals'
import { milestones } from '../schema/milestones'
import { groups } from '../schema/groups'

/**
 * Get multisig approval by ID with all related data
 */
export async function getMultisigApprovalById(
  approvalId: number
): Promise<MultisigApprovalWithVotes | null> {
  console.log(`[getMultisigApprovalById]: Fetching approval ${approvalId}`)

  const result = await db.query.multisigApprovals.findFirst({
    where: eq(multisigApprovals.id, approvalId),
    with: {
      votes: {
        orderBy: desc(signatoryVotes.votedAt),
      },
      milestone: {
        columns: {
          id: true,
          title: true,
          amount: true,
          orderNumber: true,
        },
      },
      committee: {
        columns: {
          id: true,
          name: true,
          multisigAddress: true,
          multisigThreshold: true,
        },
      },
    },
  })

  return result as MultisigApprovalWithVotes | null
}

/**
 * Get multisig approval by milestone ID
 */
export async function getMultisigApprovalByMilestoneId(
  milestoneId: number
): Promise<MultisigApprovalWithVotes | null> {
  console.log(`[getMultisigApprovalByMilestoneId]: Fetching approval for milestone ${milestoneId}`)

  const result = await db.query.multisigApprovals.findFirst({
    where: eq(multisigApprovals.milestoneId, milestoneId),
    with: {
      votes: {
        orderBy: desc(signatoryVotes.votedAt),
      },
      milestone: {
        columns: {
          id: true,
          title: true,
          amount: true,
          orderNumber: true,
        },
      },
      committee: {
        columns: {
          id: true,
          name: true,
          multisigAddress: true,
          multisigThreshold: true,
        },
      },
    },
    orderBy: desc(multisigApprovals.createdAt),
  })

  return result as MultisigApprovalWithVotes | null
}

/**
 * Get multisig approval by call hash
 */
export async function getMultisigApprovalByCallHash(
  callHash: string
): Promise<MultisigApproval | null> {
  console.log(`[getMultisigApprovalByCallHash]: Fetching approval for call hash ${callHash}`)

  const result = await db.query.multisigApprovals.findFirst({
    where: eq(multisigApprovals.callHash, callHash),
  })

  return result ?? null
}

/**
 * Get all pending approvals for a committee
 */
export async function getPendingApprovalsForCommittee(
  committeeId: number
): Promise<MultisigApprovalWithVotes[]> {
  console.log(`[getPendingApprovalsForCommittee]: Fetching pending approvals for committee ${committeeId}`)

  const results = await db.query.multisigApprovals.findMany({
    where: and(
      eq(multisigApprovals.committeeId, committeeId),
      eq(multisigApprovals.status, 'pending')
    ),
    with: {
      votes: {
        orderBy: desc(signatoryVotes.votedAt),
      },
      milestone: {
        columns: {
          id: true,
          title: true,
          amount: true,
          orderNumber: true,
        },
      },
      committee: {
        columns: {
          id: true,
          name: true,
          multisigAddress: true,
          multisigThreshold: true,
        },
      },
    },
    orderBy: desc(multisigApprovals.createdAt),
  })

  return results as MultisigApprovalWithVotes[]
}

/**
 * Get pending approvals where a specific signatory hasn't voted yet
 */
export async function getPendingApprovalsForSignatory(
  committeeId: number,
  signatoryAddress: string
): Promise<MultisigApprovalWithVotes[]> {
  console.log(`[getPendingApprovalsForSignatory]: Fetching pending approvals for signatory ${signatoryAddress}`)

  // Get all pending approvals for the committee
  const allPending = await getPendingApprovalsForCommittee(committeeId)

  // Filter to only those where the signatory hasn't voted
  const needingVote = allPending.filter(approval => {
    const hasVoted = approval.votes.some(
      vote => vote.signatoryAddress === signatoryAddress
    )
    return !hasVoted
  })

  return needingVote
}

/**
 * Get all approvals for a milestone (including historical)
 */
export async function getAllApprovalsForMilestone(
  milestoneId: number
): Promise<MultisigApprovalWithVotes[]> {
  console.log(`[getAllApprovalsForMilestone]: Fetching all approvals for milestone ${milestoneId}`)

  const results = await db.query.multisigApprovals.findMany({
    where: eq(multisigApprovals.milestoneId, milestoneId),
    with: {
      votes: {
        orderBy: desc(signatoryVotes.votedAt),
      },
      milestone: {
        columns: {
          id: true,
          title: true,
          amount: true,
          orderNumber: true,
        },
      },
      committee: {
        columns: {
          id: true,
          name: true,
          multisigAddress: true,
          multisigThreshold: true,
        },
      },
    },
    orderBy: desc(multisigApprovals.createdAt),
  })

  return results as MultisigApprovalWithVotes[]
}

/**
 * Get signatory votes for an approval
 */
export async function getSignatoryVotes(
  approvalId: number
): Promise<SignatoryVote[]> {
  console.log(`[getSignatoryVotes]: Fetching votes for approval ${approvalId}`)

  const results = await db.query.signatoryVotes.findMany({
    where: eq(signatoryVotes.approvalId, approvalId),
    orderBy: desc(signatoryVotes.votedAt),
  })

  return results
}

/**
 * Check if a signatory has voted on an approval
 */
export async function hasSignatoryVoted(
  approvalId: number,
  signatoryAddress: string
): Promise<boolean> {
  console.log(`[hasSignatoryVoted]: Checking if ${signatoryAddress} voted on approval ${approvalId}`)

  const result = await db.query.signatoryVotes.findFirst({
    where: and(
      eq(signatoryVotes.approvalId, approvalId),
      eq(signatoryVotes.signatoryAddress, signatoryAddress)
    ),
  })

  return result !== undefined
}

/**
 * Get committee multisig configuration
 */
export async function getCommitteeMultisigConfig(committeeId: number) {
  console.log(`[getCommitteeMultisigConfig]: Fetching multisig config for committee ${committeeId}`)

  const result = await db.query.groups.findFirst({
    where: eq(groups.id, committeeId),
    columns: {
      id: true,
      name: true,
      multisigAddress: true,
      multisigThreshold: true,
      multisigSignatories: true,
      multisigApprovalPattern: true,
    },
  })

  return result ?? null
}

/**
 * Check if committee has multisig configured
 */
export async function isCommitteeMultisigConfigured(
  committeeId: number
): Promise<boolean> {
  console.log(`[isCommitteeMultisigConfigured]: Checking multisig config for committee ${committeeId}`)

  const config = await getCommitteeMultisigConfig(committeeId)

  return (
    config !== null &&
    config.multisigAddress !== null &&
    config.multisigThreshold !== null &&
    config.multisigSignatories !== null &&
    config.multisigSignatories.length > 0 &&
    config.multisigThreshold <= config.multisigSignatories.length
  )
}

/**
 * Get vote counts for an approval
 */
export async function getApprovalVoteCounts(approvalId: number) {
  console.log(`[getApprovalVoteCounts]: Getting vote counts for approval ${approvalId}`)

  const approval = await getMultisigApprovalById(approvalId)
  if (!approval) {
    throw new Error(`Approval ${approvalId} not found`)
  }

  const approveVotes = approval.votes.filter(v => v.vote === 'approve').length
  const rejectVotes = approval.votes.filter(v => v.vote === 'reject').length
  const threshold = approval.committee.multisigThreshold ?? 0

  return {
    approveVotes,
    rejectVotes,
    totalVotes: approveVotes + rejectVotes,
    threshold,
    thresholdMet: approveVotes >= threshold,
    votesNeeded: Math.max(0, threshold - approveVotes),
  }
}

/**
 * Get approval progress for display
 */
export async function getApprovalProgress(approvalId: number) {
  console.log(`[getApprovalProgress]: Getting progress for approval ${approvalId}`)

  const approval = await getMultisigApprovalById(approvalId)
  if (!approval) {
    throw new Error(`Approval ${approvalId} not found`)
  }

  const counts = await getApprovalVoteCounts(approvalId)
  const signatories = approval.committee.multisigSignatories as string[] ?? []

  // Determine who has voted and who hasn't
  const votedAddresses = new Set(approval.votes.map(v => v.signatoryAddress))
  const pendingSignatories = signatories.filter(addr => !votedAddresses.has(addr))

  return {
    status: approval.status,
    counts,
    votedSignatories: Array.from(votedAddresses),
    pendingSignatories,
    progressPercentage: (counts.approveVotes / counts.threshold) * 100,
    isComplete: approval.status === 'executed',
    canExecute: counts.thresholdMet && approval.status !== 'executed',
  }
}

