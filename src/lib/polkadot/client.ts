/**
 * Polkadot API Client
 * 
 * Provides configured Polkadot API instances for different networks.
 * Using polkadot-api v1.15.0 for type-safe blockchain interactions.
 */

import { createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws-provider/web'
import { paseo } from 'polkadot-api/chains/paseo'

/**
 * Network Configuration
 * 
 * Paseo is the Polkadot testnet - perfect for development and testing
 * Polkadot/Kusama configurations are included for production
 */
export const NETWORK_ENDPOINTS = {
  // Testnet (default for development)
  paseo: 'wss://paseo.rpc.amforc.com',
  
  // Production networks
  polkadot: 'wss://rpc.polkadot.io',
  kusama: 'wss://kusama-rpc.polkadot.io',
} as const

export type NetworkType = keyof typeof NETWORK_ENDPOINTS

/**
 * Get the active network from environment
 * Defaults to Paseo testnet for safety
 */
export function getActiveNetwork(): NetworkType {
  const network = process.env.NEXT_PUBLIC_POLKADOT_NETWORK as NetworkType
  return network && network in NETWORK_ENDPOINTS ? network : 'paseo'
}

/**
 * Get the RPC endpoint for the active network
 */
export function getNetworkEndpoint(): string {
  const network = getActiveNetwork()
  return NETWORK_ENDPOINTS[network]
}

/**
 * Create Polkadot API client for the active network
 * 
 * Usage:
 * ```typescript
 * const client = createPolkadotClient()
 * const api = client.getTypedApi(paseo)
 * ```
 */
export function createPolkadotClient() {
  const endpoint = getNetworkEndpoint()
  console.log(`[createPolkadotClient]: Connecting to ${getActiveNetwork()} at ${endpoint}`)
  
  const provider = getWsProvider(endpoint)
  const client = createClient(provider)
  
  return client
}

/**
 * Singleton Paseo API instance
 * This is the main API instance used throughout the application
 */
let paseoApiInstance: ReturnType<typeof createPolkadotClient> | null = null

export function getPaseoApi() {
  if (!paseoApiInstance) {
    paseoApiInstance = createPolkadotClient()
  }
  return paseoApiInstance.getTypedApi(paseo)
}

/**
 * Type exports for use in other files
 */
export type PolkadotClient = ReturnType<typeof createPolkadotClient>
export type PaseoApi = ReturnType<typeof getPaseoApi>

/**
 * Network metadata
 */
export const NETWORK_METADATA = {
  paseo: {
    name: 'Paseo Testnet',
    symbol: 'PAS',
    decimals: 10,
    explorer: 'https://paseo.subscan.io',
    existentialDeposit: 10000000000n, // 1 PAS
  },
  polkadot: {
    name: 'Polkadot',
    symbol: 'DOT',
    decimals: 10,
    explorer: 'https://polkadot.subscan.io',
    existentialDeposit: 10000000000n, // 1 DOT
  },
  kusama: {
    name: 'Kusama',
    symbol: 'KSM',
    decimals: 12,
    explorer: 'https://kusama.subscan.io',
    existentialDeposit: 333333333n, // 0.000333333333 KSM
  },
} as const

/**
 * Get network metadata for the active network
 */
export function getNetworkMetadata() {
  const network = getActiveNetwork()
  return NETWORK_METADATA[network]
}

/**
 * Format token amount with proper decimals
 * 
 * @param amount - Amount in planck (smallest unit)
 * @param decimals - Number of decimal places (default: network decimals)
 * @returns Formatted string (e.g., "1.5 PAS")
 */
export function formatTokenAmount(amount: bigint, decimals?: number): string {
  const metadata = getNetworkMetadata()
  const decimalPlaces = decimals ?? metadata.decimals
  
  const divisor = 10n ** BigInt(decimalPlaces)
  const whole = amount / divisor
  const remainder = amount % divisor
  
  const remainderStr = remainder.toString().padStart(decimalPlaces, '0')
  const trimmedRemainder = remainderStr.replace(/0+$/, '')
  
  if (trimmedRemainder) {
    return `${whole}.${trimmedRemainder} ${metadata.symbol}`
  }
  return `${whole} ${metadata.symbol}`
}

/**
 * Parse token amount from string to planck
 * 
 * @param amount - Amount as string (e.g., "1.5")
 * @param decimals - Number of decimal places (default: network decimals)
 * @returns Amount in planck (smallest unit)
 */
export function parseTokenAmount(amount: string, decimals?: number): bigint {
  const metadata = getNetworkMetadata()
  const decimalPlaces = decimals ?? metadata.decimals
  
  const [whole, fraction = ''] = amount.split('.')
  const paddedFraction = fraction.padEnd(decimalPlaces, '0').slice(0, decimalPlaces)
  
  const wholeAmount = BigInt(whole || '0') * (10n ** BigInt(decimalPlaces))
  const fractionAmount = BigInt(paddedFraction || '0')
  
  return wholeAmount + fractionAmount
}

/**
 * Get block explorer URL for a transaction
 */
export function getExplorerUrl(txHash: string): string {
  const metadata = getNetworkMetadata()
  return `${metadata.explorer}/extrinsic/${txHash}`
}

/**
 * Get block explorer URL for an address
 */
export function getAddressExplorerUrl(address: string): string {
  const metadata = getNetworkMetadata()
  return `${metadata.explorer}/account/${address}`
}

