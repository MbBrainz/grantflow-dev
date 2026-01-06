/**
 * Multisig Configuration Form Component
 *
 * Allows committee admins to configure multisig settings for on-chain payments.
 * Includes:
 * - Multisig address
 * - Threshold (number of required approvals)
 * - Signatories (committee member wallet addresses)
 * - Approval pattern (combined vs separated approval/payment)
 * - Network selection (Polkadot, Kusama, Paseo)
 * - Child bounty configuration with automatic curator fetching
 */

'use client'

import { useState } from 'react'
import { useApi, useSwitchChain } from '@luno-kit/react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  CheckCircle,
} from 'lucide-react'
import type { MultisigConfig } from '@/lib/db/schema/jsonTypes/GroupSettings'
import { getParentBounty } from '@/lib/polkadot/child-bounty'
import { useToast } from '@/lib/hooks/use-toast'
import { chains } from '@/lib/polkadot/chains'
import { MultisigDiscoveryModal } from './multisig-discovery-modal'

interface MultisigConfigFormProps {
  initialConfig?: MultisigConfig
  onSave: (config: MultisigConfig) => Promise<void>
  isLoading?: boolean
}

export function MultisigConfigForm({
  initialConfig,
  onSave,
  isLoading = false,
}: MultisigConfigFormProps) {
  const { toast } = useToast()
  const [config, setConfig] = useState<MultisigConfig>(
    initialConfig ?? {
      multisigAddress: '',
      signatories: [],
      threshold: 2,
      approvalWorkflow: 'merged',
      requireAllSignatories: false,
      votingTimeoutBlocks: 50400, // ~7 days on Polkadot (6s blocks)
      automaticExecution: true,
      network: 'paseo',
      parentBountyId: 0, // Required: ID of the parent bounty for child bounties
      curatorProxyAddress: '', // Required: Proxy account controlled by multisig
    }
  )

  const [newSignatory, setNewSignatory] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isFetchingCurator, setIsFetchingCurator] = useState(false)
  const [bountyStatus, setBountyStatus] = useState<string | null>(null)

  // Get the API client and chain switching functionality
  const { api: client } = useApi()
  const { switchChainAsync, currentChainId } = useSwitchChain()

  // Get the target chain (Asset Hub) for the selected network
  // All treasury/bounty operations happen on Asset Hub
  const targetChain = chains[config.network]
  const isCorrectChain = currentChainId === targetChain?.genesisHash

  // Fetch curator from chain based on parent bounty ID
  const handleFetchCurator = async () => {
    if (config.parentBountyId < 0) {
      toast({
        title: 'Invalid Bounty ID',
        description: 'Please enter a valid parent bounty ID first.',
        variant: 'destructive',
      })
      return
    }

    console.debug('[handleFetchCurator]: Fetching curator', {
      config,
      targetChain: targetChain?.name,
    })

    setIsFetchingCurator(true)
    setBountyStatus(null)

    try {
      // Switch to the correct Asset Hub chain if needed
      if (!isCorrectChain && targetChain) {
        toast({
          title: 'Switching Network',
          description: `Connecting to ${targetChain.name}...`,
        })
        await switchChainAsync({ chainId: targetChain.genesisHash })
        // Wait a bit for the client to be ready after switching
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      if (!client) {
        toast({
          title: 'Not Connected',
          description:
            'Please wait for the blockchain connection to establish and try again.',
          variant: 'destructive',
        })
        return
      }

      const proxies = await client.query.proxy.proxies(
        config.curatorProxyAddress
      )

      console.debug('[handleFetchCurator]: Proxies', { proxies })

      const bounty = await getParentBounty(client, config.parentBountyId)

      if (!bounty) {
        toast({
          title: 'Bounty Not Found',
          description: `No bounty found with ID ${config.parentBountyId} on ${targetChain?.name ?? config.network}. Make sure the bounty exists and is funded.`,
          variant: 'destructive',
        })
        setBountyStatus('not_found')
        return
      }

      setBountyStatus(bounty.status.type)

      if (bounty.status.curator) {
        setConfig(prev => ({
          ...prev,
          curatorProxyAddress: bounty.status.curator?.address() ?? '',
        }))
        toast({
          title: 'Curator Found',
          description: `Curator address loaded from bounty #${config.parentBountyId}.`,
        })
      } else {
        toast({
          title: 'No Curator Assigned',
          description: `Bounty #${config.parentBountyId} is in "${bounty.status.type}" status and has no curator assigned yet.`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('[MultisigConfigForm]: Failed to fetch curator', error)
      toast({
        title: 'Fetch Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to fetch bounty information.',
        variant: 'destructive',
      })
    } finally {
      setIsFetchingCurator(false)
    }
  }

  // Auto-fetch curator when parent bounty ID changes (debounced)
  const handleParentBountyIdChange = (value: number) => {
    setConfig(prev => ({
      ...prev,
      parentBountyId: value,
    }))
    // Reset status when bounty ID changes
    setBountyStatus(null)
  }

  const handleAddSignatory = () => {
    if (!newSignatory.trim()) return

    // Basic validation for Substrate address format
    const substrateAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/
    if (!substrateAddressRegex.exec(newSignatory)) {
      alert('Invalid Substrate address format')
      return
    }

    if (config.signatories.includes(newSignatory)) {
      alert('This address is already in the signatories list')
      return
    }

    setConfig({
      ...config,
      signatories: [...config.signatories, newSignatory],
    })
    setNewSignatory('')
  }

  const handleRemoveSignatory = (address: string) => {
    setConfig({
      ...config,
      signatories: config.signatories.filter(s => s !== address),
      // Adjust threshold if it's now higher than signatory count
      threshold: Math.min(config.threshold, config.signatories.length - 1),
    })
  }

  const handleSave = async () => {
    // Validation
    if (!config.multisigAddress) {
      alert('Please enter a multisig address')
      return
    }

    if (config.signatories.length < 2) {
      alert('At least 2 signatories are required for a multisig')
      return
    }

    if (config.threshold < 2) {
      alert('Threshold must be at least 2')
      return
    }

    if (config.threshold > config.signatories.length) {
      alert('Threshold cannot exceed the number of signatories')
      return
    }

    if (config.parentBountyId < 0) {
      alert('Please enter a valid parent bounty ID (0 or greater)')
      return
    }

    if (!config.curatorProxyAddress) {
      alert('Please enter a curator proxy address')
      return
    }

    setIsSaving(true)
    try {
      await onSave(config)
    } catch (error: unknown) {
      console.error('[multisig-config-form]: Failed to save', error)
      alert('Failed to save multisig configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const isValid =
    config.multisigAddress &&
    config.signatories.length >= 2 &&
    config.threshold >= 2 &&
    config.threshold <= config.signatories.length &&
    config.parentBountyId >= 0 &&
    config.curatorProxyAddress

  return (
    <div className="space-y-6">
      {/* Multisig Address */}
      <div className="space-y-2">
        <Label htmlFor="multisigAddress">Multisig Address</Label>
        <Input
          id="multisigAddress"
          placeholder="Enter the on-chain multisig address"
          value={config.multisigAddress}
          onChange={e =>
            setConfig({ ...config, multisigAddress: e.target.value })
          }
        />
        <p className="text-muted-foreground text-xs">
          The Substrate address of your committee&apos;s multisig account
        </p>
      </div>

      {/* Network Selection */}
      <div className="space-y-2">
        <Label>Network (Asset Hub)</Label>
        <RadioGroup
          value={config.network}
          onValueChange={(value: 'polkadot' | 'kusama' | 'paseo') =>
            setConfig({ ...config, network: value })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="paseo" id="paseo" />
            <Label htmlFor="paseo">Paseo Asset Hub (Testnet)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="polkadot" id="polkadot" />
            <Label htmlFor="polkadot">Polkadot Asset Hub (Mainnet)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="kusama" id="kusama" disabled />
            <Label htmlFor="kusama" className="text-muted-foreground">
              Kusama Asset Hub (Coming Soon)
            </Label>
          </div>
        </RadioGroup>
        <p className="text-muted-foreground text-xs">
          All bounty and treasury operations use Asset Hub parachains
        </p>
      </div>

      {/* Signatories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signatories</CardTitle>
          <CardDescription>
            Committee member wallet addresses authorized to approve payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add signatory */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter wallet address"
              value={newSignatory}
              onChange={e => setNewSignatory(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSignatory()}
            />
            <Button
              type="button"
              onClick={handleAddSignatory}
              disabled={!newSignatory.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Signatory list */}
          {config.signatories.length > 0 ? (
            <div className="space-y-2">
              {config.signatories.map((address, index) => (
                <div
                  key={address}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <code className="text-xs">
                      {address.slice(0, 8)}...{address.slice(-6)}
                    </code>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSignatory(address)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
              No signatories added yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threshold */}
      <div className="space-y-2">
        <Label htmlFor="threshold">
          Approval Threshold ({config.threshold} of {config.signatories.length})
        </Label>
        <Input
          id="threshold"
          type="number"
          min={2}
          max={config.signatories.length}
          value={config.threshold}
          onChange={e =>
            setConfig({
              ...config,
              threshold: Math.max(
                2,
                Math.min(
                  parseInt(e.target.value) || 2,
                  config.signatories.length
                )
              ),
            })
          }
        />
        <p className="text-muted-foreground text-xs">
          Number of approvals required to execute a payment
        </p>
      </div>

      {/* Child Bounty Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">
                Child Bounty Configuration
              </CardTitle>
              <CardDescription>
                Settings for Polkadot child bounty payouts. Payouts are processed
                through the childBounties pallet for proper on-chain indexing.
              </CardDescription>
            </div>
            <MultisigDiscoveryModal
              network={config.network === 'kusama' ? 'polkadot' : config.network}
              initialBountyId={config.parentBountyId > 0 ? config.parentBountyId : undefined}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Parent Bounty ID */}
          <div className="space-y-2">
            <Label htmlFor="parentBountyId">Parent Bounty ID</Label>
            <div className="flex gap-2">
              <Input
                id="parentBountyId"
                type="number"
                min={0}
                placeholder="e.g., 42"
                value={config.parentBountyId}
                onChange={e =>
                  handleParentBountyIdChange(
                    Math.max(0, parseInt(e.target.value) || 0)
                  )
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchCurator}
                disabled={isFetchingCurator}
                className="shrink-0"
              >
                {isFetchingCurator ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isFetchingCurator ? 'Fetching...' : 'Fetch Curator'}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              The ID of the parent bounty on-chain. Click &quot;Fetch
              Curator&quot; to automatically load the curator address from the
              chain.
            </p>
            {bountyStatus && (
              <div
                className={`mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-xs ${
                  bountyStatus === 'Active'
                    ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                    : bountyStatus === 'not_found'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                }`}
              >
                {bountyStatus === 'Active' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>
                  {bountyStatus === 'not_found'
                    ? 'Bounty not found'
                    : `Bounty status: ${bountyStatus}`}
                </span>
              </div>
            )}
          </div>

          {/* Curator Proxy Address */}
          <div className="space-y-2">
            <Label htmlFor="curatorProxyAddress">Curator Address</Label>
            <div className="flex gap-2">
              <Input
                id="curatorProxyAddress"
                placeholder="Enter curator address, fetch from chain, or use multisig"
                value={config.curatorProxyAddress}
                onChange={e =>
                  setConfig({ ...config, curatorProxyAddress: e.target.value })
                }
              />
              {config.multisigAddress && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setConfig({
                      ...config,
                      curatorProxyAddress: config.multisigAddress,
                    })
                    toast({
                      title: 'Curator set to multisig',
                      description:
                        'The multisig address will be used as the curator. This is valid and will work with the current implementation.',
                    })
                  }}
                  disabled={
                    config.curatorProxyAddress === config.multisigAddress
                  }
                  className="shrink-0"
                >
                  Use Multisig
                </Button>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              The curator account for the parent bounty. You can use the
              multisig address directly as the curator, or use a separate proxy
              account controlled by the multisig. Click &quot;Use Multisig&quot;
              to set it to your multisig address, or &quot;Fetch Curator&quot;
              above to load from the chain.
            </p>
            {config.curatorProxyAddress === config.multisigAddress &&
              config.multisigAddress && (
                <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    Using multisig as curator. The multisig will approve and
                    execute curator actions as part of the child bounty bundle.
                  </span>
                </div>
              )}
          </div>

          {/* Info box about bounty setup */}
          <div className="bg-muted/50 rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">
              <strong>Note:</strong> Before using child bounty payouts, ensure
              your parent bounty is set up on-chain with an active curator. You
              can use the multisig address directly as the curator (click
              &quot;Use Multisig&quot;), or use a separate proxy account. The
              curator address can be fetched from the chain or set manually.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Approval Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval Workflow</CardTitle>
          <CardDescription>
            How review approvals relate to blockchain execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={config.approvalWorkflow}
            onValueChange={(value: 'merged' | 'separated') =>
              setConfig({ ...config, approvalWorkflow: value })
            }
          >
            <div className="space-y-4">
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="merged" id="merged" className="mt-0.5" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="merged" className="cursor-pointer">
                    Merged (Recommended)
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Review approval directly triggers blockchain signature.
                    Decision and execution happen in one step - more efficient.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem
                  value="separated"
                  id="separated"
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="separated" className="cursor-pointer">
                    Separated
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Review approval first, then separate blockchain signing
                    step. Two-phase process gives more control but requires more
                    transactions.
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Validation warning */}
      {!isValid && (
        <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
          <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600 dark:text-orange-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
              Configuration incomplete
            </p>
            <ul className="mt-1 list-inside list-disc text-xs text-orange-800 dark:text-orange-200">
              {!config.multisigAddress && <li>Multisig address is required</li>}
              {config.signatories.length < 2 && (
                <li>At least 2 signatories are required</li>
              )}
              {config.threshold < 2 && <li>Threshold must be at least 2</li>}
              {config.threshold > config.signatories.length && (
                <li>Threshold cannot exceed number of signatories</li>
              )}
              {!config.curatorProxyAddress && (
                <li>
                  Curator proxy address is required for child bounty payouts
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={!isValid || isSaving || isLoading}
        className="w-full"
        size="lg"
      >
        {(isSaving || isLoading) && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Save Multisig Configuration
      </Button>
    </div>
  )
}
