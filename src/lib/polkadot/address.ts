/**
 * Polkadot Address Utilities
 * 
 * Handles address format conversions between different Substrate chains
 * Uses polkadot-api's built-in utilities from @polkadot-api/substrate-bindings
 */

import { 
  getSs58AddressInfo, 
  fromBufferToBase58, 
  type SS58String,
} from '@polkadot-api/substrate-bindings'

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
 * Network type for address conversion
 */
export type NetworkType = 'polkadot' | 'kusama' | 'paseo'

/**
 * Get SS58 format for a given network
 */
export function getNetworkSS58Format(network: NetworkType): number {
  switch (network) {
    case 'polkadot':
      return SS58_FORMAT.POLKADOT
    case 'kusama':
      return SS58_FORMAT.KUSAMA
    case 'paseo':
      return SS58_FORMAT.PASEO
    default:
      return SS58_FORMAT.POLKADOT
  }
}

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
  // Get address info to extract the public key
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const addressInfo = getSs58AddressInfo(address as SS58String)
  
  // Check if address is valid
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!addressInfo.isValid) {
    console.error('[convertAddress]: Invalid SS58 address', {
      address,
      ss58Format,
    })
    throw new Error(`Invalid SS58 address: ${address}`)
  }
  
  // Re-encode with the target format using polkadot-api's built-in function
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const encoder = fromBufferToBase58(ss58Format)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return encoder(addressInfo.publicKey)
}

/**
 * Convert an address to the format for a specific network
 * 
 * @param address - The address to convert
 * @param network - The target network
 * @returns The address in the target network's format
 * 
 * @example
 * // Convert to Paseo format
 * const paseoAddr = toNetworkAddress('5GHC...', 'paseo')
 * // Convert to Kusama format
 * const kusamaAddr = toNetworkAddress('5GHC...', 'kusama')
 */
export function toNetworkAddress(address: string, network: NetworkType): string {
  const ss58Format = getNetworkSS58Format(network)
  return convertAddress(address, ss58Format)
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const info1 = getSs58AddressInfo(address1 as SS58String)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const info2 = getSs58AddressInfo(address2 as SS58String)
  
  // Check if both addresses are valid
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!info1.isValid || !info2.isValid) {
    console.error('[isSameAddress]: Invalid address(es)', {
      address1,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      address1Valid: info1.isValid,
      address2,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      address2Valid: info2.isValid,
    })
    return false
  }
  
  // Compare the public keys
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return Buffer.from(info1.publicKey).equals(Buffer.from(info2.publicKey))
}

