/**
 * Polkadot API client setup for multisig operations
 *
 * This module provides a singleton instance of the Polkadot API client
 * configured for the Paseo testnet (development) or mainnet (production).
 */

import type { ChainDefinition} from 'polkadot-api';
import { createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws-provider/web'

// Network endpoints
const NETWORK_ENDPOINTS = {
  polkadot: 'wss://rpc.polkadot.io',
  kusama: 'wss://kusama-rpc.polkadot.io',
  paseo: 'wss://paseo.rpc.amforc.com', // Paseo testnet
  paseo_asset_hub: 'wss://asset-hub-paseo-rpc.n.dwellir.com', // Paseo asset hub
} as const

export type PolkadotNetwork = keyof typeof NETWORK_ENDPOINTS

// Get the active network from environment variable
const getActiveNetwork = (): PolkadotNetwork => {
  const network = process.env.NEXT_PUBLIC_POLKADOT_NETWORK as PolkadotNetwork
  if (network && network in NETWORK_ENDPOINTS) {
    return network
  }
  // Default to Paseo testnet for development
  return 'paseo_asset_hub'
}

// Create WebSocket provider
const createWsProvider = (network: PolkadotNetwork) => {
  const endpoint = NETWORK_ENDPOINTS[network]
  console.log(`[polkadot/client]: Connecting to ${network} at ${endpoint}`)
  return getWsProvider(endpoint)
}

// Create Polkadot API client
let clientInstance: ReturnType<typeof createClient> | null = null

export function getPolkadotClient() {
  if (clientInstance) {
    return clientInstance
  }

  const network = getActiveNetwork()
  const provider = createWsProvider(network)
  clientInstance = createClient(provider)

  console.log(`[polkadot/client]: Client created for ${network}`)
  return clientInstance
}

// Create API instance
export function getPolkadotApi() {
  return getPolkadotClient()
}

// Export typed API for Paseo testnet with full type safety
export function getPaseoTypedApi(chainDefinition: ChainDefinition) {
  return getPolkadotClient().getTypedApi(chainDefinition)
}

// Cleanup function
export function disconnectPolkadotClient() {
  if (clientInstance) {
    clientInstance.destroy()
    clientInstance = null
    console.log('[polkadot/client]: Client disconnected')
  }
}

// Export active network for reference
export const activeNetwork = getActiveNetwork()

/**
 * Block explorer URLs for different networks
 */
export const BLOCK_EXPLORER_URLS = {
  polkadot: 'https://polkadot.subscan.io',
  kusama: 'https://kusama.subscan.io',
  paseo: 'https://paseo.subscan.io',
  paseo_asset_hub: 'https://assethub-paseo.subscan.io',
} as const

export function getBlockExplorerUrl(
  network: PolkadotNetwork,
  type: 'extrinsic' | 'block' | 'account',
  identifier: string
): string {
  const baseUrl = BLOCK_EXPLORER_URLS[network]
  return `${baseUrl}/${type}/${identifier}`
}
