import type { Chain } from '@luno-kit/react/chains'
import {
  polkadot,
  polkadotAssetHub,
  paseo,
  paseoAssetHub,
} from '@luno-kit/react/chains'

export const chains: Record<string, Chain> = {
  paseo,
  paseoAssetHub,
  polkadot,
  polkadotAssetHub,
}
