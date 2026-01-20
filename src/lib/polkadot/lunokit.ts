import { createConfig } from '@luno-kit/react'
import {
  paseo,
  paseoAssetHub,
  polkadot,
  polkadotAssetHub,
} from '@luno-kit/react/chains'
import {
  mimirConnector,
  polkadotjsConnector,
  polkagateConnector,
  subwalletConnector,
  talismanConnector,
} from '@luno-kit/react/connectors'
import type { Connector } from '@luno-kit/react/types'

export const config = createConfig({
  appName: 'GrantFlow.Dev',
  // Paseo Asset Hub is the default for testing
  chains: [paseoAssetHub, paseo, polkadotAssetHub, polkadot],
  connectors: [
    polkadotjsConnector(),
    talismanConnector(),
    mimirConnector(),
    subwalletConnector(),
    polkagateConnector(),
  ] as Connector[],
})
