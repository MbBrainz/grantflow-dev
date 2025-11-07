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
