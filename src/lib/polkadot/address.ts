/**
 * Polkadot Address Utilities
 * 
 * Handles address format conversions between different Substrate chains
 */

import { encodeAddress, decodeAddress } from '@polkadot/util-crypto'

/**
 * SS58 Format prefixes for different chains
 * @see https://github.com/paritytech/ss58-registry
 */
export const SS58_FORMAT = {
  POLKADOT: 0,
  KUSAMA: 2,
  SUBSTRATE: 42,
  PASEO: 0, // Paseo uses the same format as Polkadot
} as const

/**
 * Convert an address to a specific chain format
 * 
 * @param address - The address to convert (can be in any SS58 format)
 * @param ss58Format - The target SS58 format
 * @returns The address in the target format
 * 
 * @example
 * // Convert Substrate generic address to Paseo format
 * const paseoAddress = convertAddress(
 *   '5GHCgbeeFq4dgw2mwuxdy2diP9GL5sZ5J13fH7HbQLjmDxGo',
 *   SS58_FORMAT.PASEO
 * )
 * // Returns: '15DVpvui7cL78U3HuZ1e7BTsEmFynB7DNVn9SQGwxRmHQRD5'
 */
export function convertAddress(address: string, ss58Format: number): string {
  try {
    // Decode the address to get the public key
    const publicKey = decodeAddress(address)
    
    // Re-encode with the target format
    return encodeAddress(publicKey, ss58Format)
  } catch (error) {
    console.error('[convertAddress]: Failed to convert address', {
      address,
      ss58Format,
      error,
    })
    throw new Error(`Invalid address format: ${address}`)
  }
}

/**
 * Convert an address to Paseo format
 * 
 * @param address - The address to convert
 * @returns The address in Paseo format
 */
export function toPaseoAddress(address: string): string {
  return convertAddress(address, SS58_FORMAT.PASEO)
}

/**
 * Convert an address to Polkadot format
 * 
 * @param address - The address to convert
 * @returns The address in Polkadot format
 */
export function toPolkadotAddress(address: string): string {
  return convertAddress(address, SS58_FORMAT.POLKADOT)
}

/**
 * Convert an address to Kusama format
 * 
 * @param address - The address to convert
 * @returns The address in Kusama format
 */
export function toKusamaAddress(address: string): string {
  return convertAddress(address, SS58_FORMAT.KUSAMA)
}

/**
 * Convert an address to generic Substrate format
 * 
 * @param address - The address to convert
 * @returns The address in generic Substrate format
 */
export function toSubstrateAddress(address: string): string {
  return convertAddress(address, SS58_FORMAT.SUBSTRATE)
}

/**
 * Check if two addresses are the same account (regardless of format)
 * 
 * @param address1 - First address
 * @param address2 - Second address
 * @returns True if addresses represent the same account
 */
export function isSameAddress(address1: string, address2: string): boolean {
  try {
    const publicKey1 = decodeAddress(address1)
    const publicKey2 = decodeAddress(address2)
    
    // Compare the public keys
    return Buffer.from(publicKey1).equals(Buffer.from(publicKey2))
  } catch (error) {
    console.error('[isSameAddress]: Failed to compare addresses', {
      address1,
      address2,
      error,
    })
    return false
  }
}

