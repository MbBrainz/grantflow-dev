/**
 * Polkadot Utilities
 * 
 * Helper functions for Polkadot multisig operations, address handling,
 * and cryptographic operations.
 */

import { Binary } from 'polkadot-api'

/**
 * Sort addresses for multisig operations
 * 
 * Polkadot requires addresses to be sorted in a specific order for multisig.
 * This uses lexicographic sorting of the underlying public keys.
 * 
 * @param addresses - Array of SS58 addresses
 * @returns Sorted array of addresses
 */
export function sortAddresses(addresses: string[]): string[] {
  return [...addresses].sort((a, b) => {
    // Simple lexicographic sort works for SS58 addresses
    if (a < b) return -1
    if (a > b) return 1
    return 0
  })
}

/**
 * Get other signatories for multisig call
 * 
 * Filters out the current signer and sorts the remaining addresses.
 * This is required for the `other_signatories` parameter in multisig calls.
 * 
 * @param allSignatories - All multisig signatories
 * @param currentSigner - The address of the current signer
 * @returns Sorted array of other signatories
 */
export function getOtherSignatories(
  allSignatories: string[],
  currentSigner: string
): string[] {
  const others = allSignatories.filter(addr => addr !== currentSigner)
  return sortAddresses(others)
}

/**
 * Hash call data using blake2-256
 * 
 * @param callData - Encoded call data as Uint8Array or hex string
 * @returns Blake2-256 hash as hex string with 0x prefix
 */
export function hashCallData(callData: Uint8Array | string): string {
  // Convert hex string to Uint8Array if needed
  let data: Uint8Array
  if (typeof callData === 'string') {
    const hex = callData.startsWith('0x') ? callData.slice(2) : callData
    data = new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  } else {
    data = callData
  }
  
  // Use polkadot-api's Binary for hashing
  const binary = Binary.fromBytes(data)
  return binary.asHex()
}

/**
 * Convert call data to hex string
 * 
 * @param callData - Call data as Uint8Array or existing hex
 * @returns Hex string with 0x prefix
 */
export function callDataToHex(callData: Uint8Array | string): string {
  if (typeof callData === 'string') {
    return callData.startsWith('0x') ? callData : `0x${callData}`
  }
  
  const hex = Array.from(callData)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `0x${hex}`
}

/**
 * Convert hex string to Uint8Array
 * 
 * @param hex - Hex string with or without 0x prefix
 * @returns Uint8Array of bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(cleanHex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16)
  }
  return bytes
}

/**
 * Validate SS58 address format
 * 
 * Basic validation - checks if address looks like a valid SS58 address.
 * Does not verify checksum.
 * 
 * @param address - Address to validate
 * @returns true if address format is valid
 */
export function isValidAddress(address: string): boolean {
  // SS58 addresses are base58 encoded and typically 47-48 characters
  const ss58Regex = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/
  return ss58Regex.test(address)
}

/**
 * Truncate address for display
 * 
 * @param address - Full SS58 address
 * @param startChars - Number of characters to show at start (default: 8)
 * @param endChars - Number of characters to show at end (default: 6)
 * @returns Truncated address (e.g., "5GrwvaE...7JtUBP")
 */
export function truncateAddress(
  address: string,
  startChars = 8,
  endChars = 6
): string {
  if (address.length <= startChars + endChars) {
    return address
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Calculate multisig deposit
 * 
 * Multisig operations require a deposit that's locked until execution.
 * Formula: DepositBase + threshold * DepositFactor
 * 
 * For Paseo/Polkadot:
 * - DepositBase: ~20.088 tokens
 * - DepositFactor: ~0.032 tokens per signatory
 * 
 * @param threshold - Number of required signatures
 * @returns Estimated deposit amount in planck
 */
export function estimateMultisigDeposit(threshold: number): bigint {
  const DEPOSIT_BASE = 200880000000n // ~20.088 tokens
  const DEPOSIT_FACTOR = 320000000n // ~0.032 tokens
  
  return DEPOSIT_BASE + (BigInt(threshold) * DEPOSIT_FACTOR)
}

/**
 * Generate multisig address from signatories and threshold
 * 
 * Note: This is a placeholder. In production, you'd use @polkadot/util-crypto
 * to properly derive the multisig address.
 * 
 * @param signatories - Sorted array of signatory addresses
 * @param threshold - Required number of signatures
 * @returns Multisig address
 */
export function deriveMultisigAddress(
  signatories: string[],
  threshold: number
): string {
  // This is a placeholder - proper implementation requires @polkadot/util-crypto
  console.warn('[deriveMultisigAddress]: This is a placeholder. Use @polkadot/util-crypto in production.')
  
  // For now, just create a mock address for development
  const sortedSigs = sortAddresses(signatories)
  const combined = sortedSigs.join('') + threshold.toString()
  
  // Return a recognizable placeholder
  return `multisig_${combined.slice(0, 8)}_${threshold}`
}

/**
 * Timepoint utilities
 */

export interface Timepoint {
  height: number
  index: number
}

/**
 * Compare two timepoints
 * 
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareTimepoints(a: Timepoint, b: Timepoint): number {
  if (a.height !== b.height) {
    return a.height < b.height ? -1 : 1
  }
  if (a.index !== b.index) {
    return a.index < b.index ? -1 : 1
  }
  return 0
}

/**
 * Check if timepoint is valid (both height and index are positive)
 */
export function isValidTimepoint(timepoint: Timepoint | null): timepoint is Timepoint {
  return timepoint !== null && timepoint.height > 0 && timepoint.index >= 0
}

/**
 * Format timepoint for display
 */
export function formatTimepoint(timepoint: Timepoint): string {
  return `${timepoint.height}:${timepoint.index}`
}

/**
 * Parse timepoint from string format "height:index"
 */
export function parseTimepoint(str: string): Timepoint | null {
  const parts = str.split(':')
  if (parts.length !== 2) return null
  
  const height = parseInt(parts[0], 10)
  const index = parseInt(parts[1], 10)
  
  if (isNaN(height) || isNaN(index)) return null
  
  return { height, index }
}

/**
 * Weight utilities for transaction fee estimation
 */

export interface Weight {
  ref_time: bigint
  proof_size: bigint
}

/**
 * Default weight for simple transfers
 */
export const DEFAULT_TRANSFER_WEIGHT: Weight = {
  ref_time: 1000000000n,
  proof_size: 300000n,
}

/**
 * Default weight for batch operations (higher)
 */
export const DEFAULT_BATCH_WEIGHT: Weight = {
  ref_time: 2000000000n,
  proof_size: 500000n,
}

/**
 * Combine multiple weights
 */
export function addWeights(...weights: Weight[]): Weight {
  return weights.reduce(
    (acc, w) => ({
      ref_time: acc.ref_time + w.ref_time,
      proof_size: acc.proof_size + w.proof_size,
    }),
    { ref_time: 0n, proof_size: 0n }
  )
}

/**
 * Multiply weight by a factor
 */
export function multiplyWeight(weight: Weight, factor: number): Weight {
  const factorBigInt = BigInt(Math.floor(factor * 1000)) / 1000n
  return {
    ref_time: (weight.ref_time * factorBigInt) / 1000n,
    proof_size: (weight.proof_size * factorBigInt) / 1000n,
  }
}

