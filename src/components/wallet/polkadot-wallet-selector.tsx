/**
 * Polkadot Wallet Selector Component
 *
 * Allows users to:
 * - Connect to Polkadot wallet extensions (Talisman, Polkadot.js, SubWallet, etc.)
 * - Select an account from connected extension
 * - View current connection status
 * - Disconnect wallet
 */

'use client'

import { useState } from 'react'
import { usePolkadot } from '@/components/providers/polkadot-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, ChevronDown, Loader2, CheckCircle, LogOut } from 'lucide-react'

export function PolkadotWalletSelector() {
  const {
    isConnecting,
    isConnected,
    error,
    availableExtensions,
    selectedAccount,
    connectWallet,
    disconnectWallet,
  } = usePolkadot()

  const [isOpen, setIsOpen] = useState(false)

  const handleConnect = async (
    extensionName: 'polkadot-js' | 'talisman' | 'subwallet' | 'nova'
  ) => {
    try {
      await connectWallet(extensionName)
      setIsOpen(false)
    } catch (err) {
      console.error('[polkadot-wallet-selector]: Failed to connect', err)
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
    setIsOpen(false)
  }

  const getExtensionDisplayName = (name: string) => {
    const names: Record<string, string> = {
      'polkadot-js': 'Polkadot.js',
      talisman: 'Talisman',
      subwallet: 'SubWallet',
      nova: 'Nova Wallet',
    }
    return names[name] ?? name
  }

  if (isConnected && selectedAccount) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="hidden sm:inline">
              {selectedAccount.address.slice(0, 6)}...
              {selectedAccount.address.slice(-4)}
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
              <p className="text-sm font-medium">
                {selectedAccount.name ?? 'Unnamed'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Address</p>
              <code className="text-xs">
                {selectedAccount.address.slice(0, 10)}...
                {selectedAccount.address.slice(-8)}
              </code>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Extension</p>
              <p className="text-sm">
                {getExtensionDisplayName(selectedAccount.source)}
              </p>
            </div>
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

        {availableExtensions.length > 0 ? (
          <>
            {availableExtensions.map(ext => (
              <DropdownMenuItem
                key={ext.name}
                onClick={() => handleConnect(ext.name)}
                className="cursor-pointer"
              >
                <div className="flex w-full items-center justify-between">
                  <span>{getExtensionDisplayName(ext.name)}</span>
                  <Badge variant="outline" className="text-xs">
                    Installed
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

        {error && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
