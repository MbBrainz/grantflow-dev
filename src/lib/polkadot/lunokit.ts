import { createConfig } from '@luno-kit/react'
import {
  polkadot,
  polkadotAssetHub,
  paseoAssetHub,
} from '@luno-kit/react/chains'
import {
  polkadotjsConnector,
  talismanConnector,
  mimirConnector,
  subwalletConnector,
  polkagateConnector,
} from '@luno-kit/react/connectors'
import type { Connector } from '@luno-kit/react/types'

export const config = createConfig({
  appName: 'GrantFlow.Dev',
  chains: [polkadot, polkadotAssetHub, paseoAssetHub],
  connectors: [
    polkadotjsConnector(),
    talismanConnector(),
    mimirConnector(),
    subwalletConnector(),
    polkagateConnector(),
  ] as Connector[],
})
