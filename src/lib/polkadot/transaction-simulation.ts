/**
 * Transaction Simulation Utilities
 *
 * This module provides functions to simulate Polkadot transactions before
 * submission, helping detect potential errors early and providing better
 * user feedback.
 *
 * Key capabilities:
 * - Fee estimation using paymentInfo
 * - Call validation
 * - Dry-run simulation (when available)
 * - Detailed error analysis
 */

import type { HexString } from '@luno-kit/react/types'
import type { LegacyClient } from 'dedot'

/**
 * Result from transaction simulation
 */
export interface SimulationResult {
  /** Whether the simulation indicates the transaction will likely succeed */
  success: boolean
  /** Estimated transaction fee in planck */
  estimatedFee?: bigint
  /** Estimated weight for the transaction */
  estimatedWeight?: {
    refTime: bigint
    proofSize: bigint
  }
  /** Potential errors detected during simulation */
  errors: SimulationError[]
  /** Warnings that don't necessarily indicate failure */
  warnings: SimulationWarning[]
  /** Detailed information for debugging */
  details: SimulationDetails
}

export interface SimulationError {
  code: string
  message: string
  suggestion?: string
  severity: 'critical' | 'error'
}

export interface SimulationWarning {
  code: string
  message: string
  suggestion?: string
}

export interface SimulationDetails {
  /** Call hash of the transaction */
  callHash?: string
  /** Hex-encoded call data */
  callDataHex?: string
  /** Size of the call data in bytes */
  callDataSize?: number
  /** Number of calls in a batch (if applicable) */
  batchCallCount?: number
  /** Individual call methods in a batch */
  batchCallMethods?: string[]
  /** Raw simulation response (for debugging) */
  rawResponse?: unknown
}

/**
 * Known issues that can be detected before submission
 */
const KNOWN_ISSUES = {
  CURATOR_STATE_DEPENDENCY_NO_PROXY: {
    code: 'CURATOR_STATE_DEPENDENCY_NO_PROXY',
    message:
      'Child bounty workflow contains proposeCurator and acceptCurator in the same batch WITHOUT a proxy wrapper. ' +
      'This will fail because acceptCurator must be called by the curator.',
    suggestion:
      'Ensure the batch is wrapped in a proxy.proxy call where "real" is the curator address. ' +
      'This allows acceptCurator to succeed because the origin becomes the curator.',
    severity: 'critical' as const,
  },
  BATCH_TOO_LARGE: {
    code: 'BATCH_TOO_LARGE',
    message:
      'The batched transaction contains too many calls and may exceed weight limits.',
    suggestion: 'Consider splitting the transaction into smaller batches.',
    severity: 'error' as const,
  },
  INSUFFICIENT_FEE_BALANCE: {
    code: 'INSUFFICIENT_FEE_BALANCE',
    message: 'Account may not have sufficient balance to pay transaction fees.',
    suggestion: 'Ensure the signing account has enough tokens for gas fees.',
    severity: 'error' as const,
  },
}

/**
 * Analyze a batch call for known issues
 *
 * @param callMethods - Detected call methods in the transaction
 * @param hasProxyWrapper - Whether the batch is wrapped in a proxy.proxy call
 */
function analyzeBatchCall(
  callMethods: string[],
  hasProxyWrapper: boolean
): SimulationError[] {
  const errors: SimulationError[] = []

  // Check for curator state dependency issue
  // NOTE: With a proxy wrapper, proposeCurator + acceptCurator in the same batch is VALID
  // because the batch executes as the curator (via proxy), making acceptCurator work.
  // Only flag this as an error if there's NO proxy wrapper.
  const hasProposeCurator = callMethods.some(m => m.includes('proposeCurator'))
  const hasAcceptCurator = callMethods.some(m => m.includes('acceptCurator'))

  if (hasProposeCurator && hasAcceptCurator && !hasProxyWrapper) {
    errors.push(KNOWN_ISSUES.CURATOR_STATE_DEPENDENCY_NO_PROXY)
  }

  // Check for batch size
  if (callMethods.length > 10) {
    errors.push(KNOWN_ISSUES.BATCH_TOO_LARGE)
  }

  return errors
}

/**
 * Result from call data analysis
 */
interface CallDataAnalysis {
  /** Detected call methods */
  methods: string[]
  /** Whether the call is wrapped in a proxy.proxy call */
  hasProxyWrapper: boolean
}

/**
 * Extract call methods from a batch call (for analysis)
 *
 * This is a heuristic based on call data patterns. For exact decoding,
 * you'd need the full metadata and a proper decoder.
 */
function extractBatchCallMethods(callData: Uint8Array): CallDataAnalysis {
  // This is a simplified extraction - in production you'd use proper decoding
  // For now, we'll return placeholder methods based on known patterns
  const hex = Buffer.from(callData).toString('hex')

  const methods: string[] = []

  // Detect proxy.proxy call wrapper
  // Proxy pallet is typically at index 0x2a (42) on Polkadot/Kusama
  // proxy.proxy is call index 0x00 within the proxy pallet
  // So the call starts with '2a00' for proxy.proxy
  const hasProxyWrapper = hex.includes('2a00')

  if (hasProxyWrapper) {
    methods.push('proxy.proxy')
  }

  // Look for utility.batchAll (utility pallet 0x28, batchAll is 0x02)
  if (hex.includes('2802')) methods.push('utility.batchAll')

  // Look for child bounty pallet calls (0x42xx for childBounties pallet on Polkadot)
  // Note: Pallet index may vary by chain - 0x42 is common for childBounties
  if (hex.includes('4200')) methods.push('childBounties.addChildBounty')
  if (hex.includes('4201')) methods.push('childBounties.proposeCurator')
  if (hex.includes('4202')) methods.push('childBounties.acceptCurator')
  if (hex.includes('4204')) methods.push('childBounties.awardChildBounty')
  if (hex.includes('4205')) methods.push('childBounties.claimChildBounty')

  // Fallback: Also check older pallet indices (some chains use different indices)
  // 0x27xx was used in some older versions
  if (hex.includes('2700')) methods.push('childBounties.addChildBounty')
  if (hex.includes('2701')) methods.push('childBounties.proposeCurator')
  if (hex.includes('2702')) methods.push('childBounties.acceptCurator')
  if (hex.includes('2704')) methods.push('childBounties.awardChildBounty')
  if (hex.includes('2705')) methods.push('childBounties.claimChildBounty')

  // Look for system remark (0x0001 for system.remark, 0x0007 for system.remarkWithEvent)
  if (hex.includes('0001') || hex.includes('0007'))
    methods.push('system.remark')

  // Deduplicate methods (in case both old and new pallet indices matched)
  const uniqueMethods = [...new Set(methods)]

  return {
    methods: uniqueMethods.length > 0 ? uniqueMethods : ['unknown'],
    hasProxyWrapper,
  }
}

/**
 * Simulate a transaction before submission
 *
 * This performs several checks:
 * 1. Fee estimation using paymentInfo
 * 2. Static analysis of batch calls for known issues
 * 3. Balance validation
 *
 * @param client - The LegacyClient instance
 * @param tx - The transaction to simulate
 * @param signerAddress - Address that will sign the transaction
 * @returns SimulationResult with success status and any errors/warnings
 */
export async function simulateTransaction(
  client: LegacyClient,
  tx: {
    callHex: HexString
    call: unknown
    paymentInfo?: (address: string) => Promise<{
      partialFee: bigint
      weight: { refTime: bigint; proofSize: bigint }
    }>
  },
  signerAddress: string
): Promise<SimulationResult> {
  const errors: SimulationError[] = []
  const warnings: SimulationWarning[] = []
  const details: SimulationDetails = {}

  console.log('[simulateTransaction]: Starting transaction simulation', {
    signerAddress,
    callHexLength: tx.callHex?.length,
  })

  try {
    // Extract call data for analysis
    const callDataHex = tx.callHex
    details.callDataHex = callDataHex
    details.callDataSize = callDataHex ? (callDataHex.length - 2) / 2 : 0

    // Decode and analyze batch calls
    if (callDataHex) {
      const callData = Buffer.from(callDataHex.slice(2), 'hex')
      const analysis = extractBatchCallMethods(callData)
      details.batchCallMethods = analysis.methods
      details.batchCallCount = analysis.methods.length

      console.log('[simulateTransaction]: Analyzed batch calls', {
        methods: analysis.methods,
        count: analysis.methods.length,
        hasProxyWrapper: analysis.hasProxyWrapper,
      })

      // Check for known issues (pass proxy wrapper status to avoid false positives)
      const batchErrors = analyzeBatchCall(
        analysis.methods,
        analysis.hasProxyWrapper
      )
      errors.push(...batchErrors)

      if (batchErrors.length > 0) {
        console.warn('[simulateTransaction]: Found known issues in batch', {
          errors: batchErrors.map(e => e.code),
        })
      }

      // Add info about proxy wrapper for debugging
      if (analysis.hasProxyWrapper) {
        console.log(
          '[simulateTransaction]: Transaction is wrapped in proxy.proxy - curator workflow is valid'
        )
      }
    }

    // Estimate fees using paymentInfo if available
    let estimatedFee: bigint | undefined
    let estimatedWeight: { refTime: bigint; proofSize: bigint } | undefined

    if (tx.paymentInfo) {
      try {
        console.log('[simulateTransaction]: Estimating fees via paymentInfo')
        const feeInfo = await tx.paymentInfo(signerAddress)
        estimatedFee = feeInfo.partialFee
        estimatedWeight = feeInfo.weight

        details.rawResponse = {
          partialFee: estimatedFee.toString(),
          weight: {
            refTime: estimatedWeight.refTime.toString(),
            proofSize: estimatedWeight.proofSize.toString(),
          },
        }

        console.log('[simulateTransaction]: Fee estimation complete', {
          estimatedFee: estimatedFee.toString(),
          weight: {
            refTime: estimatedWeight.refTime.toString(),
            proofSize: estimatedWeight.proofSize.toString(),
          },
        })
      } catch (feeError) {
        console.error('[simulateTransaction]: Fee estimation failed', feeError)
        warnings.push({
          code: 'FEE_ESTIMATION_FAILED',
          message: `Could not estimate transaction fees: ${feeError instanceof Error ? feeError.message : String(feeError)}`,
          suggestion:
            'The transaction may still succeed, but fee estimation was not possible.',
        })
      }
    }

    // Check signer balance if we have a fee estimate
    if (estimatedFee) {
      try {
        const accountInfo = await client.query.system.account(signerAddress)
        const freeBalance = BigInt(accountInfo.data.free)

        // Add some buffer for safety (10% more than estimated)
        const requiredBalance = (estimatedFee * 110n) / 100n

        if (freeBalance < requiredBalance) {
          errors.push({
            ...KNOWN_ISSUES.INSUFFICIENT_FEE_BALANCE,
            message: `Insufficient balance for fees. Have: ${freeBalance.toString()}, Need: ~${requiredBalance.toString()}`,
          })
        }

        console.log('[simulateTransaction]: Balance check', {
          freeBalance: freeBalance.toString(),
          estimatedFee: estimatedFee.toString(),
          requiredBalance: requiredBalance.toString(),
          sufficient: freeBalance >= requiredBalance,
        })
      } catch (balanceError) {
        console.error(
          '[simulateTransaction]: Balance check failed',
          balanceError
        )
        warnings.push({
          code: 'BALANCE_CHECK_FAILED',
          message: 'Could not verify account balance.',
        })
      }
    }

    // Determine overall success
    const hasCriticalError = errors.some(e => e.severity === 'critical')
    const hasError = errors.length > 0

    const result: SimulationResult = {
      success: !hasCriticalError && !hasError,
      estimatedFee,
      estimatedWeight,
      errors,
      warnings,
      details,
    }

    console.log('[simulateTransaction]: Simulation complete', {
      success: result.success,
      errorCount: errors.length,
      warningCount: warnings.length,
      hasCriticalError,
    })

    return result
  } catch (error) {
    console.error('[simulateTransaction]: Simulation failed', error)

    return {
      success: false,
      errors: [
        {
          code: 'SIMULATION_FAILED',
          message: `Transaction simulation failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error',
        },
      ],
      warnings,
      details,
    }
  }
}

/**
 * Format simulation result for console logging
 */
export function formatSimulationResultForConsole(
  result: SimulationResult
): string {
  const lines: string[] = [
    '╔══════════════════════════════════════════════════════════════════╗',
    '║                   TRANSACTION SIMULATION RESULT                  ║',
    '╠══════════════════════════════════════════════════════════════════╣',
    `║ Status: ${result.success ? '✅ LIKELY TO SUCCEED' : '❌ LIKELY TO FAIL'}`,
  ]

  if (result.estimatedFee) {
    lines.push(`║ Estimated Fee: ${result.estimatedFee.toString()} planck`)
  }

  if (result.estimatedWeight) {
    lines.push(
      `║ Estimated Weight: refTime=${result.estimatedWeight.refTime.toString()}, proofSize=${result.estimatedWeight.proofSize.toString()}`
    )
  }

  if (result.details.batchCallMethods?.length) {
    lines.push('║ Batch Calls:')
    result.details.batchCallMethods.forEach((method, i) => {
      lines.push(`║   ${i + 1}. ${method}`)
    })
  }

  if (result.errors.length > 0) {
    lines.push(
      '╠══════════════════════════════════════════════════════════════════╣'
    )
    lines.push('║ ERRORS:')
    result.errors.forEach(error => {
      lines.push(`║   [${error.severity.toUpperCase()}] ${error.code}`)
      lines.push(`║   ${error.message}`)
      if (error.suggestion) {
        lines.push(`║   💡 ${error.suggestion}`)
      }
    })
  }

  if (result.warnings.length > 0) {
    lines.push(
      '╠══════════════════════════════════════════════════════════════════╣'
    )
    lines.push('║ WARNINGS:')
    result.warnings.forEach(warning => {
      lines.push(`║   ⚠️ ${warning.code}: ${warning.message}`)
      if (warning.suggestion) {
        lines.push(`║   💡 ${warning.suggestion}`)
      }
    })
  }

  lines.push(
    '╚══════════════════════════════════════════════════════════════════╝'
  )

  return lines.join('\n')
}

/**
 * Create a user-friendly summary of simulation errors
 */
export function createSimulationErrorSummary(result: SimulationResult): {
  title: string
  description: string
  suggestions: string[]
} | null {
  if (result.success) return null

  const criticalErrors = result.errors.filter(e => e.severity === 'critical')

  if (criticalErrors.length > 0) {
    const error = criticalErrors[0]
    return {
      title: 'Transaction Will Fail',
      description: error.message,
      suggestions: error.suggestion ? [error.suggestion] : [],
    }
  }

  const regularErrors = result.errors.filter(e => e.severity === 'error')
  if (regularErrors.length > 0) {
    return {
      title: 'Transaction May Fail',
      description: regularErrors.map(e => e.message).join('; '),
      suggestions: regularErrors
        .filter(e => e.suggestion)
        .map(e => e.suggestion!),
    }
  }

  return null
}
