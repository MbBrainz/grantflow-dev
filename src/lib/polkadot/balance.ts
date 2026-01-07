/**
 * Polkadot Balance Utilities
 *
 * Provides functions to check account balances and validate sufficient funds
 * for transactions on Polkadot, Kusama, and Paseo networks.
 *
 * Now using LunoKit's LegacyClient (dedot) - client must be passed as parameter
 */

import type { LegacyClient } from 'dedot'
import type { NetworkType } from './address'

/**
 * Account balance information
 */
export interface AccountBalance {
  free: bigint
  reserved: bigint
  frozen: bigint
  total: bigint
  transferable: bigint
}

/**
 * Balance check result
 */
export interface BalanceCheckResult {
  hasBalance: boolean
  balance: AccountBalance
  required?: bigint
  shortfall?: bigint
  error?: string
}

/**
 * Minimum balance required for transaction fees (in Planck/smallest unit)
 *
 * Polkadot transaction fees typically range from 0.0001 to 0.001 DOT depending on:
 * - Base Fee: Minimum charge for processing
 * - Weight Fee: Computational resources required
 * - Length Fee: Transaction size in bytes
 * - Tip: Optional priority fee
 *
 * Multisig transactions are more complex and typically cost around 0.001-0.01 DOT.
 * We use a conservative estimate to ensure transactions succeed.
 *
 * Note: Fees are independent of the payout amount - they depend on computational
 * complexity, not the value being transferred.
 *
 * @see https://docs.polkadot.com/polkadot-protocol/parachain-basics/blocks-transactions-fees/fees/
 */
const MIN_TRANSACTION_FEE = BigInt(100_000_000) // 0.01 DOT (10^10 plancks = 1 DOT)

/**
 * Get account balance for a given address
 *
 * @param client - The LegacyClient instance from useApi()
 * @param address - The account address to check
 * @param network - The network to check on (for logging only, client determines actual network)
 * @returns Account balance information
 */
export async function getAccountBalance(
  client: LegacyClient,
  address: string,
  network: NetworkType
): Promise<AccountBalance> {
  console.log('[getAccountBalance]: Checking balance', { address, network })

  try {
    // Query account info from System pallet
    const accountInfo = await client.query.system.account(address)

    // Extract balance data
    const free = BigInt(accountInfo.data.free)
    const reserved = BigInt(accountInfo.data.reserved)
    const frozen = BigInt(accountInfo.data.frozen ?? 0)

    const total = free + reserved
    const transferable = free > frozen ? free - frozen : BigInt(0)

    console.log('[getAccountBalance]: Balance retrieved', {
      address,
      free: free.toString(),
      reserved: reserved.toString(),
      frozen: frozen.toString(),
      total: total.toString(),
      transferable: transferable.toString(),
    })

    return {
      free,
      reserved,
      frozen,
      total,
      transferable,
    }
  } catch (error) {
    console.error('[getAccountBalance]: Failed to get balance', {
      address,
      network,
      error,
    })
    throw new Error(
      `Failed to get balance for ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Check if an account has sufficient balance for transaction fees
 *
 * @param client - The LegacyClient instance from useApi()
 * @param address - The account address to check
 * @param network - The network to check on (for logging only)
 * @returns Balance check result
 */
export async function checkTransactionFeeBalance(
  client: LegacyClient,
  address: string,
  network: NetworkType = 'paseo'
): Promise<BalanceCheckResult> {
  try {
    const balance = await getAccountBalance(client, address, network)

    const hasBalance = balance.transferable >= MIN_TRANSACTION_FEE
    const shortfall = hasBalance
      ? BigInt(0)
      : MIN_TRANSACTION_FEE - balance.transferable

    return {
      hasBalance,
      balance,
      required: MIN_TRANSACTION_FEE,
      shortfall,
    }
  } catch (error) {
    return {
      hasBalance: false,
      balance: {
        free: BigInt(0),
        reserved: BigInt(0),
        frozen: BigInt(0),
        total: BigInt(0),
        transferable: BigInt(0),
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if a multisig account has sufficient balance for a payout
 *
 * @deprecated Use checkMultisigTransactionFeeBalance instead. Payout funds come from
 * the parent bounty, not from the multisig account.
 *
 * @param client - The LegacyClient instance from useApi()
 * @param multisigAddress - The multisig account address
 * @param payoutAmount - The amount to be paid out (ignored - kept for backward compatibility)
 * @param network - The network to check on (for logging only)
 * @returns Balance check result
 */
export async function checkMultisigPayoutBalance(
  client: LegacyClient,
  multisigAddress: string,
  _payoutAmount: bigint, // Ignored - funds come from parent bounty, not multisig
  network: NetworkType = 'paseo'
): Promise<BalanceCheckResult> {
  // Multisig only needs transaction fees - payout funds come from parent bounty
  return checkMultisigTransactionFeeBalance(client, multisigAddress, network)
}

/**
 * Check if a multisig account has sufficient balance for transaction fees
 *
 * IMPORTANT: For child bounty payouts, the payout funds come from the parent bounty,
 * NOT from the multisig account. The multisig only needs enough balance to pay
 * transaction fees for signing the multisig calls.
 *
 * @param client - The LegacyClient instance from useApi()
 * @param multisigAddress - The multisig account address
 * @param network - The network to check on (for logging only)
 * @returns Balance check result
 */
export async function checkMultisigTransactionFeeBalance(
  client: LegacyClient,
  multisigAddress: string,
  network: NetworkType = 'paseo'
): Promise<BalanceCheckResult> {
  try {
    const balance = await getAccountBalance(client, multisigAddress, network)

    // Multisig only needs transaction fees - payout funds come from parent bounty
    const required = MIN_TRANSACTION_FEE
    const hasBalance = balance.transferable >= required
    const shortfall = hasBalance ? BigInt(0) : required - balance.transferable

    console.log('[checkMultisigTransactionFeeBalance]: Balance check', {
      multisigAddress,
      required: required.toString(),
      transferable: balance.transferable.toString(),
      hasBalance,
      shortfall: shortfall.toString(),
    })

    return {
      hasBalance,
      balance,
      required,
      shortfall,
    }
  } catch (error) {
    return {
      hasBalance: false,
      balance: {
        free: BigInt(0),
        reserved: BigInt(0),
        frozen: BigInt(0),
        total: BigInt(0),
        transferable: BigInt(0),
      },
      required: MIN_TRANSACTION_FEE,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if a parent bounty has sufficient remaining funds for a child bounty payout
 *
 * The parent bounty is funded from the treasury and holds the total allocation.
 * Child bounties are created by taking funds from the parent bounty.
 *
 * @param client - The LegacyClient instance from useApi()
 * @param parentBountyId - The parent bounty ID
 * @param payoutAmount - The amount needed for the child bounty
 * @param network - The network to check on (for logging only)
 * @returns Balance check result with parent bounty info
 */
export async function checkParentBountyBalance(
  client: LegacyClient,
  parentBountyId: number,
  payoutAmount: bigint,
  network: NetworkType = 'paseo'
): Promise<BalanceCheckResult & { parentBountyValue?: bigint }> {
  try {
    console.log('[checkParentBountyBalance]: Checking parent bounty', {
      parentBountyId,
      payoutAmount: payoutAmount.toString(),
      network,
    })

    // Query the parent bounty
    const bounty = await client.query.bounties.bounties(parentBountyId)

    if (!bounty) {
      return {
        hasBalance: false,
        balance: {
          free: BigInt(0),
          reserved: BigInt(0),
          frozen: BigInt(0),
          total: BigInt(0),
          transferable: BigInt(0),
        },
        required: payoutAmount,
        error: `Parent bounty ${parentBountyId} not found`,
      }
    }

    const bountyValue = BigInt(bounty.value ?? 0)

    // Check if bounty is in Active status (has curator assigned)
    const isActive = bounty.status?.type === 'Active'

    if (!isActive) {
      return {
        hasBalance: false,
        balance: {
          free: bountyValue,
          reserved: BigInt(0),
          frozen: BigInt(0),
          total: bountyValue,
          transferable: BigInt(0),
        },
        required: payoutAmount,
        parentBountyValue: bountyValue,
        error: `Parent bounty ${parentBountyId} is not active (status: ${bounty.status?.type ?? 'Unknown'})`,
      }
    }

    // Note: The actual remaining balance would require summing all child bounties
    // For now, we check if the bounty value is >= payout amount
    // A more accurate check would query all child bounties and sum their values
    const hasBalance = bountyValue >= payoutAmount
    const shortfall = hasBalance ? BigInt(0) : payoutAmount - bountyValue

    console.log('[checkParentBountyBalance]: Balance check result', {
      parentBountyId,
      bountyValue: bountyValue.toString(),
      payoutAmount: payoutAmount.toString(),
      hasBalance,
      shortfall: shortfall.toString(),
    })

    return {
      hasBalance,
      balance: {
        free: bountyValue,
        reserved: BigInt(0),
        frozen: BigInt(0),
        total: bountyValue,
        transferable: bountyValue,
      },
      required: payoutAmount,
      shortfall,
      parentBountyValue: bountyValue,
    }
  } catch (error) {
    console.error('[checkParentBountyBalance]: Failed to check balance', error)
    return {
      hasBalance: false,
      balance: {
        free: BigInt(0),
        reserved: BigInt(0),
        frozen: BigInt(0),
        total: BigInt(0),
        transferable: BigInt(0),
      },
      required: payoutAmount,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Format balance for display (converts from Planck to tokens)
 *
 * @param balance - Balance in Planck (smallest unit)
 * @param decimals - Number of decimals (default: 10 for DOT/KSM)
 * @returns Formatted balance string
 */
export function formatBalance(balance: bigint, decimals = 10): string {
  const divisor = BigInt(10 ** decimals)
  const whole = balance / divisor
  const fraction = balance % divisor

  // Pad fraction with leading zeros
  const fractionStr = fraction.toString().padStart(decimals, '0')

  // Remove trailing zeros
  const trimmedFraction = fractionStr.replace(/0+$/, '')

  if (trimmedFraction === '') {
    return whole.toString()
  }

  return `${whole}.${trimmedFraction}`
}

/**
 * Get faucet URL for a given network
 *
 * @param network - The network
 * @returns Faucet URL or null if not available
 */
export function getFaucetUrl(network: NetworkType): string | null {
  switch (network) {
    case 'paseo':
      return 'https://faucet.polkadot.io/paseo'
    case 'kusama':
      return 'https://faucet.polkadot.io/kusama'
    case 'polkadot':
      return null // No faucet for mainnet
    default:
      return null
  }
}

/**
 * Create a user-friendly error message for insufficient balance
 *
 * @param address - The account address
 * @param checkResult - The balance check result
 * @param network - The network
 * @param accountType - Type of account (e.g., 'initiator', 'multisig')
 * @returns Error message
 */
export function createInsufficientBalanceError(
  address: string,
  checkResult: BalanceCheckResult,
  network: NetworkType,
  accountType: 'initiator' | 'multisig' = 'initiator'
): string {
  const faucetUrl = getFaucetUrl(network)
  const shortfallFormatted = checkResult.shortfall
    ? formatBalance(checkResult.shortfall)
    : '0'
  const balanceFormatted = formatBalance(checkResult.balance.transferable)
  const requiredFormatted = checkResult.required
    ? formatBalance(checkResult.required)
    : '0'

  let message = `Insufficient balance for ${accountType} account.\n\n`
  message += `Address: ${address}\n`
  message += `Current balance: ${balanceFormatted} tokens\n`
  message += `Required: ${requiredFormatted} tokens\n`
  message += `Shortfall: ${shortfallFormatted} tokens\n\n`

  if (accountType === 'initiator' && faucetUrl) {
    message += `Get testnet tokens from: ${faucetUrl}\n\n`
  } else if (accountType === 'multisig') {
    // For child bounty payouts, multisig only needs transaction fees
    message += `The multisig account needs testnet tokens for transaction fees.\n`
    message += `Note: Payout funds come from the parent bounty, not the multisig.\n`
    if (faucetUrl) {
      message += `Get testnet tokens from: ${faucetUrl}\n\n`
    }
  }

  message += `Network: ${network.toUpperCase()}`

  return message
}
