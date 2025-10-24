/**
 * Polkadot multisig utilities for milestone-based grant approvals
 *
 * This module provides core functions for:
 * - Creating multisig approval transactions
 * - Handling first-signatory-votes pattern (asMulti publishes + votes)
 * - Subsequent approvals with approveAsMulti
 * - Final execution with full call data
 */

import { getPolkadotApi } from './client'
import type { PolkadotSigner } from 'polkadot-api'

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
 * NOTE: This requires the polkadot-api package and proper chain descriptors
 * Install with: pnpm add polkadot-api @polkadot-api/descriptors
 * Generate descriptors: https://papi.how/recipes/codegen
 */
export function createTransferCall(
  _beneficiaryAddress: string,
  _amount: bigint
): unknown {
  const _api = getPolkadotApi()

  // TODO: Implement with proper typed API once descriptors are generated
  // return api.tx.Balances.transfer_keep_alive({
  //   dest: { type: 'Id', value: beneficiaryAddress },
  //   value: amount,
  // })

  throw new Error(
    'createTransferCall: Polkadot API not fully configured. Install dependencies and generate chain descriptors.'
  )
}

/**
 * Create a batched call combining transfer and remark
 * This ensures atomic execution - both succeed or both fail
 *
 * NOTE: Requires proper chain descriptors
 */
export function createBatchedPaymentCall(
  _beneficiaryAddress: string,
  _amount: bigint,
  _milestoneId: number
): unknown {
  const _api = getPolkadotApi()

  // TODO: Implement with proper typed API
  // const transferCall = api.tx.Balances.transfer_keep_alive({ ... })
  // const remarkCall = api.tx.System.remark({ ... })
  // return api.tx.Utility.batch_all({ calls: [...] })

  throw new Error(
    'createBatchedPaymentCall: Polkadot API not fully configured.'
  )
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
export function initiateMultisigApproval(_params: {
  beneficiaryAddress: string
  payoutAmount: bigint
  milestoneId: number
  threshold: number
  allSignatories: string[]
  initiatorAddress: string
  signer: PolkadotSigner
  useBatch?: boolean
}): Promise<InitiateApprovalResult> {
  // TODO: Implement once polkadot-api is properly configured
  throw new Error(
    'initiateMultisigApproval: Polkadot API integration requires package installation and chain descriptor generation. ' +
      'Run: pnpm add polkadot-api @polkadot-api/descriptors && generate chain descriptors. ' +
      'See: https://papi.how/recipes/codegen'
  )

  /* Implementation template - uncomment once API is configured:
  const {
    beneficiaryAddress,
    payoutAmount,
    milestoneId,
    threshold,
    allSignatories,
    initiatorAddress,
    signer,
    useBatch = true,
  } = params

  console.log('[polkadot/multisig]: Initiating approval', {
    milestoneId,
    beneficiaryAddress,
    amount: payoutAmount.toString(),
    threshold,
    signatoryCount: allSignatories.length,
  })

  // Create the payment call (batched or simple)
  const paymentCall = useBatch
    ? createBatchedPaymentCall(beneficiaryAddress, payoutAmount, milestoneId)
    : createTransferCall(beneficiaryAddress, payoutAmount)

  // Get call data and hash
  const callData = await paymentCall.getEncodedData()
  const callHash = await paymentCall.getEncodedDataHash()

  // Get sorted other signatories
  const otherSignatories = getOtherSignatories(allSignatories, initiatorAddress)

  // Rest of implementation commented out until API is properly configured
  */
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
export function approveMultisigCall(_params: {
  callHash: string
  timepoint: Timepoint
  threshold: number
  allSignatories: string[]
  approverAddress: string
  signer: PolkadotSigner
}): Promise<string> {
  // TODO: Implement once polkadot-api is properly configured
  throw new Error('approveMultisigCall: Polkadot API not fully configured')

  /* Implementation template:
  const {
    callHash,
    timepoint,
    threshold,
    allSignatories,
    approverAddress,
    signer,
  } = params

  console.log('[polkadot/multisig]: Approving call', {
    callHash,
    timepoint,
    threshold,
  })

  // Get sorted other signatories
  const otherSignatories = getOtherSignatories(allSignatories, approverAddress)

  // Create approval transaction (only needs hash)
  const api = getPolkadotApi()
  // Rest of implementation commented out until API is properly configured
  */
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
export function finalizeMultisigCall(_params: {
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
}): Promise<{ txHash: string; blockNumber: number }> {
  // TODO: Implement once polkadot-api is properly configured
  throw new Error('finalizeMultisigCall: Polkadot API not fully configured')

  /* Implementation template:
  const {
    timepoint,
    threshold,
    allSignatories,
    executorAddress,
    signer,
    beneficiaryAddress,
    payoutAmount,
    milestoneId,
    useBatch = true,
  } = params

  console.log('[polkadot/multisig]: Finalizing call', {
    timepoint,
    threshold,
    milestoneId,
  })

  // Reconstruct the original call
  const paymentCall = useBatch
    ? createBatchedPaymentCall(beneficiaryAddress, payoutAmount, milestoneId)
    : createTransferCall(beneficiaryAddress, payoutAmount)

  // Get sorted other signatories
  const otherSignatories = getOtherSignatories(allSignatories, executorAddress)

  // Create final multisig transaction with full call data
  const api = getPolkadotApi()
  // Rest of implementation commented out until API is properly configured
  */
}

/**
 * Query pending multisig calls for an address
 * This can be used to check if there are any pending approvals
 */
export function queryPendingMultisigs(
  _multisigAddress: string
): Promise<unknown[]> {
  // TODO: Implement once polkadot-api is properly configured
  throw new Error('queryPendingMultisigs: Polkadot API not fully configured')

  /* Implementation template:
  const api = getPolkadotApi()
  const entries = await api.query.Multisig.Multisigs.getEntries(
    multisigAddress
  )

  console.log('[polkadot/multisig]: Queried pending multisigs', {
    multisigAddress,
    count: entries.length,
  })

  return entries
  */
}
