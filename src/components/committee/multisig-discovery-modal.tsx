'use client'

/**
 * Multisig Discovery Modal
 *
 * A test/debug modal to explore the multisig structure for a given bounty ID.
 * Shows:
 * - Curator address (Pure Proxy or Multisig)
 * - Controlling multisig (if curator is a proxy)
 * - Pending multisig calls (if any)
 */

import { useState } from 'react'
import { useApi, useSwitchChain } from '@luno-kit/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Search, Copy, Check, ExternalLink } from 'lucide-react'
import { chains } from '@/lib/polkadot/chains'
import {
  discoverMultisigStructure,
  getPendingMultisigCalls,
  type MultisigStructure,
} from '@/lib/polkadot/multisig-discovery'

interface MultisigDiscoveryModalProps {
  network?: 'paseo' | 'polkadot'
  initialBountyId?: number
}

export function MultisigDiscoveryModal({
  network = 'paseo',
  initialBountyId,
}: MultisigDiscoveryModalProps) {
  const [open, setOpen] = useState(false)
  const [bountyId, setBountyId] = useState(initialBountyId?.toString() ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [structure, setStructure] = useState<MultisigStructure | null>(null)
  const [pendingCalls, setPendingCalls] = useState<
    Awaited<ReturnType<typeof getPendingMultisigCalls>>
  >([])
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const { api: client } = useApi()
  const { switchChainAsync, currentChainId } = useSwitchChain()

  const targetChain = chains[network]
  const isCorrectChain = currentChainId === targetChain?.genesisHash

  const handleDiscover = async () => {
    const id = parseInt(bountyId)
    if (isNaN(id) || id < 0) {
      setError('Please enter a valid bounty ID')
      return
    }

    setIsLoading(true)
    setError(null)
    setStructure(null)
    setPendingCalls([])

    try {
      // Switch chain if needed
      if (!isCorrectChain && targetChain) {
        await switchChainAsync({ chainId: targetChain.genesisHash })
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      if (!client) {
        setError('Not connected to blockchain')
        return
      }

      // Discover structure
      const result = await discoverMultisigStructure(client, id)

      if (!result) {
        setError(`Bounty #${id} not found or has no curator`)
        return
      }

      setStructure(result)

      // Check for pending calls
      const calls = await getPendingMultisigCalls(
        client,
        result.effectiveMultisig
      )
      setPendingCalls(calls)
    } catch (e) {
      console.error('Discovery error:', e)
      setError(e instanceof Error ? e.message : 'Failed to discover structure')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedAddress(text)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const AddressDisplay = ({
    label,
    address,
    raw,
  }: {
    label: string
    address: string
    raw?: string
  }) => (
    <div className="space-y-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <code className="bg-muted flex-1 truncate rounded px-2 py-1 text-xs">
          {address}
        </code>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => copyToClipboard(address)}
        >
          {copiedAddress === address ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <a
            href={`https://${network === 'paseo' ? 'assethub-paseo' : 'assethub-polkadot'}.subscan.io/account/${address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </div>
      {raw && (
        <code className="text-muted-foreground block truncate text-[10px]">
          {raw}
        </code>
      )}
    </div>
  )

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Search className="mr-2 h-4 w-4" />
        Discover Multisig Structure
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Multisig Structure Discovery</DialogTitle>
          <DialogDescription>
            Enter a bounty ID to discover the curator and multisig structure on{' '}
            {targetChain?.name ?? network}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="bountyId">Bounty ID</Label>
              <Input
                id="bountyId"
                type="number"
                min={0}
                placeholder="e.g., 31"
                value={bountyId}
                onChange={e => setBountyId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDiscover()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleDiscover} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Discover
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Results */}
          {structure && (
            <div className="space-y-4">
              {/* Bounty Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    Bounty #{structure.bountyId}
                    <Badge variant="outline">{structure.bountyStatus}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AddressDisplay
                    label="Curator (Pure Proxy)"
                    address={structure.curator.address}
                    raw={structure.curator.raw}
                  />

                  {structure.controllingMultisig && (
                    <>
                      <div className="border-muted flex items-center gap-2 border-t pt-3">
                        <Badge variant="secondary">
                          {structure.controllingMultisig.proxyType} Proxy
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          Curator is controlled by:
                        </span>
                      </div>
                      <AddressDisplay
                        label="Multisig Address"
                        address={structure.controllingMultisig.address}
                        raw={structure.controllingMultisig.raw}
                      />
                    </>
                  )}

                  {structure.curatorIsMultisig && (
                    <div className="text-muted-foreground text-xs">
                      Curator is directly a multisig (no proxy)
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Effective Multisig */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Effective Multisig (for configuration)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AddressDisplay
                    label="Use this address for multisig operations"
                    address={structure.effectiveMultisig}
                  />
                  <p className="text-muted-foreground mt-2 text-xs">
                    Signatories cannot be discovered on-chain. You&apos;ll need
                    to provide them manually or check the block explorer for
                    historical multisig calls.
                  </p>
                </CardContent>
              </Card>

              {/* Pending Calls */}
              {pendingCalls.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Pending Multisig Calls ({pendingCalls.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pendingCalls.map((call, i) => (
                      <div
                        key={i}
                        className="bg-muted/50 rounded-md p-2 text-xs"
                      >
                        <div>
                          <strong>Hash:</strong> {call.callHash}
                        </div>
                        <div>
                          <strong>Depositor:</strong> {call.depositor}
                        </div>
                        <div>
                          <strong>Approvals:</strong>{' '}
                          {call.approvals.join(', ') || 'None'}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Structure Diagram */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-md p-3 font-mono text-xs">
                    {structure.controllingMultisig ? (
                      <>
                        <div>Signatories (unknown)</div>
                        <div className="text-muted-foreground pl-2">↓</div>
                        <div className="pl-2">
                          Multisig:{' '}
                          {structure.controllingMultisig.address.slice(0, 8)}...
                        </div>
                        <div className="text-muted-foreground pl-4">
                          ↓ ({structure.controllingMultisig.proxyType} proxy)
                        </div>
                        <div className="pl-4">
                          Pure Proxy: {structure.curator.address.slice(0, 8)}...
                        </div>
                        <div className="text-muted-foreground pl-6">↓</div>
                        <div className="pl-6">
                          Bounty #{structure.bountyId} Curator
                        </div>
                      </>
                    ) : (
                      <>
                        <div>Signatories (unknown)</div>
                        <div className="text-muted-foreground pl-2">↓</div>
                        <div className="pl-2">
                          Multisig/Curator:{' '}
                          {structure.curator.address.slice(0, 8)}...
                        </div>
                        <div className="text-muted-foreground pl-4">↓</div>
                        <div className="pl-4">
                          Bounty #{structure.bountyId} Curator
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
      </Dialog>
    </>
  )
}
