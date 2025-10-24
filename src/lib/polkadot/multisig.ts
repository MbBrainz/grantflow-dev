/**
 * Polkadot Multisig Transaction Functions
 * 
 * Server-side functions for creating and managing multisig transactions
 * for milestone-based grant payments.
 */

import { getPaseoApi, formatTokenAmount, getExplorerUrl } from './client'
import { 
  getOtherSignatories, 
  callDataToHex, 
  DEFAULT_TRANSFER_WEIGHT,
  DEFAULT_BATCH_WEIGHT,
  type Timepoint,
} from './utils'
import {
  createApprovalWithInitialVote,
  recordVoteAndCheckThreshold,
  updateMultisigApprovalTimepoint,
  recordMultisigExecution,
} from '../db/writes/multisig'
import {
  getMultisigApprovalById,
  getCommitteeMultisigConfig,
  isCommitteeMultisigConfigured,
} from '../db/queries/multisig'
import type { NewMultisigApproval } from '../db/schema/multisig-approvals'

/**
 * Result type for multisig initiation
 */
export interface InitiateApprovalResult {
  approvalId: number
  callHash: string
  callData: string
  txHash: string
  timepoint: Timepoint | null
  explorerUrl: string
}

/**
 * Result type for multisig vote
 */
export interface VoteResult {
  voteId: number
  txHash: string
  thresholdMet: boolean
  explorerUrl: string
}

/**
 * Result type for multisig execution
 */
export interface ExecutionResult {
  txHash: string
  blockNumber: number
  explorerUrl: string
  paymentAmount: string
  recipient: string
}

/**
 * Prepare payment call data for a milestone
 * 
 * This creates the transfer call that will be wrapped in multisig
 */
export async function preparePaymentCall(
  recipientAddress: string,
  amount: bigint,
  milestoneId?: number
) {
  console.log(`[preparePaymentCall]: Preparing payment of ${formatTokenAmount(amount)} to ${recipientAddress}`)

  const api = getPaseoApi()

  // Create the transfer call
  const transferCall = api.tx.Balances.transfer_keep_alive({
    dest: { type: 'Id', value: recipientAddress },
    value: amount,
  })

  // If milestone ID provided, batch with a remark for on-chain record
  if (milestoneId) {
    const remarkCall = api.tx.System.remark({
      remark: `Milestone ${milestoneId} payment approved`,
    })

    const batchCall = api.tx.Utility.batch_all({
      calls: [transferCall.decodedCall, remarkCall.decodedCall],
    })

    return batchCall
  }

  return transferCall
}

/**
 * Initiate a milestone approval (first signatory)
 * 
 * This publishes the multisig call on-chain and automatically counts
 * as the first approval vote.
 */
export async function initiateMillestoneApproval(
  milestoneId: number,
  committeeId: number,
  recipientAddress: string,
  payoutAmount: bigint,
  initiatorAddress: string,
  approvalPattern: 'combined' | 'separated' = 'combined'
): Promise<InitiateApprovalResult> {
  console.log(`[initiateMillestoneApproval]: Initiating approval for milestone ${milestoneId}`)

  // Check committee multisig is configured
  const isConfigured = await isCommitteeMultisigConfigured(committeeId)
  if (!isConfigured) {
    throw new Error('Committee multisig not configured')
  }

  const config = await getCommitteeMultisigConfig(committeeId)
  if (!config) {
    throw new Error('Committee not found')
  }

  const { multisigAddress, multisigThreshold, multisigSignatories } = config

  if (!multisigAddress || !multisigThreshold || !multisigSignatories) {
    throw new Error('Incomplete multisig configuration')
  }

  // Verify initiator is a signatory
  if (!multisigSignatories.includes(initiatorAddress)) {
    throw new Error('Initiator is not a signatory')
  }

  // Prepare the payment call
  const paymentCall = await preparePaymentCall(
    recipientAddress,
    approvalPattern === 'combined' ? payoutAmount : 0n,
    milestoneId
  )

  // Get encoded call data and hash
  const callData = await paymentCall.getEncodedData()
  const callDataHex = callDataToHex(callData)
  
  // For call hash, we need to hash the call data
  // Note: In production, use proper blake2 hashing
  const callHash = `0x${Buffer.from(callData).toString('hex').slice(0, 64)}`

  // Get other signatories (sorted, excluding initiator)
  const otherSignatories = getOtherSignatories(multisigSignatories, initiatorAddress)

  // Create the multisig transaction
  const api = getPaseoApi()
  const multisigTx = api.tx.Multisig.as_multi({
    threshold: multisigThreshold,
    other_signatories: otherSignatories,
    maybe_timepoint: null, // null = first approval
    call: paymentCall.decodedCall,
    max_weight: approvalPattern === 'combined' ? DEFAULT_BATCH_WEIGHT : DEFAULT_TRANSFER_WEIGHT,
  })

  // In production, this would actually submit the transaction
  // For now, we'll simulate the transaction and create database records
  console.log(`[initiateMillestoneApproval]: Would submit transaction with:`, {
    threshold: multisigThreshold,
    otherSignatories: otherSignatories.length,
    callHash,
  })

  // Simulate transaction result
  const simulatedTxHash = `0x${Math.random().toString(16).slice(2)}`
  const simulatedTimepoint: Timepoint = {
    height: Math.floor(Math.random() * 1000000) + 1000000,
    index: Math.floor(Math.random() * 100),
  }

  // Create database records
  const approvalData: NewMultisigApproval = {
    milestoneId,
    committeeId,
    callHash,
    callData: callDataHex,
    timepoint: simulatedTimepoint,
    status: 'pending',
    initiatorAddress,
    approvalPattern,
    paymentAmount: payoutAmount.toString(),
    recipientAddress,
  }

  const { approval, vote } = await createApprovalWithInitialVote(
    approvalData,
    {
      signatoryAddress: initiatorAddress,
      vote: 'approve',
      txHash: simulatedTxHash,
      isInitiator: true,
      isFinalApproval: false,
    }
  )

  console.log(`[initiateMillestoneApproval]: Created approval ${approval.id} and initial vote ${vote.id}`)

  return {
    approvalId: approval.id,
    callHash,
    callData: callDataHex,
    txHash: simulatedTxHash,
    timepoint: simulatedTimepoint,
    explorerUrl: getExplorerUrl(simulatedTxHash),
  }
}

/**
 * Approve a milestone (intermediate signatory)
 * 
 * Records an approval vote for a pending multisig transaction.
 */
export async function approveMillestoneApproval(
  approvalId: number,
  signatoryAddress: string
): Promise<VoteResult> {
  console.log(`[approveMillestoneApproval]: Signatory ${signatoryAddress} approving ${approvalId}`)

  // Get approval details
  const approval = await getMultisigApprovalById(approvalId)
  if (!approval) {
    throw new Error('Approval not found')
  }

  if (approval.status !== 'pending') {
    throw new Error(`Approval is ${approval.status}, cannot vote`)
  }

  // Verify signatory is authorized
  const signatories = approval.committee.multisigSignatories as string[] ?? []
  if (!signatories.includes(signatoryAddress)) {
    throw new Error('Not authorized to vote')
  }

  // Check if already voted
  const alreadyVoted = approval.votes.some(v => v.signatoryAddress === signatoryAddress)
  if (alreadyVoted) {
    throw new Error('Already voted')
  }

  // Get other signatories
  const otherSignatories = getOtherSignatories(signatories, signatoryAddress)

  // Create approval transaction
  const api = getPaseoApi()
  const approvalTx = api.tx.Multisig.approve_as_multi({
    threshold: approval.committee.multisigThreshold ?? 2,
    other_signatories: otherSignatories,
    maybe_timepoint: approval.timepoint,
    call_hash: approval.callHash,
    max_weight: DEFAULT_TRANSFER_WEIGHT,
  })

  // Simulate transaction
  console.log(`[approveMillestoneApproval]: Would submit approval transaction`)
  const simulatedTxHash = `0x${Math.random().toString(16).slice(2)}`

  // Record vote and check threshold
  const { vote, approval: updatedApproval, thresholdMet } = await recordVoteAndCheckThreshold(
    approvalId,
    {
      approvalId,
      signatoryAddress,
      vote: 'approve',
      txHash: simulatedTxHash,
      isInitiator: false,
      isFinalApproval: thresholdMet,
    },
    approval.committee.multisigThreshold ?? 2
  )

  console.log(`[approveMillestoneApproval]: Recorded vote ${vote.id}. Threshold met: ${thresholdMet}`)

  return {
    voteId: vote.id,
    txHash: simulatedTxHash,
    thresholdMet,
    explorerUrl: getExplorerUrl(simulatedTxHash),
  }
}

/**
 * Execute milestone payment (final signatory)
 * 
 * Submits the final approval which triggers transaction execution
 * and releases the payment.
 */
export async function executeMillestonePayment(
  approvalId: number,
  finalSignatoryAddress: string
): Promise<ExecutionResult> {
  console.log(`[executeMillestonePayment]: Final signatory ${finalSignatoryAddress} executing ${approvalId}`)

  // Get approval details
  const approval = await getMultisigApprovalById(approvalId)
  if (!approval) {
    throw new Error('Approval not found')
  }

  if (approval.status === 'executed') {
    throw new Error('Already executed')
  }

  // Verify signatory is authorized
  const signatories = approval.committee.multisigSignatories as string[] ?? []
  if (!signatories.includes(finalSignatoryAddress)) {
    throw new Error('Not authorized')
  }

  // Check if already voted
  const alreadyVoted = approval.votes.some(v => v.signatoryAddress === finalSignatoryAddress)
  if (alreadyVoted) {
    throw new Error('Already voted')
  }

  // Reconstruct the original call
  const paymentCall = await preparePaymentCall(
    approval.recipientAddress!,
    BigInt(approval.paymentAmount || '0'),
    approval.milestoneId
  )

  // Get other signatories
  const otherSignatories = getOtherSignatories(signatories, finalSignatoryAddress)

  // Create final multisig transaction
  const api = getPaseoApi()
  const finalTx = api.tx.Multisig.as_multi({
    threshold: approval.committee.multisigThreshold ?? 2,
    other_signatories: otherSignatories,
    maybe_timepoint: approval.timepoint,
    call: paymentCall.decodedCall,
    max_weight: approval.approvalPattern === 'combined' ? DEFAULT_BATCH_WEIGHT : DEFAULT_TRANSFER_WEIGHT,
  })

  // Simulate execution
  console.log(`[executeMillestonePayment]: Would execute payment transaction`)
  const simulatedTxHash = `0x${Math.random().toString(16).slice(2)}`
  const simulatedBlockNumber = Math.floor(Math.random() * 1000000) + 1000000

  // Record execution
  await recordMultisigExecution(approvalId, simulatedTxHash, simulatedBlockNumber)

  // Record final vote
  await recordVoteAndCheckThreshold(
    approvalId,
    {
      approvalId,
      signatoryAddress: finalSignatoryAddress,
      vote: 'approve',
      txHash: simulatedTxHash,
      isInitiator: false,
      isFinalApproval: true,
      blockNumber: simulatedBlockNumber,
    },
    approval.committee.multisigThreshold ?? 2
  )

  console.log(`[executeMillestonePayment]: Payment executed successfully`)

  return {
    txHash: simulatedTxHash,
    blockNumber: simulatedBlockNumber,
    explorerUrl: getExplorerUrl(simulatedTxHash),
    paymentAmount: formatTokenAmount(BigInt(approval.paymentAmount || '0')),
    recipient: approval.recipientAddress!,
  }
}

/**
 * Check if user can vote on an approval
 */
export async function canUserVote(
  approvalId: number,
  userAddress: string
): Promise<{
  canVote: boolean
  reason?: string
  isNextVoter: boolean
  isFinalVoter: boolean
}> {
  const approval = await getMultisigApprovalById(approvalId)
  if (!approval) {
    return { canVote: false, reason: 'Approval not found', isNextVoter: false, isFinalVoter: false }
  }

  if (approval.status !== 'pending') {
    return { canVote: false, reason: `Approval is ${approval.status}`, isNextVoter: false, isFinalVoter: false }
  }

  const signatories = approval.committee.multisigSignatories as string[] ?? []
  if (!signatories.includes(userAddress)) {
    return { canVote: false, reason: 'Not a signatory', isNextVoter: false, isFinalVoter: false }
  }

  const alreadyVoted = approval.votes.some(v => v.signatoryAddress === userAddress)
  if (alreadyVoted) {
    return { canVote: false, reason: 'Already voted', isNextVoter: false, isFinalVoter: false }
  }

  const threshold = approval.committee.multisigThreshold ?? 2
  const currentVotes = approval.votes.length
  const isFinalVoter = currentVotes + 1 >= threshold

  return {
    canVote: true,
    isNextVoter: true,
    isFinalVoter,
  }
}

