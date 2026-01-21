import type { Chain } from '@luno-kit/react/chains'
import {
  paseo,
  paseoAssetHub,
  polkadot,
  polkadotAssetHub,
} from '@luno-kit/react/chains'

/**
 * All available chains (for reference/wallet connections)
 */
export const allChains: Record<string, Chain> = {
  paseo,
  paseoAssetHub,
  polkadot,
  polkadotAssetHub,
}

/**
 * Primary chains for GrantFlow operations.
 *
 * Post-2025 Migration: Both Polkadot and Paseo have bounties/childBounties on Asset Hub.
 *
 * Asset Hub contains:
 * - Treasury (pallet index 60)
 * - Bounties (pallet index 65)
 * - ChildBounties (pallet index 66)
 * - Proxy (pallet index 42)
 * - Utility (pallet index 40)
 * - Multisig (pallet index 41)
 *
 * Source: https://github.com/paseo-network/runtimes (Asset Hub Paseo)
 *         https://github.com/polkadot-fellows/runtimes (Asset Hub Polkadot)
 */
export const chains: Record<string, Chain> = {
  paseo: paseoAssetHub, // Asset Hub - has bounties/childBounties after migration
  polkadot: polkadotAssetHub, // Asset Hub (post-2025 migration)
  // kusama: kusamaAssetHub, // Add when needed
}

/**
 * Get the chain for a network (always returns Asset Hub)
 * @deprecated Use chains[network] directly
 */
export function getBountyChain(network: string): Chain | undefined {
  return chains[network]
}
