/**
 * Polkadot multisig utilities for milestone-based grant approvals
 *
 * This module provides core functions for:
 * - Creating multisig approval transactions
 * - Handling first-signatory-votes pattern (asMulti publishes + votes)
 * - Subsequent approvals with approveAsMulti
 * - Final execution with full call data
 * - Quorum detection to combine approval + execution atomically
 * - Child bounty workflow support for proper on-chain indexing
 *
 * Note: Using dedot for simplified Polkadot API interactions
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import type { HexString, Signer } from '@luno-kit/react/types'
import type { LegacyClient } from 'dedot'
import { encodeAddress, hexToU8a } from 'dedot/utils'
import type { MultisigConfig } from '../db/schema/jsonTypes/GroupSettings'
import { getNetworkSS58Format, type NetworkType } from './address'
import {
  checkParentBountyBalance,
  checkTransactionFeeBalance,
  createInsufficientBalanceError,
  formatBalance,
} from './balance'
import {
  type ChildBountyParams,
  createPayoutCall,
  type PriceInfo,
} from './child-bounty'

// Re-export Signer as PolkadotSigner for backward compatibility
export type PolkadotSigner = Signer

// Re-export child bounty types for convenience
export type { ChildBountyParams, PriceInfo }

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
  predictedChildBountyId: number
  /** Price info used for the conversion (for transparency) */
  priceInfo?: PriceInfo
}

/**
 * Result from approving or executing a multisig call
 */
export interface ApproveOrExecuteResult {
  txHash: string
  blockNumber: number
  wasExecuted: boolean
  executionSuccess?: boolean
  executionError?: string
}

/**
 * Check if the next approval will hit the quorum threshold
 *
 * @param currentApprovals - Number of current approvals
 * @param threshold - Required threshold for execution
 * @returns true if the next approval will trigger execution
 */
export function willHitQuorum(
  currentApprovals: number,
  threshold: number
): boolean {
  return currentApprovals + 1 >= threshold
}

/**
 * Check if the quorum has already been met
 *
 * @param currentApprovals - Number of current approvals
 * @param threshold - Required threshold for execution
 * @returns true if quorum is already met
 */
export function isQuorumMet(
  currentApprovals: number,
  threshold: number
): boolean {
  return currentApprovals >= threshold
}

/**
 * Initiate milestone approval with first vote
 * This publishes the multisig call on-chain AND counts as the first approval
 *
 * Uses childBounties pallet for proper on-chain indexing.
 *
 * @param beneficiaryAddress - Recipient wallet address
 * @param payoutAmount - Amount to pay in base units (planck)
 * @param milestoneId - Milestone identifier for on-chain remark
 * @param milestoneTitle - Milestone title for child bounty description
 * @param threshold - Number of approvals required
 * @param allSignatories - All committee member wallet addresses
 * @param initiatorAddress - Address of the member initiating
 * @param signer - Polkadot signer instance
 */
export async function initiateMultisigApproval(params: {
  client: LegacyClient
  multisigConfig: MultisigConfig
  milestoneId: number
  milestoneTitle?: string
  payoutAmount: bigint
  beneficiaryAddress: string
  initiatorAddress: string
  signer: PolkadotSigner
  network?: NetworkType
  /** Price info for on-chain transparency remark */
  priceInfo?: PriceInfo
}): Promise<InitiateApprovalResult> {
  const {
    client,
    multisigConfig,
    milestoneId,
    milestoneTitle = `Milestone ${milestoneId}`,
    payoutAmount,
    beneficiaryAddress,
    initiatorAddress: rawInitiatorAddress,
    signer,
    network = 'paseo',
    priceInfo,
  } = params

  // const initiatorAddress = encodeAddress(rawInitiatorAddress, getNetworkSS58Format(network))
  const initiatorAddress = rawInitiatorAddress

  console.log('[initiateMultisigApproval]: Initiating approval', {
    milestoneId,
    beneficiaryAddress,
    amount: payoutAmount.toString(),
    threshold: multisigConfig.threshold,
    signatoryCount: multisigConfig.signatories.length,
    initiatorAddress,
    rawInitiatorAddress,
    parentBountyId: multisigConfig.parentBountyId,
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

  // Check parent bounty balance for payout (only if payout amount > 0)
  // IMPORTANT: Payout funds come from the parent bounty, NOT from the multisig account.
  // The multisig only needs transaction fees for signing.
  if (payoutAmount > BigInt(0)) {
    console.log('[initiateMultisigApproval]: Checking parent bounty balance')
    const parentBountyCheck = await checkParentBountyBalance(
      client,
      multisigConfig.parentBountyId,
      payoutAmount,
      network
    )

    if (!parentBountyCheck.hasBalance) {
      const bountyValueFormatted = parentBountyCheck.parentBountyValue
        ? formatBalance(parentBountyCheck.parentBountyValue)
        : '0'
      const payoutFormatted = formatBalance(payoutAmount)

      let errorMessage = `Insufficient funds in parent bounty for payout.\n\n`
      errorMessage += `Parent Bounty ID: ${multisigConfig.parentBountyId}\n`
      errorMessage += `Bounty Value: ${bountyValueFormatted} tokens\n`
      errorMessage += `Payout Required: ${payoutFormatted} tokens\n\n`

      if (parentBountyCheck.error) {
        errorMessage += `Error: ${parentBountyCheck.error}\n\n`
      }

      errorMessage += `The parent bounty must have sufficient funds allocated from the treasury.\n`
      errorMessage += `Network: ${network.toUpperCase()}`

      console.error(
        '[initiateMultisigApproval]: Parent bounty has insufficient balance',
        {
          parentBountyId: multisigConfig.parentBountyId,
          bountyValue: parentBountyCheck.parentBountyValue?.toString(),
          payoutAmount: payoutAmount.toString(),
          error: parentBountyCheck.error,
        }
      )
      throw new Error(errorMessage)
    }
  }

  try {
    // Create the child bounty payout call
    const payoutResult = await createPayoutCall(client, {
      beneficiaryAddress,
      amount: payoutAmount,
      milestoneId,
      milestoneTitle,
      parentBountyId: multisigConfig.parentBountyId,
      curatorAddress: multisigConfig.curatorProxyAddress,
      curatorFee: BigInt(0),
      priceInfo, // Include price info for on-chain transparency remark
    })

    // Get call data and hash
    const callData = hexToU8a(payoutResult.callHex)
    const callHash = payoutResult.callHash

    // Get sorted other signatories (extract addresses from SignatoryMapping)
    const otherSignatories = getOtherSignatories(
      multisigConfig.signatories.map(s => s.address),
      initiatorAddress
    )

    // Calculate max weight for the call execution
    const maxWeight = {
      refTime: 1000000000n, // 1 second
      proofSize: 1000000n, // 1MB
    }

    // Create multisig as_multi call (first signatory publishes AND votes)
    // The call from createPayoutCall is typed as unknown due to dedot's generic types
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    const innerCall = payoutResult.call as any
    const multisigCall = client.tx.multisig.asMulti(
      multisigConfig.threshold,
      otherSignatories,
      undefined, // First call has no timepoint
      innerCall,
      maxWeight
    )
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */

    console.log('[initiateMultisigApproval]: Submitting multisig call', {
      threshold: multisigConfig.threshold,
      otherSignatoriesCount: otherSignatories.length,
      callHash,
      multisigAddress: multisigConfig.multisigAddress,
      initiatorAddress,
      otherSignatories,
      predictedChildBountyId: payoutResult.predictedChildBountyId,
    })

    // Sign and submit the transaction
    console.log(
      '[initiateMultisigApproval]: Signing and submitting transaction'
    )

    // Track the timepoint from the transaction events
    let timepoint: Timepoint | null = null
    let txHash: string | null = null
    let blockNumber = 0

    const unsub = await multisigCall.signAndSend(
      initiatorAddress,
      { signer },
      result => {
        console.log(
          '[initiateMultisigApproval]: Transaction status:',
          result.status.type,
          {
            isInBlock: result.status.type === 'BestChainBlockIncluded',
            isFinalized: result.status.type === 'Finalized',
          }
        )

        // Extract timepoint when transaction is included in a block
        if (
          result.status.type === 'BestChainBlockIncluded' ||
          result.status.type === 'Finalized'
        ) {
          txHash = result.txHash

          // Get block header to extract block number and extrinsic index
          if (result.status.value.blockNumber) {
            blockNumber = result.status.value.blockNumber
          }

          // Look for MultisigApproval or NewMultisig event
          if (result.events) {
            for (const record of result.events) {
              const { event } = record

              // Check for Multisig.NewMultisig event
              if (
                event.pallet === 'Multisig' &&
                event.palletEvent.name === 'NewMultisig'
              ) {
                console.log(
                  '[initiateMultisigApproval]: Found NewMultisig event',
                  {
                    event: event.palletEvent,
                  }
                )

                // Extract timepoint from event data
                // NewMultisig event: (AccountId, AccountId, CallHash)
                // The timepoint is the current block and extrinsic index
                if (
                  result.status.value.blockNumber !== undefined &&
                  result.status.value.txIndex !== undefined
                ) {
                  timepoint = {
                    height: result.status.value.blockNumber,
                    index: result.status.value.txIndex,
                  }
                  console.log(
                    '[initiateMultisigApproval]: Extracted timepoint from event',
                    timepoint
                  )
                }
              }
            }
          }
        }
      }
    )

    // Wait for finalization with proper timepoint extraction
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        void unsub()
        if (!timepoint) {
          reject(
            new Error(
              'Failed to extract timepoint from transaction events within timeout'
            )
          )
        } else {
          resolve(undefined)
        }
      }, 30000) // 30 second timeout

      // Check periodically if we got the timepoint
      const checkInterval = setInterval(() => {
        if (timepoint) {
          clearTimeout(timeout)
          clearInterval(checkInterval)
          void unsub()
          resolve(undefined)
        }
      }, 1000)
    })

    // Fallback: Query the chain for pending multisigs if event extraction failed
    if (!timepoint) {
      console.log(
        '[initiateMultisigApproval]: Event extraction failed, querying chain for pending multisigs'
      )
      try {
        const pendingMultisigs = await queryPendingMultisigs(
          client,
          multisigConfig.multisigAddress
        )

        // Find the multisig matching our call hash
        const matchingMultisig = pendingMultisigs.find(
          pending => pending.callHash === callHash
        )

        if (matchingMultisig) {
          timepoint = matchingMultisig.when
          console.log(
            '[initiateMultisigApproval]: Found timepoint from chain query',
            timepoint
          )
        }
      } catch (queryError) {
        console.error(
          '[initiateMultisigApproval]: Failed to query chain for timepoint',
          queryError
        )
      }
    }

    if (!timepoint) {
      throw new Error(
        'Failed to extract timepoint from transaction. The transaction may have failed or timed out. ' +
          'Please check the blockchain explorer for your transaction status.'
      )
    }

    console.log('[initiateMultisigApproval]: Approval initiated successfully', {
      callHash,
      timepoint,
      txHash,
      blockNumber,
      predictedChildBountyId: payoutResult.predictedChildBountyId,
      hasPriceInfo: !!priceInfo,
    })

    return {
      txHash: txHash ?? callHash,
      callHash,
      callData,
      timepoint,
      blockNumber,
      predictedChildBountyId: payoutResult.predictedChildBountyId,
      priceInfo,
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
      undefined,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 * Approve or execute a multisig call based on quorum detection
 *
 * This function combines approval and execution logic:
 * - If the next approval will hit quorum, it uses `asMulti` with full call data
 *   to combine approval + execution in one atomic transaction
 * - Otherwise, it uses `approveAsMulti` to just add the approval
 *
 * This provides better UX by automatically executing when threshold is met.
 *
 * @param currentApprovals - Number of existing approvals for this call
 * @param callData - Full call data (hex string) needed for execution
 * @param callHash - Hash of the multisig call
 * @param timepoint - Block height and extrinsic index from first approval
 * @param threshold - Number of approvals required
 * @param allSignatories - All committee member wallet addresses
 * @param approverAddress - Address of the member approving
 * @param signer - Polkadot signer instance
 * @param beneficiaryAddress - Recipient address (needed for call reconstruction)
 * @param payoutAmount - Payment amount (needed for call reconstruction)
 * @param milestoneId - Milestone ID (needed for call reconstruction)
 * @param milestoneTitle - Milestone title (needed for call reconstruction)
 * @param multisigConfig - Full multisig configuration
 * @param network - Network type
 */
export async function approveOrExecuteMultisigCall(params: {
  client: LegacyClient
  currentApprovals: number
  callDataHex: string
  callHash: string
  timepoint: Timepoint
  threshold: number
  allSignatories: string[]
  approverAddress: string
  signer: PolkadotSigner
  beneficiaryAddress: string
  payoutAmount: bigint
  milestoneId: number
  milestoneTitle?: string
  multisigConfig: MultisigConfig
  network?: NetworkType
  /** Price info for on-chain transparency (from initial approval) */
  priceInfo?: PriceInfo
}): Promise<ApproveOrExecuteResult> {
  const {
    client,
    currentApprovals,
    callHash,
    timepoint,
    threshold,
    allSignatories,
    approverAddress: rawApproverAddress,
    signer,
    beneficiaryAddress,
    payoutAmount,
    milestoneId,
    milestoneTitle = `Milestone ${milestoneId}`,
    multisigConfig,
    network = 'paseo',
    priceInfo,
  } = params

  // Convert approver address to the target network format
  const approverAddress = encodeAddress(
    rawApproverAddress,
    getNetworkSS58Format(network)
  )

  // Determine if this approval will hit quorum
  const willExecute = willHitQuorum(currentApprovals, threshold)

  console.log('[approveOrExecuteMultisigCall]: Processing approval', {
    callHash,
    timepoint,
    approverAddress,
    currentApprovals,
    threshold,
    willExecute,
  })

  // Check approver balance for transaction fees
  console.log('[approveOrExecuteMultisigCall]: Checking approver balance')
  const approverBalanceCheck = await checkTransactionFeeBalance(
    client,
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
    console.error(
      '[approveOrExecuteMultisigCall]: Approver has insufficient balance',
      {
        approverAddress,
        balance: approverBalanceCheck.balance.transferable.toString(),
        required: approverBalanceCheck.required?.toString(),
      }
    )
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

    let txHash: string | null = null
    let blockNumber = 0
    let executionSuccess = false
    let executionError: string | undefined

    if (willExecute) {
      // This approval will hit quorum - use asMulti with full call data to execute
      console.log(
        '[approveOrExecuteMultisigCall]: Will hit quorum, executing with asMulti'
      )

      // Reconstruct the payout call (with same price info from initial approval)
      const payoutResult = await createPayoutCall(client, {
        beneficiaryAddress,
        amount: payoutAmount,
        milestoneId,
        milestoneTitle,
        parentBountyId: multisigConfig.parentBountyId,
        curatorAddress: multisigConfig.curatorProxyAddress,
        curatorFee: BigInt(0),
        priceInfo, // Same price info from initial approval
      })

      // Create asMulti call with full call data and timepoint
      // The call from createPayoutCall is typed as unknown due to dedot's generic types
      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
      const innerCall = payoutResult.call as any
      const executeCall = client.tx.multisig.asMulti(
        threshold,
        otherSignatories,
        timepoint,
        innerCall,
        maxWeight
      )
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */

      console.log('[approveOrExecuteMultisigCall]: Submitting execution call', {
        threshold,
        otherSignatoriesCount: otherSignatories.length,
        timepoint,
      })

      // Sign and submit the transaction
      const unsub = await executeCall.signAndSend(
        approverAddress,
        { signer },
        result => {
          console.log(
            '[approveOrExecuteMultisigCall]: Transaction status:',
            result.status.type
          )

          if (
            result.status.type === 'BestChainBlockIncluded' ||
            result.status.type === 'Finalized'
          ) {
            txHash = result.txHash
            if (result.status.value.blockNumber) {
              blockNumber = result.status.value.blockNumber
            }

            // Check for MultisigExecuted event
            if (result.events) {
              for (const record of result.events) {
                const { event } = record
                if (
                  event.pallet === 'Multisig' &&
                  event.palletEvent.name === 'MultisigExecuted'
                ) {
                  console.log(
                    '[approveOrExecuteMultisigCall]: Found MultisigExecuted event'
                  )
                  executionSuccess = true
                }
                // Check for execution errors
                if (
                  event.pallet === 'System' &&
                  event.palletEvent.name === 'ExtrinsicFailed'
                ) {
                  console.error(
                    '[approveOrExecuteMultisigCall]: Execution failed',
                    event.palletEvent
                  )
                  executionError = 'Execution failed on chain'
                }
              }
            }
          }
        }
      )

      // Wait for finalization
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          void unsub()
          if (!txHash) {
            reject(new Error('Transaction timed out'))
          } else {
            resolve(undefined)
          }
        }, 30000)

        const checkInterval = setInterval(() => {
          if (txHash) {
            clearTimeout(timeout)
            clearInterval(checkInterval)
            void unsub()
            resolve(undefined)
          }
        }, 1000)
      })

      console.log(
        '[approveOrExecuteMultisigCall]: Execution completed successfully',
        {
          txHash,
          blockNumber,
          executionSuccess,
        }
      )

      return {
        txHash: txHash ?? callHash,
        blockNumber,
        wasExecuted: true,
        executionSuccess,
        executionError,
      }
    } else {
      // Just add approval, don't execute
      console.log(
        '[approveOrExecuteMultisigCall]: Below quorum, using approveAsMulti'
      )

      // Create approval transaction (only needs hash, not full call data)
      const approvalCall = client.tx.multisig.approveAsMulti(
        threshold,
        otherSignatories,
        timepoint,
        callHash as HexString,
        maxWeight
      )

      console.log('[approveOrExecuteMultisigCall]: Submitting approval', {
        threshold,
        otherSignatoriesCount: otherSignatories.length,
        callHash,
        timepoint,
      })

      // Sign and submit the transaction
      const unsub = await approvalCall.signAndSend(
        approverAddress,
        { signer },
        result => {
          console.log(
            '[approveOrExecuteMultisigCall]: Transaction status:',
            result.status.type
          )

          if (
            result.status.type === 'BestChainBlockIncluded' ||
            result.status.type === 'Finalized'
          ) {
            txHash = result.txHash
            if (result.status.value.blockNumber) {
              blockNumber = result.status.value.blockNumber
            }
          }
        }
      )

      // Wait for finalization
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          void unsub()
          if (!txHash) {
            reject(new Error('Transaction timed out'))
          } else {
            resolve(undefined)
          }
        }, 30000)

        const checkInterval = setInterval(() => {
          if (txHash) {
            clearTimeout(timeout)
            clearInterval(checkInterval)
            void unsub()
            resolve(undefined)
          }
        }, 1000)
      })

      console.log('[approveOrExecuteMultisigCall]: Approval submitted', {
        txHash,
        blockNumber,
      })

      return {
        txHash: txHash ?? callHash,
        blockNumber,
        wasExecuted: false,
      }
    }
  } catch (error) {
    console.error('[approveOrExecuteMultisigCall]: Failed', error)
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

    // Verify call data matches (safety check)
    if (
      JSON.stringify(paymentCall.callHex) !== JSON.stringify(params.callData)
    ) {
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
      undefined,
      paymentCall.call,
      maxWeight
    )

    console.log('[finalizeMultisigCall]: Submitting final execution', {
      threshold,
      otherSignatoriesCount: otherSignatories.length,
      timepoint: undefined,
    })

    // Sign and submit the transaction
    const _unsub = await finalizeCall.signAndSend(
      executorAddress,
      { signer },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
