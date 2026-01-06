import type { Chain } from '@luno-kit/react/chains'
import {
  polkadot,
  polkadotAssetHub,
  paseo,
  paseoAssetHub,
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
 * We use Asset Hub chains because that's where treasury operations live:
 * - Bounties pallet (parent bounties)
 * - ChildBounties pallet (milestone payouts)
 * - Treasury pallet
 * - Multisig pallet (for committee approvals)
 *
 * The relay chains (Polkadot/Paseo) no longer have active bounties.
 */
export const chains: Record<string, Chain> = {
  paseo: paseoAssetHub,
  polkadot: polkadotAssetHub,
  // kusama: kusamaAssetHub, // Add when needed
}

/**
 * Get the chain for a network (always returns Asset Hub)
 * @deprecated Use chains[network] directly
 */
export function getBountyChain(network: string): Chain | undefined {
  return chains[network]
}
