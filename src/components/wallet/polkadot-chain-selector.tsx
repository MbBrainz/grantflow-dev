/**
 * Polkadot Chain Selector Component
 *
 * Allows users to:
 * - View current connected chain
 * - Switch between available chains (Polkadot, Asset Hub, Paseo testnet)
 * - Custom dropdown to avoid LunoKit modal accessibility warnings
 */

'use client'

import { useChain, useSwitchChain } from '@luno-kit/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Network, ChevronDown, CheckCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { useEffect, useState } from 'react'

export function PolkadotChainSelector() {
  const { chain, chainId } = useChain()
  const {
    switchChainAsync,
    isPending,
    chains: availableChains,
  } = useSwitchChain()
  const { toast } = useToast()
  const [previousChain, setPreviousChain] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Show toast when chain changes
  useEffect(() => {
    if (chain && previousChain && chain.name !== previousChain) {
      toast({
        title: 'Chain switched',
        description: `Connected to ${chain.name}`,
      })
    }
    if (chain) {
      setPreviousChain(chain.name)
    }
  }, [chain, previousChain, toast])

  const handleSwitchChain = async (targetChainId: string) => {
    try {
      console.log(
        '[polkadot-chain-selector]: Switching to chain',
        targetChainId
      )
      await switchChainAsync({ chainId: targetChainId })
      setIsOpen(false)
    } catch (err) {
      console.error('[polkadot-chain-selector]: Failed to switch chain', err)
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred'
      toast({
        title: 'Failed to switch chain',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // Determine if chain is testnet
  const isTestnet = chain?.name.toLowerCase().includes('paseo')

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
          disabled={!chain || isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Network className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {chain ? chain.name : 'No Chain'}
          </span>
          {isTestnet && (
            <Badge variant="secondary" className="text-xs">
              Testnet
            </Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Network</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {availableChains.map(availableChain => {
          const isActive = chainId === availableChain.genesisHash
          const isChainTestnet = availableChain.name
            .toLowerCase()
            .includes('paseo')

          return (
            <DropdownMenuItem
              key={availableChain.genesisHash}
              onClick={() => handleSwitchChain(availableChain.genesisHash)}
              disabled={isActive || isPending}
              className="cursor-pointer"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{availableChain.name}</span>
                  {isChainTestnet && (
                    <Badge variant="secondary" className="text-xs">
                      Testnet
                    </Badge>
                  )}
                </div>
                {isActive && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
