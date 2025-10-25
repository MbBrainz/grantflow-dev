/**
 * Polkadot multisig utilities for milestone-based grant approvals
 *
 * This module provides core functions for:
 * - Creating multisig approval transactions
 * - Handling first-signatory-votes pattern (asMulti publishes + votes)
 * - Subsequent approvals with approveAsMulti
 * - Final execution with full call data
 */

import type { MultisigConfig } from '../db/schema/jsonTypes/GroupSettings'
import { getPaseoTypedApi } from './client'
import {
  Binary,
  type PolkadotSigner,
  type FixedSizeBinary,
  type TxCallData,
} from 'polkadot-api'
import { toPaseoAddress } from './address'

/**
 * Multisig event interface
 */
interface MultisigEvent {
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
 */
export function createTransferCall(beneficiaryAddress: string, amount: bigint) {
  console.log('[createTransferCall]: Creating transfer call', {
    beneficiaryAddress,
    amount: amount.toString(),
  })

  const api = getPaseoTypedApi()

  return api.tx.Balances.transfer_keep_alive({
    dest: { type: 'Id', value: beneficiaryAddress },
    value: amount,
  })
}

/**
 * Create a batched call combining transfer and remark
 * This ensures atomic execution - both succeed or both fail
 */
export function createBatchedPaymentCall(
  beneficiaryAddress: string,
  amount: bigint,
  milestoneId: number
) {
  console.log('[createBatchedPaymentCall]: Creating batched payment call', {
    beneficiaryAddress,
    amount: amount.toString(),
    milestoneId,
  })

  const api = getPaseoTypedApi()

  // Create the transfer call
  const transferCall = createTransferCall(beneficiaryAddress, amount)

  // Create the remark call with milestone ID
  const remarkCall = api.tx.System.remark({
    remark: Binary.fromText(`milestone:${milestoneId}`),
  })

  // Batch both calls atomically
  return api.tx.Utility.batch_all({
    calls: [transferCall.decodedCall, remarkCall.decodedCall],
  })
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
  multisigConfig: MultisigConfig
  milestoneId: number
  payoutAmount: bigint
  initiatorAddress: string
  signer: PolkadotSigner
  useBatch?: boolean
}): Promise<InitiateApprovalResult> {
  const {
    multisigConfig,
    milestoneId,
    payoutAmount,
    initiatorAddress: rawInitiatorAddress,
    signer,
    useBatch = true,
  } = params
  
  // Convert initiator address to Paseo format
  const initiatorAddress = toPaseoAddress(rawInitiatorAddress)

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

  try {
    const api = getPaseoTypedApi()

    // Create the payment call (batched or simple)
    const paymentCall = useBatch
      ? createBatchedPaymentCall(multisigConfig.multisigAddress, payoutAmount, milestoneId)
      : createTransferCall(multisigConfig.multisigAddress, payoutAmount)

    // Get call data and hash
    const callData = await paymentCall.getEncodedData()
    const callHash = await paymentCall.getEncodedData()

    // Get sorted other signatories
    const otherSignatories = getOtherSignatories(
      multisigConfig.signatories,
      initiatorAddress
    )

    // Calculate max weight for the call execution
    const maxWeight = {
      ref_time: 1000000000n, // 1 second
      proof_size: 1000000n, // 1MB
    }

    // Create multisig as_multi call (first signatory publishes AND votes)
    const multisigCall = api.tx.Multisig.as_multi({
      threshold: multisigConfig.threshold,
      other_signatories: otherSignatories,
      maybe_timepoint: undefined, // First call has no timepoint
      call: paymentCall.decodedCall, // Use the decoded call object
      max_weight: maxWeight,
    })

    console.log('[initiateMultisigApproval]: Submitting multisig call', {
      threshold: multisigConfig.threshold,
      otherSignatoriesCount: otherSignatories.length,
      callHash: callHash.asText(),
      multisigAddress: multisigConfig.multisigAddress,
      initiatorAddress,
      otherSignatories,
    })

    // Sign and submit the transaction
    console.log('[initiateMultisigApproval]: Calling signSubmitAndWatch with signer')
    const tx = multisigCall.signSubmitAndWatch(signer)
    console.log('[initiateMultisigApproval]: Transaction observable created')

    // Wait for the transaction to be finalized
    const finalized = await tx.toPromise()

    if (!finalized) {
      throw new Error('Transaction was not finalized')
    }

    // Extract transaction details
    const txHash = finalized.txHash
    const blockNumber = (finalized as { blockNumber?: number }).blockNumber ?? 0

    // Parse events to find timepoint
    let timepoint: Timepoint | null = null

    // Handle events from the transaction result
    const events = (finalized as { events?: MultisigEvent[] }).events ?? []
    for (const event of events) {
      if (event.type === 'Multisig') {
        if (event.value.type === 'NewMultisig' && event.value.value.when) {
          // Extract timepoint from NewMultisig event
          timepoint = {
            height: event.value.value.when.height,
            index: event.value.value.when.index,
          }
          console.log(
            '[initiateMultisigApproval]: Found timepoint from NewMultisig',
            timepoint
          )
        } else if (
          event.value.type === 'MultisigApproval' &&
          event.value.value.when
        ) {
          // Extract timepoint from MultisigApproval event
          timepoint = {
            height: event.value.value.when.height,
            index: event.value.value.when.index,
          }
          console.log(
            '[initiateMultisigApproval]: Found timepoint from MultisigApproval',
            timepoint
          )
        }
      }
    }

    if (!timepoint) {
      throw new Error('Could not extract timepoint from transaction events')
    }

    console.log('[initiateMultisigApproval]: Approval initiated successfully', {
      txHash,
      blockNumber,
      timepoint,
      callHash: callHash.asText(),
    })

    return {
      txHash,
      callHash: callHash.asText(),
      callData: callData as unknown as Uint8Array,
      timepoint,
      blockNumber,
    }
  } catch (error) {
    console.error(
      '[initiateMultisigApproval]: Failed to initiate approval',
      error
    )
    
    // Provide helpful error messages
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('wasm trap') || errorMessage.includes('unreachable')) {
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
  callHash: string
  timepoint: Timepoint
  threshold: number
  allSignatories: string[]
  approverAddress: string
  signer: PolkadotSigner
}): Promise<{ txHash: string; blockNumber: number; thresholdMet: boolean }> {
  const {
    callHash,
    timepoint,
    threshold,
    allSignatories,
    approverAddress: rawApproverAddress,
    signer,
  } = params
  
  // Convert approver address to Paseo format
  const approverAddress = toPaseoAddress(rawApproverAddress)

  console.log('[approveMultisigCall]: Approving call', {
    callHash,
    timepoint,
    approverAddress,
    rawApproverAddress,
    threshold,
  })

  try {
    const api = getPaseoTypedApi()

    // Get sorted other signatories
    const otherSignatories = getOtherSignatories(
      allSignatories,
      approverAddress
    )

    // Calculate max weight for the call execution
    const maxWeight = {
      ref_time: 1000000000n, // 1 second
      proof_size: 1000000n, // 1MB
    }

    // Create approval transaction (only needs hash, not full call data)
    const approvalCall = api.tx.Multisig.approve_as_multi({
      threshold,
      other_signatories: otherSignatories,
      maybe_timepoint: timepoint,
      call_hash: callHash as unknown as FixedSizeBinary<32>, // Type conversion for FixedSizeBinary<32>
      max_weight: maxWeight,
    })

    console.log('[approveMultisigCall]: Submitting approval', {
      threshold,
      otherSignatoriesCount: otherSignatories.length,
      callHash,
    })

    // Sign and submit the transaction
    const tx = approvalCall.signSubmitAndWatch(signer)

    // Wait for the transaction to be finalized
    const finalized = await tx.toPromise()

    if (!finalized) {
      throw new Error('Transaction was not finalized')
    }

    // Extract transaction details
    const txHash = finalized.txHash
    const blockNumber = (finalized as { blockNumber?: number }).blockNumber ?? 0

    // Check if threshold is met by looking for MultisigApproval events
    let thresholdMet = false
    let approvalCount = 0

    const events = (finalized as { events?: MultisigEvent[] }).events ?? []
    for (const event of events) {
      if (event.type === 'Multisig') {
        if (
          event.value.type === 'MultisigApproval' &&
          event.value.value.approvals
        ) {
          approvalCount = event.value.value.approvals.length
          thresholdMet = approvalCount >= threshold
          console.log('[approveMultisigCall]: Found MultisigApproval event', {
            approvalCount,
            threshold,
            thresholdMet,
          })
        }
      }
    }

    console.log('[approveMultisigCall]: Approval submitted successfully', {
      txHash,
      blockNumber,
      thresholdMet,
      approvalCount,
    })

    return {
      txHash,
      blockNumber,
      thresholdMet,
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
  } = params
  
  // Convert executor address to Paseo format
  const executorAddress = toPaseoAddress(rawExecutorAddress)

  console.log('[finalizeMultisigCall]: Finalizing call', {
    timepoint,
    threshold,
    executorAddress,
    rawExecutorAddress,
    milestoneId,
    useBatch,
  })

  try {
    const api = getPaseoTypedApi()

    // Reconstruct the original call to get fresh call data
    const paymentCall = useBatch
      ? createBatchedPaymentCall(beneficiaryAddress, payoutAmount, milestoneId)
      : createTransferCall(beneficiaryAddress, payoutAmount)

    // Get fresh call data (must match the original)
    const freshCallData = await paymentCall.getEncodedData()

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
      ref_time: 1000000000n, // 1 second
      proof_size: 1000000n, // 1MB
    }

    // Create final multisig transaction with full call data
    const finalizeCall = api.tx.Multisig.as_multi({
      threshold,
      other_signatories: otherSignatories,
      maybe_timepoint: timepoint,
      call: params.callData as unknown as TxCallData, // Type conversion for TxCallData
      max_weight: maxWeight,
    })

    console.log('[finalizeMultisigCall]: Submitting final execution', {
      threshold,
      otherSignatoriesCount: otherSignatories.length,
      timepoint,
    })

    // Sign and submit the transaction
    const tx = finalizeCall.signSubmitAndWatch(signer)

    // Wait for the transaction to be finalized
    const finalized = await tx.toPromise()

    if (!finalized) {
      throw new Error('Transaction was not finalized')
    }

    // Extract transaction details
    const txHash = finalized.txHash
    const blockNumber = (finalized as { blockNumber?: number }).blockNumber ?? 0

    // Check for execution success/failure
    let executionSuccess = false
    let executionError: string | undefined

    const events = (finalized as { events?: MultisigEvent[] }).events ?? []
    for (const event of events) {
      if (event.type === 'Multisig') {
        if (
          event.value.type === 'MultisigExecuted' &&
          event.value.value.result
        ) {
          executionSuccess = event.value.value.result.type === 'Ok'
          if (!executionSuccess && event.value.value.result.type === 'Err') {
            executionError = String(event.value.value.result.value)
          }
          console.log('[finalizeMultisigCall]: Found MultisigExecuted event', {
            executionSuccess,
            executionError,
          })
        }
      }
    }

    if (!executionSuccess && !executionError) {
      executionError = 'Execution failed but no error details available'
    }

    console.log('[finalizeMultisigCall]: Final execution completed', {
      txHash,
      blockNumber,
      executionSuccess,
      executionError,
    })

    return {
      txHash,
      blockNumber,
      executionSuccess,
      executionError,
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
  multisigAddress: string
): Promise<PendingMultisig[]> {
  console.log('[queryPendingMultisigs]: Querying pending multisigs', {
    multisigAddress,
  })

  try {
    const api = getPaseoTypedApi()

    // Query all multisig entries for the address
    const entries =
      await api.query.Multisig.Multisigs.getEntries(multisigAddress)

    const pendingMultisigs: PendingMultisig[] = []

    for (const entry of entries) {
      const [_address, callHash] = entry.keyArgs
      const multisigData = entry.value

      if (multisigData) {
        const pendingMultisig: PendingMultisig = {
          callHash: typeof callHash === 'string' ? callHash : callHash.asText(),
          when: {
            height: multisigData.when.height,
            index: multisigData.when.index,
          },
          deposit: multisigData.deposit,
          depositor: multisigData.depositor,
          approvals: multisigData.approvals,
        }

        pendingMultisigs.push(pendingMultisig)
      }
    }

    console.log('[queryPendingMultisigs]: Found pending multisigs', {
      multisigAddress,
      count: pendingMultisigs.length,
      multisigs: pendingMultisigs.map(m => ({
        callHash: m.callHash,
        approvals: m.approvals.length,
        depositor: m.depositor,
      })),
    })

    return pendingMultisigs
  } catch (error) {
    console.error(
      '[queryPendingMultisigs]: Failed to query pending multisigs',
      error
    )
    throw error
  }
}
