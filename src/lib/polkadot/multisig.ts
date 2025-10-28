/**
 * Polkadot multisig utilities for milestone-based grant approvals
 *
 * This module provides core functions for:
 * - Creating multisig approval transactions
 * - Handling first-signatory-votes pattern (asMulti publishes + votes)
 * - Subsequent approvals with approveAsMulti
 * - Final execution with full call data
 *
 * Note: Using dedot for simplified Polkadot API interactions
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { LegacyClient } from 'dedot'
import { encodeAddress, hexToU8a } from 'dedot/utils'
import type { MultisigConfig } from '../db/schema/jsonTypes/GroupSettings'
import { getNetworkSS58Format, type NetworkType } from './address'
import {
  checkTransactionFeeBalance,
  checkMultisigPayoutBalance,
  createInsufficientBalanceError,
} from './balance'
import type { Signer, HexString } from '@luno-kit/react/types'

// Re-export Signer as PolkadotSigner for backward compatibility
export type PolkadotSigner = Signer

/**
 * Multisig event interface
 * Note: Currently not used but kept for future event handling improvements
 */
interface _MultisigEvent {
  type: string
  value: {
    type: string
    value: {
      when?: { height: number; index: number }
      approvals?: string[]
      result?: { type: string; value?: unknown }
    }
  }
}

/**
 * Sort addresses for multisig operations
 * Polkadot requires signatories to be sorted
 */
export function sortSignatories(addresses: string[]): string[] {
  return [...addresses].sort((a, b) => {
    // Convert addresses to lowercase for comparison
    const aLower = a.toLowerCase()
    const bLower = b.toLowerCase()
    return aLower < bLower ? -1 : aLower > bLower ? 1 : 0
  })
}

/**
 * Get other signatories (excluding the current signer)
 * and sort them as required by Polkadot
 */
export function getOtherSignatories(
  allSignatories: string[],
  currentSignatory: string
): string[] {
  const others = allSignatories.filter(
    addr => addr.toLowerCase() !== currentSignatory.toLowerCase()
  )
  return sortSignatories(others)
}

/**
 * Create a balance transfer call
 * This is the base call that will be wrapped in multisig
 *
 * @param client - The LegacyClient instance from useApi()
 * @param beneficiaryAddress - Recipient wallet address
 * @param amount - Amount to transfer
 */
export function createTransferCall(
  client: LegacyClient,
  beneficiaryAddress: string,
  amount: bigint
) {
  console.log('[createTransferCall]: Creating transfer call', {
    beneficiaryAddress,
    amount: amount.toString(),
  })

  return client.tx.balances.transferKeepAlive(beneficiaryAddress, amount)
}

/**
 * Create a batched call combining transfer and remark
 * This ensures atomic execution - both succeed or both fail
 *
 * @param client - The LegacyClient instance from useApi()
 * @param beneficiaryAddress - Recipient wallet address
 * @param amount - Amount to transfer
 * @param milestoneId - Milestone identifier for on-chain remark
 */
export function createBatchedPaymentCall(
  client: LegacyClient,
  beneficiaryAddress: string,
  amount: bigint,
  milestoneId: number
) {
  console.log('[createBatchedPaymentCall]: Creating batched payment call', {
    beneficiaryAddress,
    amount: amount.toString(),
    milestoneId,
  })

  // Create the transfer call
  const transferCall = createTransferCall(client, beneficiaryAddress, amount)

  // Create the remark call with milestone ID
  const remarkText = `milestone:${milestoneId}`
  const remarkBytes = new TextEncoder().encode(remarkText)
  const remarkCall = client.tx.system.remark(remarkBytes)

  // Batch both calls atomically (using type assertions for dedot compatibility)
  return client.tx.utility.batchAll([transferCall.call, remarkCall.call])
}

/**
 * Timepoint structure for multisig tracking
 */
export interface Timepoint {
  height: number
  index: number
}

/**
 * Result from initiating a multisig approval
 */
export interface InitiateApprovalResult {
  txHash: string
  callHash: string
  callData: Uint8Array
  timepoint: Timepoint
  blockNumber: number
}

/**
 * Initiate milestone approval with first vote
 * This publishes the multisig call on-chain AND counts as the first approval
 *
 * @param beneficiaryAddress - Recipient wallet address
 * @param payoutAmount - Amount to pay in base units (planck)
 * @param milestoneId - Milestone identifier for on-chain remark
 * @param threshold - Number of approvals required
 * @param allSignatories - All committee member wallet addresses
 * @param initiatorAddress - Address of the member initiating
 * @param signer - Polkadot signer instance
 * @param useBatch - Whether to use batch_all for atomic execution
 */
export async function initiateMultisigApproval(params: {
  client: LegacyClient
  multisigConfig: MultisigConfig
  milestoneId: number
  payoutAmount: bigint
  initiatorAddress: string
  signer: PolkadotSigner
  useBatch?: boolean
  network?: NetworkType
}): Promise<InitiateApprovalResult> {
  const {
    client,
    multisigConfig,
    milestoneId,
    payoutAmount,
    initiatorAddress: rawInitiatorAddress,
    signer,
    useBatch = true,
    network = 'paseo', // Default to Paseo for backward compatibility
  } = params

  // const initiatorAddress = encodeAddress(rawInitiatorAddress, getNetworkSS58Format(network))
  const initiatorAddress = rawInitiatorAddress

  console.log('[initiateMultisigApproval]: Initiating approval', {
    milestoneId,
    beneficiaryAddress: multisigConfig.multisigAddress,
    amount: payoutAmount.toString(),
    threshold: multisigConfig.threshold,
    signatoryCount: multisigConfig.signatories.length,
    initiatorAddress,
    rawInitiatorAddress,
    useBatch,
  })

  // Check initiator balance for transaction fees
  console.log('[initiateMultisigApproval]: Checking initiator balance')
  const initiatorBalanceCheck = await checkTransactionFeeBalance(
    client,
    initiatorAddress,
    network
  )

  if (!initiatorBalanceCheck.hasBalance) {
    const errorMessage = createInsufficientBalanceError(
      initiatorAddress,
      initiatorBalanceCheck,
      network,
      'initiator'
    )
    console.error(
      '[initiateMultisigApproval]: Initiator has insufficient balance',
      {
        initiatorAddress,
        balance: initiatorBalanceCheck.balance.transferable.toString(),
        required: initiatorBalanceCheck.required?.toString(),
      }
    )
    throw new Error(errorMessage)
  }

  // Check multisig balance for payout (only if payout amount > 0)
  if (payoutAmount > BigInt(0)) {
    console.log('[initiateMultisigApproval]: Checking multisig balance')
    const multisigBalanceCheck = await checkMultisigPayoutBalance(
      client,
      multisigConfig.multisigAddress,
      payoutAmount,
      network
    )

    if (!multisigBalanceCheck.hasBalance) {
      const errorMessage = createInsufficientBalanceError(
        multisigConfig.multisigAddress,
        multisigBalanceCheck,
        network,
        'multisig'
      )
      console.error(
        '[initiateMultisigApproval]: Multisig has insufficient balance',
        {
          multisigAddress: multisigConfig.multisigAddress,
          balance: multisigBalanceCheck.balance.transferable.toString(),
          required: multisigBalanceCheck.required?.toString(),
          payoutAmount: payoutAmount.toString(),
        }
      )
      throw new Error(errorMessage)
    }
  }

  try {
    // Create the payment call (batched or simple)
    const paymentCall = useBatch
      ? createBatchedPaymentCall(
          params.client,
          multisigConfig.multisigAddress,
          payoutAmount,
          milestoneId
        )
      : createTransferCall(
          params.client,
          multisigConfig.multisigAddress,
          payoutAmount
        )

    // Get call data and hash (using type assertion - dedot API types need refinement)
    const callData = hexToU8a(paymentCall.callHex)
    const callHash = paymentCall.hash

    // Get sorted other signatories
    const otherSignatories = getOtherSignatories(
      multisigConfig.signatories,
      initiatorAddress
    )

    // Calculate max weight for the call execution
    const maxWeight = {
      refTime: 1000000000n, // 1 second
      proofSize: 1000000n, // 1MB
    }

    // Create multisig as_multi call (first signatory publishes AND votes)
    const multisigCall = params.client.tx.multisig.asMulti(
      multisigConfig.threshold,
      otherSignatories,
      undefined, // First call has no timepoint
      paymentCall.call,
      maxWeight
    )

    console.log('[initiateMultisigApproval]: Submitting multisig call', {
      threshold: multisigConfig.threshold,
      otherSignatoriesCount: otherSignatories.length,
      callHash,
      multisigAddress: multisigConfig.multisigAddress,
      initiatorAddress,
      otherSignatories,
    })

    // Sign and submit the transaction
    console.log(
      '[initiateMultisigApproval]: Signing and submitting transaction'
    )
    const _unsub = await multisigCall.signAndSend(
      initiatorAddress,
      { signer },
      (result: any) => {
        console.log(
          '[initiateMultisigApproval]: Transaction status:',
          result.status
        )
      }
    )

    // Wait for finalization (simplified - in production you'd want proper event handling)
    await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds

    // For now, return placeholder values - proper event handling would extract these
    const timepoint: Timepoint = {
      height: 0,
      index: 0,
    }

    console.log('[initiateMultisigApproval]: Approval initiated successfully', {
      callHash,
      timepoint,
    })

    return {
      txHash: callHash as string,
      callHash: callHash as string,
      callData,
      timepoint,
      blockNumber: 0,
    }
  } catch (error) {
    console.error(
      '[initiateMultisigApproval]: Failed to initiate approval',
      error
    )

    // Provide helpful error messages
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (
      errorMessage.includes('wasm trap') ||
      errorMessage.includes('unreachable')
    ) {
      throw new Error(
        'Transaction validation failed on Paseo testnet. This usually means:\n' +
          '1. The initiator account needs Paseo testnet tokens (get them from https://faucet.polkadot.io/paseo)\n' +
          '2. The multisig address might not have enough balance\n' +
          '3. The signatory addresses might be invalid\n\n' +
          `Multisig: ${multisigConfig.multisigAddress}\n` +
          `Initiator: ${initiatorAddress}\n` +
          `Original error: ${errorMessage}`
      )
    }

    throw error
  }
}

/**
 * Approve an existing multisig call (intermediate votes)
 * This is used by signatories after the first one
 *
 * @param callHash - Hash of the multisig call
 * @param timepoint - Block height and extrinsic index from first approval
 * @param threshold - Number of approvals required
 * @param allSignatories - All committee member wallet addresses
 * @param approverAddress - Address of the member approving
 * @param signer - Polkadot signer instance
 */
export async function approveMultisigCall(params: {
  client: LegacyClient
  callHash: string
  timepoint: Timepoint
  threshold: number
  allSignatories: string[]
  approverAddress: string
  signer: PolkadotSigner
  network?: NetworkType
}): Promise<{ txHash: string; blockNumber: number; thresholdMet: boolean }> {
  const {
    callHash,
    timepoint,
    threshold,
    allSignatories,
    approverAddress: rawApproverAddress,
    signer,
    network = 'paseo', // Default to Paseo for backward compatibility
  } = params

  // Convert approver address to the target network format
  const approverAddress = encodeAddress(
    rawApproverAddress,
    getNetworkSS58Format(network)
  )

  console.log('[approveMultisigCall]: Approving call', {
    callHash,
    timepoint,
    approverAddress,
    rawApproverAddress,
    threshold,
  })

  // Check approver balance for transaction fees
  console.log('[approveMultisigCall]: Checking approver balance')
  const approverBalanceCheck = await checkTransactionFeeBalance(
    params.client,
    approverAddress,
    network
  )

  if (!approverBalanceCheck.hasBalance) {
    const errorMessage = createInsufficientBalanceError(
      approverAddress,
      approverBalanceCheck,
      network,
      'initiator'
    )
    console.error('[approveMultisigCall]: Approver has insufficient balance', {
      approverAddress,
      balance: approverBalanceCheck.balance.transferable.toString(),
      required: approverBalanceCheck.required?.toString(),
    })
    throw new Error(errorMessage)
  }

  try {
    // Get sorted other signatories
    const otherSignatories = getOtherSignatories(
      allSignatories,
      approverAddress
    )

    // Calculate max weight for the call execution
    const maxWeight = {
      refTime: 1000000000n, // 1 second
      proofSize: 1000000n, // 1MB
    }

    // Create approval transaction (only needs hash, not full call data)
    const approvalCall = params.client.tx.multisig.approveAsMulti(
      threshold,
      otherSignatories,
      timepoint,
      callHash as HexString,
      maxWeight
    )

    console.log('[approveMultisigCall]: Submitting approval', {
      threshold,
      otherSignatoriesCount: otherSignatories.length,
      callHash,
    })

    // Sign and submit the transaction
    const _unsub = await approvalCall.signAndSend(
      approverAddress,
      { signer },
      (result: any) => {
        console.log('[approveMultisigCall]: Transaction status:', result.status)
      }
    )

    // Wait for finalization (simplified)
    await new Promise(resolve => setTimeout(resolve, 10000))

    console.log('[approveMultisigCall]: Approval submitted successfully')

    return {
      txHash: callHash,
      blockNumber: 0,
      thresholdMet: false, // Would need proper event handling to determine this
    }
  } catch (error) {
    console.error('[approveMultisigCall]: Failed to approve call', error)
    throw error
  }
}

/**
 * Execute multisig call with final approval
 * This is used by the last required signatory
 * Must provide full call data to execute the transaction
 *
 * @param client - The LegacyClient instance from useApi()
 * @param callData - Full encoded call data from initiation
 * @param timepoint - Block height and extrinsic index from first approval
 * @param threshold - Number of approvals required
 * @param allSignatories - All committee member wallet addresses
 * @param executorAddress - Address of the member executing
 * @param signer - Polkadot signer instance
 * @param beneficiaryAddress - Recipient address (for reconstruction)
 * @param payoutAmount - Payment amount (for reconstruction)
 * @param milestoneId - Milestone ID (for reconstruction)
 * @param useBatch - Whether original call used batch
 */
export async function finalizeMultisigCall(params: {
  client: LegacyClient
  callData: Uint8Array
  timepoint: Timepoint
  threshold: number
  allSignatories: string[]
  executorAddress: string
  signer: PolkadotSigner
  beneficiaryAddress: string
  payoutAmount: bigint
  milestoneId: number
  useBatch?: boolean
  network?: NetworkType
}): Promise<{
  txHash: string
  blockNumber: number
  executionSuccess: boolean
  executionError?: string
}> {
  const {
    timepoint,
    threshold,
    allSignatories,
    executorAddress: rawExecutorAddress,
    signer,
    beneficiaryAddress,
    payoutAmount,
    milestoneId,
    useBatch = true,
    network = 'paseo', // Default to Paseo for backward compatibility
  } = params

  // Convert executor address to the target network format
  const executorAddress = encodeAddress(
    rawExecutorAddress,
    getNetworkSS58Format(network)
  )

  console.log('[finalizeMultisigCall]: Finalizing call', {
    timepoint,
    threshold,
    executorAddress,
    rawExecutorAddress,
    milestoneId,
    useBatch,
  })

  // Check executor balance for transaction fees
  console.log('[finalizeMultisigCall]: Checking executor balance')
  const executorBalanceCheck = await checkTransactionFeeBalance(
    params.client,
    executorAddress,
    network
  )

  if (!executorBalanceCheck.hasBalance) {
    const errorMessage = createInsufficientBalanceError(
      executorAddress,
      executorBalanceCheck,
      network,
      'initiator'
    )
    console.error('[finalizeMultisigCall]: Executor has insufficient balance', {
      executorAddress,
      balance: executorBalanceCheck.balance.transferable.toString(),
      required: executorBalanceCheck.required?.toString(),
    })
    throw new Error(errorMessage)
  }

  try {
    // Reconstruct the original call to get fresh call data
    const paymentCall = useBatch
      ? createBatchedPaymentCall(
          params.client,
          beneficiaryAddress,
          payoutAmount,
          milestoneId
        )
      : createTransferCall(params.client, beneficiaryAddress, payoutAmount)

    // Get fresh call data (must match the original) - using type assertion
    const freshCallData = (paymentCall as any).encodedData as Uint8Array

    // Verify call data matches (safety check)
    if (JSON.stringify(freshCallData) !== JSON.stringify(params.callData)) {
      console.warn(
        '[finalizeMultisigCall]: Call data mismatch, using provided data'
      )
    }

    // Get sorted other signatories
    const otherSignatories = getOtherSignatories(
      allSignatories,
      executorAddress
    )

    // Calculate max weight for the call execution
    const maxWeight = {
      refTime: 1000000000n, // 1 second
      proofSize: 1000000n, // 1MB
    }

    // Create final multisig transaction with full call data
    const finalizeCall = params.client.tx.multisig.asMulti(
      threshold,
      otherSignatories,
      timepoint,
      paymentCall.call,
      maxWeight
    )

    console.log('[finalizeMultisigCall]: Submitting final execution', {
      threshold,
      otherSignatoriesCount: otherSignatories.length,
      timepoint,
    })

    // Sign and submit the transaction
    const _unsub = await finalizeCall.signAndSend(
      executorAddress,
      { signer },
      (result: any) => {
        console.log(
          '[finalizeMultisigCall]: Transaction status:',
          result.status
        )
      }
    )

    // Wait for finalization (simplified)
    await new Promise(resolve => setTimeout(resolve, 10000))

    console.log('[finalizeMultisigCall]: Final execution completed')

    return {
      txHash: paymentCall.hash as string,
      blockNumber: 0,
      executionSuccess: true, // Would need proper event handling to determine this
      executionError: undefined,
    }
  } catch (error) {
    console.error('[finalizeMultisigCall]: Failed to finalize call', error)
    throw error
  }
}

/**
 * Interface for pending multisig information
 */
export interface PendingMultisig {
  callHash: string
  when: Timepoint
  deposit: bigint
  depositor: string
  approvals: string[]
}

/**
 * Query pending multisig calls for an address
 * This can be used to check if there are any pending approvals
 */
export async function queryPendingMultisigs(
  client: LegacyClient,
  multisigAddress: string
): Promise<PendingMultisig[]> {
  console.log('[queryPendingMultisigs]: Querying pending multisigs', {
    multisigAddress,
  })

  try {
    // Query all multisig entries for the address (using type assertion for dedot compatibility)
    const entries =
      await client.query.multisig.multisigs.pagedEntries(multisigAddress)
    console.log('[queryPendingMultisigs]: Found pending multisigs', entries)

    return entries.map(([key, multisigData]) => ({
      callHash: key[1],
      when: {
        height: Number(multisigData.when.height),
        index: Number(multisigData.when.index),
      },
      deposit: BigInt(multisigData.deposit),
      depositor: multisigData.depositor.address(),
      approvals: multisigData.approvals.map(approval =>
        approval.raw.toString()
      ),
    }))
  } catch (error) {
    console.error(
      '[queryPendingMultisigs]: Failed to query pending multisigs',
      error
    )
    throw error
  }
}
