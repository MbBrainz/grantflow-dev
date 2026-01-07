'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

interface ClientLunoKitProviderProps {
  children: ReactNode
}

export function ClientLunoKitProvider({
  children,
}: ClientLunoKitProviderProps) {
  // Dynamically import LunoKitProvider and config to prevent SSR issues with WalletConnect/pino
  const ConfiguredProvider = dynamic(
    async () => {
      const [{ LunoKitProvider }, { config }] = await Promise.all([
        import('@luno-kit/ui'),
        import('@/lib/polkadot/lunokit'),
      ])

      return function Provider({ children }: { children: ReactNode }) {
        return <LunoKitProvider config={config}>{children}</LunoKitProvider>
      }
    },
    { ssr: false }
  )

  return <ConfiguredProvider>{children}</ConfiguredProvider>
}
