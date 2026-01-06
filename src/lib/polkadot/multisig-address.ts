/**
 * Multisig Address Computation
 *
 * Uses @polkadot/util-crypto for correct multisig address derivation.
 * Validates that user-provided signatories produce the correct
 * multisig address discovered from the bounty.
 */

import {
  createKeyMulti,
  encodeAddress,
  decodeAddress,
} from '@polkadot/util-crypto'

// Polkadot SS58 prefix (addresses start with 1)
const POLKADOT_SS58_PREFIX = 0

/**
 * Compute multisig address from signatories and threshold
 *
 * @param signatories - Array of SS58 addresses (any format)
 * @param threshold - Number of required approvals
 * @param ss58Prefix - SS58 prefix for output address (default: 0 for Polkadot)
 * @returns The computed multisig address in SS58 format
 */
export function computeMultisigAddress(
  signatories: string[],
  threshold: number,
  ss58Prefix: number = POLKADOT_SS58_PREFIX
): string {
  if (signatories.length < 2) {
    throw new Error('At least 2 signatories required')
  }
  if (threshold < 1 || threshold > signatories.length) {
    throw new Error(
      `Invalid threshold: ${threshold} (must be 1-${signatories.length})`
    )
  }

  // Use polkadot-js to compute the multisig key
  const multiKey = createKeyMulti(signatories, threshold)

  // Encode as SS58
  return encodeAddress(multiKey, ss58Prefix)
}

/**
 * Normalize an address to Polkadot format (SS58 prefix 0)
 */
export function normalizeToPolkadot(address: string): string {
  const decoded = decodeAddress(address)
  return encodeAddress(decoded, POLKADOT_SS58_PREFIX)
}

/**
 * Check if two addresses are the same (ignoring SS58 prefix)
 */
export function addressesEqual(addr1: string, addr2: string): boolean {
  try {
    const decoded1 = decodeAddress(addr1)
    const decoded2 = decodeAddress(addr2)

    if (decoded1.length !== decoded2.length) return false

    for (let i = 0; i < decoded1.length; i++) {
      if (decoded1[i] !== decoded2[i]) return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Validation result for multisig configuration
 */
export interface MultisigValidationResult {
  valid: boolean
  computedAddress: string
  expectedAddress: string
  error?: string
}

/**
 * Validate that signatories + threshold produce the expected multisig address
 *
 * @param expectedMultisig - The discovered/expected multisig address
 * @param signatories - User-provided signatory addresses
 * @param threshold - User-provided threshold
 * @returns Validation result with computed address for comparison
 */
export function validateMultisigConfig(
  expectedMultisig: string,
  signatories: string[],
  threshold: number
): MultisigValidationResult {
  try {
    const computedAddress = computeMultisigAddress(signatories, threshold)
    const expectedNormalized = normalizeToPolkadot(expectedMultisig)
    const valid = addressesEqual(computedAddress, expectedNormalized)

    return {
      valid,
      computedAddress,
      expectedAddress: expectedNormalized,
      error: valid
        ? undefined
        : 'Computed multisig address does not match expected address',
    }
  } catch (e) {
    return {
      valid: false,
      computedAddress: '',
      expectedAddress: normalizeToPolkadot(expectedMultisig),
      error: e instanceof Error ? e.message : 'Failed to compute multisig address',
    }
  }
}

/**
 * Check if a wallet address is one of the signatories
 */
export function isSignatory(
  walletAddress: string,
  signatories: string[]
): boolean {
  return signatories.some(sig => addressesEqual(walletAddress, sig))
}

/**
 * Get the index of a wallet in the signatories list (1-based for display)
 * Returns -1 if not found
 */
export function getSignatoryIndex(
  walletAddress: string,
  signatories: string[]
): number {
  const index = signatories.findIndex(sig => addressesEqual(walletAddress, sig))
  return index === -1 ? -1 : index + 1
}
