/**
 * Polkadot Wallet Selector Component
 *
 * Allows users to:
 * - Connect to Polkadot wallet extensions (Talisman, Polkadot.js, SubWallet, etc.)
 * - Select an account from connected extension
 * - View current connection status
 * - Disconnect wallet
 *
 * Now powered by LunoKit (built on dedot)
 */

'use client'

import {
  ConnectionStatus,
  useAccount,
  useChain,
  useConnect,
  useConnectors,
  useDisconnect,
} from '@luno-kit/react'
import { CheckCircle, ChevronDown, Loader2, LogOut, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/lib/hooks/use-toast'

export function PolkadotWalletSelector() {
  const { connect, status, error: connectError } = useConnect()
  const { account, address } = useAccount()
  const { disconnect } = useDisconnect()
  const connectors = useConnectors()
  const { chain } = useChain()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)

  // Check connection status from LunoKit
  const isConnecting = status === ConnectionStatus.Connecting
  const isConnected = !!account && !!address

  const handleConnect = (connectorId: string) => {
    try {
      console.log('[polkadot-wallet-selector]: Connecting to', connectorId)
      connect({ connectorId })
      setIsOpen(false)

      toast({
        title: 'Wallet connected',
        description: 'Successfully connected to your Polkadot wallet',
      })
    } catch (err) {
      console.error('[polkadot-wallet-selector]: Failed to connect', err)
      toast({
        title: 'Connection failed',
        description:
          err instanceof Error ? err.message : 'Failed to connect wallet',
        variant: 'destructive',
      })
    }
  }

  const handleDisconnect = () => {
    console.log('[polkadot-wallet-selector]: Disconnecting wallet')
    disconnect()
    setIsOpen(false)

    toast({
      title: 'Wallet disconnected',
      description: 'Your wallet has been disconnected',
    })
  }

  const getConnectorDisplayName = (id: string) => {
    const names: Record<string, string> = {
      'polkadot-js': 'Polkadot.js',
      polkadotjs: 'Polkadot.js',
      talisman: 'Talisman',
      subwallet: 'SubWallet',
      'sub-wallet': 'SubWallet',
      nova: 'Nova Wallet',
    }
    return names[id] ?? id
  }

  // Connected state
  if (isConnected && account && address) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="hidden sm:inline">
              {address.slice(0, 6)}...
              {address.slice(-4)}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Connected Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="space-y-2 px-2 py-2">
            <div>
              <p className="text-muted-foreground text-xs">Account</p>
              <p className="text-sm font-medium">{account.name ?? 'Unnamed'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Address</p>
              <code className="text-xs">
                {address.slice(0, 10)}...
                {address.slice(-8)}
              </code>
            </div>
            {chain && (
              <div>
                <p className="text-muted-foreground text-xs">Network</p>
                <p className="text-sm">{chain.name}</p>
              </div>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect}>
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Disconnected state
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isConnecting}>
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {connectors.length > 0 ? (
          <>
            {connectors.map(connector => (
              <DropdownMenuItem
                key={connector.id}
                onClick={() => handleConnect(connector.id)}
                className="cursor-pointer"
                disabled={isConnecting}
              >
                <div className="flex w-full items-center justify-between">
                  <span>{getConnectorDisplayName(connector.id)}</span>
                  <Badge variant="outline" className="text-xs">
                    Available
                  </Badge>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <div className="px-2 py-4 text-center">
            <p className="text-muted-foreground mb-2 text-sm">
              No Polkadot wallet detected
            </p>
            <p className="text-muted-foreground text-xs">
              Please install{' '}
              <a
                href="https://www.talisman.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Talisman
              </a>
              ,{' '}
              <a
                href="https://polkadot.js.org/extension/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Polkadot.js
              </a>
              , or{' '}
              <a
                href="https://subwallet.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                SubWallet
              </a>
            </p>
          </div>
        )}

        {connectError && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2">
              <p className="text-xs text-red-600">
                {connectError.message ?? 'Connection failed'}
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
