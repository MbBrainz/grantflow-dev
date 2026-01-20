/**
 * Blockchain Error Handling System
 *
 * This module provides comprehensive error parsing, categorization, and
 * user-friendly message generation for blockchain transaction errors.
 *
 * Design principles:
 * - Parse raw error messages into structured, actionable information
 * - Categorize errors by type for appropriate UI handling
 * - Provide both user-friendly messages and technical details
 * - Support multiple blockchain networks (Polkadot, Paseo, etc.)
 * - Extensible for new error types
 */

export type BlockchainErrorCategory =
  | 'insufficient_balance'
  | 'bounty_not_active'
  | 'bounty_insufficient_funds'
  | 'invalid_signatory'
  | 'already_approved'
  | 'threshold_not_met'
  | 'timepoint_invalid'
  | 'transaction_timeout'
  | 'network_error'
  | 'wasm_error'
  | 'user_rejected'
  | 'call_data_mismatch'
  | 'permission_denied'
  | 'simulation_failed'
  | 'child_bounty_workflow_error'
  | 'unknown'

export type ErrorSeverity = 'error' | 'warning' | 'info'

export interface BlockchainErrorContext {
  // Bounty-related context
  parentBountyId?: number
  childBountyId?: number
  bountyStatus?: string
  bountyValue?: string
  payoutRequired?: string

  // Account-related context
  accountAddress?: string
  requiredBalance?: string
  currentBalance?: string

  // Network context
  network?: string
  blockNumber?: number

  // Transaction context
  txHash?: string
  callHash?: string

  // Multisig context
  threshold?: number
  currentApprovals?: number
  signatories?: string[]
}

export interface ParsedBlockchainError {
  /** Error category for programmatic handling */
  category: BlockchainErrorCategory

  /** Severity level for UI styling */
  severity: ErrorSeverity

  /** Short, user-friendly title */
  title: string

  /** Detailed explanation of what went wrong */
  description: string

  /** Actionable steps the user can take to resolve */
  actionItems: string[]

  /** Extracted context from the error message */
  context: BlockchainErrorContext

  /** Original error message for debugging */
  originalMessage: string

  /** Optional link for more information */
  helpLink?: string
}

/**
 * Error patterns for detection and parsing
 */
const ERROR_PATTERNS = {
  // Bounty status errors
  bountyNotActive: /Parent bounty (\d+) is not active \(status: (\w+)\)/i,
  bountyInsufficientFunds:
    /Insufficient funds in parent bounty.*Parent Bounty ID: (\d+).*Bounty Value: ([\d.]+).*Payout Required: ([\d.]+)/is,

  // Balance errors
  insufficientBalance: /insufficient balance|not enough funds|balance too low/i,
  insufficientBalanceDetailed:
    /Current balance: ([\d.]+).*Required: ([\d.]+)/is,

  // Wasm/validation errors
  wasmTrap: /wasm trap|unreachable/i,

  // Signatory errors
  invalidSignatory:
    /not a signatory|wallet address is not a signatory|invalid signatory/i,
  alreadyApproved: /already approved|duplicate approval|already voted/i,

  // Timepoint errors
  invalidTimepoint: /invalid.*timepoint|timepoint.*invalid|missing timepoint/i,

  // Transaction errors
  transactionTimeout: /timeout|timed out|failed to extract timepoint/i,

  // User actions (also catches wallet errors that appear as "Cancelled")
  userRejected: /user rejected|cancelled by user|denied by user/i,
  walletCancelled: /^Cancelled$/i,

  // Network errors
  networkError: /network error|connection failed|disconnected/i,

  // Permission errors
  permissionDenied:
    /not authorized|unauthorized|permission denied|access denied/i,

  // Simulation errors
  simulationFailed: /transaction simulation failed|simulation failed/i,
  childBountyWorkflowError:
    /proposeCurator and acceptCurator|curator state dependency|child bounty workflow/i,
}

/**
 * Parse a raw error message or Error object into a structured blockchain error
 */
export function parseBlockchainError(
  error: unknown,
  additionalContext?: Partial<BlockchainErrorContext>
): ParsedBlockchainError {
  const errorMessage =
    error instanceof Error ? error.message : String(error ?? 'Unknown error')

  // Default error structure
  const baseError: ParsedBlockchainError = {
    category: 'unknown',
    severity: 'error',
    title: 'Transaction Failed',
    description:
      'An unexpected error occurred during the blockchain transaction.',
    actionItems: [
      'Please try again later',
      'If the problem persists, contact support',
    ],
    context: { ...additionalContext },
    originalMessage: errorMessage,
  }

  // Try to match specific error patterns
  const parsedError = matchErrorPattern(
    errorMessage,
    baseError,
    additionalContext
  )

  return parsedError
}

/**
 * Match error message against known patterns and extract context
 */
function matchErrorPattern(
  message: string,
  baseError: ParsedBlockchainError,
  additionalContext?: Partial<BlockchainErrorContext>
): ParsedBlockchainError {
  // Check for bounty not active error
  const bountyNotActiveMatch = message.match(ERROR_PATTERNS.bountyNotActive)
  if (bountyNotActiveMatch) {
    const [, bountyId, status] = bountyNotActiveMatch
    return {
      ...baseError,
      category: 'bounty_not_active',
      severity: 'error',
      title: 'Parent Bounty Not Active',
      description: `The parent bounty (ID: ${bountyId}) is currently in "${status}" status and cannot process payments. The bounty must be in "Active" status with a curator assigned.`,
      actionItems: [
        'Wait for the bounty to become active',
        'Contact the treasury or council to activate the bounty',
        'Ensure the bounty has been funded by the treasury',
        'Verify the curator has been assigned and accepted',
      ],
      context: {
        ...additionalContext,
        parentBountyId: parseInt(bountyId, 10),
        bountyStatus: status,
      },
      helpLink: 'https://wiki.polkadot.network/docs/learn-treasury#bounties',
    }
  }

  // Check for bounty insufficient funds error
  const bountyFundsMatch = message.match(ERROR_PATTERNS.bountyInsufficientFunds)
  if (
    bountyFundsMatch ||
    message.includes('Insufficient funds in parent bounty')
  ) {
    // Extract values from multiline error message
    const bountyIdMatch = message.match(/Parent Bounty ID: (\d+)/i)
    const bountyValueMatch = message.match(/Bounty Value: ([\d.]+)/i)
    const payoutMatch = message.match(/Payout Required: ([\d.]+)/i)

    return {
      ...baseError,
      category: 'bounty_insufficient_funds',
      severity: 'error',
      title: 'Insufficient Bounty Funds',
      description: `The parent bounty does not have enough funds allocated to cover this payout. The bounty needs additional funding from the treasury.`,
      actionItems: [
        'Check the current balance of the parent bounty',
        'Request additional funding through a treasury proposal',
        'Consider reducing the milestone payout amount',
        'Contact the committee or council for assistance',
      ],
      context: {
        ...additionalContext,
        parentBountyId: bountyIdMatch
          ? parseInt(bountyIdMatch[1], 10)
          : undefined,
        bountyValue: bountyValueMatch?.[1],
        payoutRequired: payoutMatch?.[1],
      },
    }
  }

  // Check for wasm trap errors (common on testnets)
  if (ERROR_PATTERNS.wasmTrap.test(message)) {
    const network = additionalContext?.network ?? 'paseo'
    const faucetUrl =
      network === 'paseo'
        ? 'https://faucet.polkadot.io/paseo'
        : 'https://faucet.polkadot.io/'

    return {
      ...baseError,
      category: 'wasm_error',
      severity: 'error',
      title: 'Transaction Validation Failed',
      description:
        'The transaction failed blockchain validation. This typically indicates an issue with account balances, permissions, or the current state of the blockchain.',
      actionItems: [
        `Ensure your account has sufficient ${network.toUpperCase()} tokens for gas fees`,
        `Get testnet tokens from the faucet: ${faucetUrl}`,
        'Verify you are connected to the correct network',
        'Check that all multisig signatories are valid addresses',
        'Try refreshing and attempting the transaction again',
      ],
      context: {
        ...additionalContext,
        network,
      },
      helpLink: faucetUrl,
    }
  }

  // Check for insufficient balance errors
  if (ERROR_PATTERNS.insufficientBalance.test(message)) {
    const balanceMatch = message.match(
      ERROR_PATTERNS.insufficientBalanceDetailed
    )
    const network = additionalContext?.network ?? 'paseo'

    return {
      ...baseError,
      category: 'insufficient_balance',
      severity: 'error',
      title: 'Insufficient Balance',
      description:
        'Your account does not have enough tokens to cover the transaction fees.',
      actionItems: [
        `Add more ${network.toUpperCase()} tokens to your wallet`,
        network === 'paseo'
          ? 'Get testnet tokens from: https://faucet.polkadot.io/paseo'
          : 'Transfer tokens to your connected wallet',
        'Ensure you have enough for gas fees (typically 0.1-0.5 tokens)',
      ],
      context: {
        ...additionalContext,
        currentBalance: balanceMatch?.[1],
        requiredBalance: balanceMatch?.[2],
        network,
      },
      helpLink:
        network === 'paseo' ? 'https://faucet.polkadot.io/paseo' : undefined,
    }
  }

  // Check for invalid signatory
  if (ERROR_PATTERNS.invalidSignatory.test(message)) {
    return {
      ...baseError,
      category: 'invalid_signatory',
      severity: 'error',
      title: 'Invalid Signatory',
      description:
        'Your wallet address is not registered as a signatory for this committee multisig wallet.',
      actionItems: [
        'Verify you are connected with the correct wallet',
        'Contact the committee administrator to add your address',
        'Check if you are using the correct network (mainnet vs testnet)',
      ],
      context: { ...additionalContext },
    }
  }

  // Check for already approved
  if (ERROR_PATTERNS.alreadyApproved.test(message)) {
    return {
      ...baseError,
      category: 'already_approved',
      severity: 'warning',
      title: 'Already Approved',
      description:
        'You have already submitted your approval for this transaction.',
      actionItems: [
        'Wait for other signatories to approve',
        'Check the approval status in the milestone panel',
        'No further action is required from you',
      ],
      context: { ...additionalContext },
    }
  }

  // Check for invalid timepoint
  if (ERROR_PATTERNS.invalidTimepoint.test(message)) {
    return {
      ...baseError,
      category: 'timepoint_invalid',
      severity: 'error',
      title: 'Invalid Transaction Timepoint',
      description:
        'The multisig timepoint is missing or invalid. This can happen if the initial transaction was not properly recorded.',
      actionItems: [
        'Ask the initial signer to retry creating the transaction',
        'Check if the original transaction was confirmed on-chain',
        'The approval process may need to be restarted',
      ],
      context: { ...additionalContext },
    }
  }

  // Check for transaction timeout
  if (ERROR_PATTERNS.transactionTimeout.test(message)) {
    return {
      ...baseError,
      category: 'transaction_timeout',
      severity: 'error',
      title: 'Transaction Timeout',
      description:
        'The transaction took too long to confirm. This could be due to network congestion or the transaction being dropped.',
      actionItems: [
        'Check the blockchain explorer to verify transaction status',
        'Wait a few minutes and try again',
        'Ensure you have a stable internet connection',
        'Try refreshing the page and reconnecting your wallet',
      ],
      context: { ...additionalContext },
    }
  }

  // Check for user rejected
  if (ERROR_PATTERNS.userRejected.test(message)) {
    return {
      ...baseError,
      category: 'user_rejected',
      severity: 'warning',
      title: 'Transaction Cancelled',
      description: 'You cancelled the transaction in your wallet.',
      actionItems: [
        'Click "Sign & Submit" to try again',
        'Approve the transaction when your wallet prompts you',
      ],
      context: { ...additionalContext },
    }
  }

  // Check for wallet "Cancelled" error (often indicates wallet-side validation failure)
  if (ERROR_PATTERNS.walletCancelled.test(message.trim())) {
    return {
      ...baseError,
      category: 'wasm_error', // Using wasm_error since this usually indicates validation failure
      severity: 'error',
      title: 'Transaction Rejected by Wallet',
      description:
        'Your wallet rejected the transaction. This usually happens when:\n' +
        '• The transaction payload failed validation\n' +
        '• The transaction would fail on-chain (detected by wallet pre-check)\n' +
        '• There was an issue with the transaction encoding\n\n' +
        'Check the browser console for detailed simulation logs.',
      actionItems: [
        'Check the browser console (F12 → Console tab) for detailed error information',
        'Look for "TRANSACTION SIMULATION RESULT" in the console for specifics',
        'Verify you have sufficient tokens for transaction fees',
        'Ensure the parent bounty has enough funds for the payout',
        'Try refreshing the page and reconnecting your wallet',
      ],
      context: { ...additionalContext },
    }
  }

  // Check for network errors
  if (ERROR_PATTERNS.networkError.test(message)) {
    return {
      ...baseError,
      category: 'network_error',
      severity: 'error',
      title: 'Network Connection Error',
      description:
        'Unable to connect to the blockchain network. Please check your internet connection.',
      actionItems: [
        'Check your internet connection',
        'Try refreshing the page',
        'The network may be experiencing issues - try again later',
        'Try switching to a different RPC endpoint',
      ],
      context: { ...additionalContext },
    }
  }

  // Check for permission denied
  if (ERROR_PATTERNS.permissionDenied.test(message)) {
    return {
      ...baseError,
      category: 'permission_denied',
      severity: 'error',
      title: 'Permission Denied',
      description: 'You do not have permission to perform this action.',
      actionItems: [
        'Verify you are a committee member with signing rights',
        'Contact the committee administrator',
        'Ensure your wallet is properly connected',
      ],
      context: { ...additionalContext },
    }
  }

  // Check for child bounty workflow errors
  if (ERROR_PATTERNS.childBountyWorkflowError.test(message)) {
    return {
      ...baseError,
      category: 'child_bounty_workflow_error',
      severity: 'error',
      title: 'Child Bounty Workflow Error',
      description:
        'The child bounty transaction bundle contains operations that cannot be executed in a single transaction. ' +
        'This is a known limitation of the Polkadot childBounties pallet.',
      actionItems: [
        'This is a system configuration issue - please contact the development team',
        'The child bounty workflow needs to be split into multiple transactions',
        'Workaround: Manual execution through polkadot.js apps may be required',
      ],
      context: { ...additionalContext },
      helpLink: 'https://wiki.polkadot.network/docs/learn-treasury#bounties',
    }
  }

  // Check for general simulation failures
  if (
    ERROR_PATTERNS.simulationFailed.test(message) ||
    message.includes('Transaction Will Fail')
  ) {
    // Extract suggestions from the error message if present
    const suggestionsMatch = message.match(/Suggestions:\n([\s\S]*?)(?:\n\n|$)/)
    const suggestions = suggestionsMatch
      ? suggestionsMatch[1]
          .split('\n')
          .map(s => s.replace(/^[•-]\s*/, '').trim())
          .filter(Boolean)
      : []

    return {
      ...baseError,
      category: 'simulation_failed',
      severity: 'error',
      title: 'Transaction Simulation Failed',
      description:
        'Pre-flight simulation detected that this transaction will likely fail. ' +
        'Review the details below to understand why.',
      actionItems:
        suggestions.length > 0
          ? suggestions
          : [
              'Review the transaction parameters',
              'Check account balances and permissions',
              'Try refreshing and attempting again',
              'Contact support if the problem persists',
            ],
      context: { ...additionalContext },
    }
  }

  // No specific pattern matched - return enhanced unknown error
  return {
    ...baseError,
    description: cleanErrorMessage(message),
    actionItems: [
      'Review the error details below',
      'Try the transaction again',
      'If the problem persists, contact support with the error details',
    ],
  }
}

/**
 * Clean up raw error messages for display
 * - Remove stack traces
 * - Format multiline messages
 * - Truncate extremely long messages
 */
function cleanErrorMessage(message: string): string {
  // Remove stack traces
  const withoutStack = message.split('\n    at ')[0]

  // Clean up common prefixes
  const cleaned = withoutStack
    .replace(/^Error:\s*/i, '')
    .replace(/^Uncaught\s*/i, '')
    .trim()

  // Truncate if too long but preserve newlines for readability
  if (cleaned.length > 500) {
    return `${cleaned.substring(0, 500)}...`
  }

  return cleaned
}

/**
 * Get a short summary suitable for toast notifications
 */
export function getErrorSummary(error: ParsedBlockchainError): string {
  // Return first action item as a quick hint
  const firstAction = error.actionItems[0]
  if (firstAction && firstAction.length < 80) {
    return firstAction
  }

  // Otherwise return truncated description
  return error.description.length > 100
    ? `${error.description.substring(0, 100)}...`
    : error.description
}

/**
 * Check if an error is likely recoverable through retry
 */
export function isRetryableError(error: ParsedBlockchainError): boolean {
  const retryableCategories: BlockchainErrorCategory[] = [
    'transaction_timeout',
    'network_error',
    'user_rejected',
  ]
  return retryableCategories.includes(error.category)
}

/**
 * Check if error requires user action to resolve
 */
export function requiresUserAction(error: ParsedBlockchainError): boolean {
  const actionRequiredCategories: BlockchainErrorCategory[] = [
    'insufficient_balance',
    'bounty_not_active',
    'bounty_insufficient_funds',
    'invalid_signatory',
    'permission_denied',
  ]
  return actionRequiredCategories.includes(error.category)
}

/**
 * Get icon name suggestion for the error category
 */
export function getErrorIconName(category: BlockchainErrorCategory): string {
  const iconMap: Record<BlockchainErrorCategory, string> = {
    insufficient_balance: 'Wallet',
    bounty_not_active: 'Clock',
    bounty_insufficient_funds: 'Banknote',
    invalid_signatory: 'UserX',
    already_approved: 'CheckCircle',
    threshold_not_met: 'Users',
    timepoint_invalid: 'Timer',
    transaction_timeout: 'TimerOff',
    network_error: 'WifiOff',
    wasm_error: 'AlertTriangle',
    user_rejected: 'XCircle',
    call_data_mismatch: 'FileWarning',
    permission_denied: 'ShieldX',
    simulation_failed: 'FlaskConical',
    child_bounty_workflow_error: 'GitBranchPlus',
    unknown: 'AlertCircle',
  }
  return iconMap[category]
}
