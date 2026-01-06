/**
 * Bounty Link Setup Component
 *
 * A bounty-first approach to committee configuration:
 * 1. User enters bounty ID + selects network
 * 2. System discovers curator (pure proxy) and multisig from chain
 * 3. User enters signatories + threshold
 * 4. System validates signatories produce the discovered multisig
 * 5. User must connect a wallet that is one of the signatories
 * 6. User selects workflow preferences
 * 7. Save configuration
 */

'use client'

import { useState, useMemo } from 'react'
import {
  useApi,
  useSwitchChain,
  useAccount,
  useConnect,
  useConnectors,
  ConnectionStatus,
} from '@luno-kit/react'
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
  CheckCircle,
  Search,
  Copy,
  Check,
  Wallet,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { chains } from '@/lib/polkadot/chains'
import {
  discoverMultisigStructure,
  type MultisigStructure,
} from '@/lib/polkadot/multisig-discovery'
import {
  validateMultisigConfig,
  isSignatory,
  getSignatoryIndex,
  normalizeToPolkadot,
} from '@/lib/polkadot/multisig-address'
import type {
  MultisigConfig,
  SignatoryMapping,
} from '@/lib/db/schema/jsonTypes/GroupSettings'

interface BountyLinkSetupProps {
  initialConfig?: Partial<MultisigConfig>
  onSave: (config: MultisigConfig) => Promise<void>
  isLoading?: boolean
  currentUserId?: number // Current user ID for self-linking
}

type NetworkType = 'polkadot' | 'paseo'

export function BountyLinkSetup({
  initialConfig,
  onSave,
  isLoading = false,
  currentUserId,
}: BountyLinkSetupProps) {
  const { toast } = useToast()

  // Network and bounty state
  const [network, setNetwork] = useState<NetworkType>(
    initialConfig?.network ?? 'paseo'
  )
  const [bountyId, setBountyId] = useState<number>(
    initialConfig?.parentBountyId ?? 0
  )

  // Discovery state
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [discoveredStructure, setDiscoveredStructure] =
    useState<MultisigStructure | null>(null)
  const [discoveryError, setDiscoveryError] = useState<string | null>(null)

  // Signatory state - now uses SignatoryMapping with optional userId
  const [signatories, setSignatories] = useState<SignatoryMapping[]>(
    initialConfig?.signatories ?? []
  )
  const [threshold, setThreshold] = useState<number>(
    initialConfig?.threshold ?? 1
  )
  const [newSignatory, setNewSignatory] = useState('')

  // Helper to get just the addresses from signatories
  const signatoryAddresses = signatories.map(s => s.address)

  // Workflow settings
  const [approvalWorkflow, setApprovalWorkflow] = useState<
    'merged' | 'separated'
  >(initialConfig?.approvalWorkflow ?? 'merged')

  // Saving state
  const [isSaving, setIsSaving] = useState(false)

  // Clipboard state
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  // Luno-kit hooks
  const { api: client } = useApi()
  const { switchChainAsync, currentChainId } = useSwitchChain()
  const { account, address: connectedAddress } = useAccount()
  const { connect, status: connectStatus } = useConnect()
  const connectors = useConnectors()

  const targetChain = chains[network]
  const isCorrectChain = currentChainId === targetChain?.genesisHash
  const isWalletConnected = !!account && !!connectedAddress
  const isConnecting = connectStatus === ConnectionStatus.Connecting

  // Validate signatories against discovered multisig
  const validation = useMemo(() => {
    if (
      !discoveredStructure?.effectiveMultisig ||
      signatoryAddresses.length < 2
    ) {
      return null
    }
    return validateMultisigConfig(
      discoveredStructure.effectiveMultisig,
      signatoryAddresses,
      threshold
    )
  }, [discoveredStructure, signatoryAddresses, threshold])

  // Check if connected wallet is a signatory
  const walletIsSignatory = useMemo(() => {
    if (!connectedAddress || signatoryAddresses.length === 0) return false
    return isSignatory(connectedAddress, signatoryAddresses)
  }, [connectedAddress, signatoryAddresses])

  const walletSignatoryIndex = useMemo(() => {
    if (!connectedAddress || signatoryAddresses.length === 0) return -1
    return getSignatoryIndex(connectedAddress, signatoryAddresses)
  }, [connectedAddress, signatoryAddresses])

  // Can save if: discovered, valid signatories, wallet is signatory
  const canSave =
    discoveredStructure &&
    validation?.valid &&
    walletIsSignatory &&
    signatories.length >= 2 &&
    threshold >= 1 &&
    threshold <= signatories.length

  // Handle bounty discovery
  const handleDiscover = async () => {
    if (bountyId < 0) {
      setDiscoveryError('Please enter a valid bounty ID')
      return
    }

    setIsDiscovering(true)
    setDiscoveryError(null)
    setDiscoveredStructure(null)

    try {
      // Switch chain if needed
      if (!isCorrectChain && targetChain) {
        toast({
          title: 'Switching Network',
          description: `Connecting to ${targetChain.name}...`,
        })
        await switchChainAsync({ chainId: targetChain.genesisHash })
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      if (!client) {
        setDiscoveryError('Not connected to blockchain. Please try again.')
        return
      }

      const structure = await discoverMultisigStructure(client, bountyId)

      if (!structure) {
        setDiscoveryError(
          `Bounty #${bountyId} not found or has no curator on ${targetChain?.name ?? network}`
        )
        return
      }

      setDiscoveredStructure(structure)
      toast({
        title: 'Bounty Discovered',
        description: `Found bounty #${bountyId} with status: ${structure.bountyStatus}`,
      })
    } catch (e) {
      console.error('[BountyLinkSetup] Discovery error:', e)
      setDiscoveryError(
        e instanceof Error ? e.message : 'Failed to discover bounty structure'
      )
    } finally {
      setIsDiscovering(false)
    }
  }

  // Handle adding signatory
  const handleAddSignatory = () => {
    const trimmed = newSignatory.trim()
    if (!trimmed) return

    // Basic validation for Substrate address format
    const substrateAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/
    if (!substrateAddressRegex.exec(trimmed)) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Substrate address',
        variant: 'destructive',
      })
      return
    }

    // Check for duplicates (comparing normalized addresses)
    const normalizedNew = normalizeToPolkadot(trimmed)
    const isDuplicate = signatoryAddresses.some(
      addr => normalizeToPolkadot(addr) === normalizedNew
    )
    if (isDuplicate) {
      toast({
        title: 'Duplicate Address',
        description: 'This address is already in the signatories list',
        variant: 'destructive',
      })
      return
    }

    // Create SignatoryMapping - check if this is the current user's wallet
    const newMapping: SignatoryMapping = {
      address: trimmed,
      // Auto-link if connected wallet matches and we have currentUserId
      userId:
        connectedAddress &&
        currentUserId &&
        normalizeToPolkadot(connectedAddress) === normalizedNew
          ? currentUserId
          : undefined,
    }

    setSignatories([...signatories, newMapping])
    setNewSignatory('')
  }

  // Handle removing signatory
  const handleRemoveSignatory = (index: number) => {
    const newSignatories = signatories.filter((_, i) => i !== index)
    setSignatories(newSignatories)
    // Adjust threshold if needed
    if (threshold > newSignatories.length && newSignatories.length >= 2) {
      setThreshold(newSignatories.length)
    }
  }

  // Handle wallet connection
  const handleConnectWallet = (connectorId: string) => {
    connect({ connectorId })
  }

  // Handle save
  const handleSave = async () => {
    if (!canSave || !discoveredStructure) return

    setIsSaving(true)
    try {
      const config: MultisigConfig = {
        network,
        parentBountyId: bountyId,
        curatorProxyAddress: discoveredStructure.curator.address,
        multisigAddress: discoveredStructure.effectiveMultisig,
        signatories,
        threshold,
        approvalWorkflow,
        votingTimeoutBlocks: 50400, // ~7 days
        automaticExecution: true,
      }

      await onSave(config)
      toast({
        title: 'Configuration Saved',
        description: 'Bounty link setup completed successfully',
      })
    } catch (e) {
      console.error('[BountyLinkSetup] Save error:', e)
      toast({
        title: 'Save Failed',
        description:
          e instanceof Error ? e.message : 'Failed to save configuration',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Copy address to clipboard
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedAddress(text)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  // Address display helper
  const AddressDisplay = ({
    label,
    address,
    showCopy = true,
  }: {
    label: string
    address: string
    showCopy?: boolean
  }) => (
    <div className="space-y-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <code className="bg-muted flex-1 truncate rounded px-2 py-1 text-xs">
          {address}
        </code>
        {showCopy && (
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
        )}
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
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Step 1: Bounty Discovery */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link to Bounty</CardTitle>
          <CardDescription>
            Enter the bounty ID to discover the curator and multisig structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Network Selection */}
          <div className="space-y-2">
            <Label>Network</Label>
            <RadioGroup
              value={network}
              onValueChange={(v: NetworkType) => {
                setNetwork(v)
                setDiscoveredStructure(null)
                setDiscoveryError(null)
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paseo" id="paseo" />
                <Label htmlFor="paseo" className="cursor-pointer">
                  Paseo (Testnet)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="polkadot" id="polkadot" />
                <Label htmlFor="polkadot" className="cursor-pointer">
                  Polkadot (Mainnet)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Bounty ID */}
          <div className="space-y-2">
            <Label htmlFor="bountyId">Bounty ID</Label>
            <div className="flex gap-2">
              <Input
                id="bountyId"
                type="number"
                min={0}
                placeholder="e.g., 31"
                value={bountyId || ''}
                onChange={e => setBountyId(parseInt(e.target.value) || 0)}
                onKeyDown={e => e.key === 'Enter' && handleDiscover()}
                className="flex-1"
              />
              <Button onClick={handleDiscover} disabled={isDiscovering}>
                {isDiscovering ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Discover
              </Button>
            </div>
          </div>

          {/* Discovery Error */}
          {discoveryError && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {discoveryError}
            </div>
          )}

          {/* Discovered Structure */}
          {discoveredStructure && (
            <div className="space-y-3 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-700 dark:text-green-300">
                  Bounty #{discoveredStructure.bountyId} found
                </span>
                <Badge variant="outline" className="ml-auto">
                  {discoveredStructure.bountyStatus}
                </Badge>
              </div>
              {discoveredStructure.bountyDescription && (
                <p className="text-sm text-green-700 dark:text-green-300">
                  {discoveredStructure.bountyDescription}
                </p>
              )}
              <div className="grid gap-3">
                <AddressDisplay
                  label="Curator (Pure Proxy)"
                  address={discoveredStructure.curator.address}
                />
                <AddressDisplay
                  label="Controlling Multisig"
                  address={discoveredStructure.effectiveMultisig}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Signatories (only show after discovery) */}
      {discoveredStructure && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signatories</CardTitle>
            <CardDescription>
              Enter the wallet addresses that control the multisig. These must
              produce the discovered multisig address when combined with the
              threshold.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Threshold */}
            <div className="flex items-center gap-4">
              <Label>Threshold:</Label>
              <Input
                type="number"
                min={1}
                max={Math.max(signatories.length, 1)}
                value={threshold}
                onChange={e =>
                  setThreshold(
                    Math.max(
                      1,
                      Math.min(
                        parseInt(e.target.value) || 1,
                        signatories.length || 1
                      )
                    )
                  )
                }
                className="w-20"
              />
              <span className="text-muted-foreground text-sm">
                of {signatories.length || '?'} signatories required
              </span>
            </div>

            {/* Add signatory */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter wallet address"
                value={newSignatory}
                onChange={e => setNewSignatory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSignatory()}
                className="flex-1"
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
            {signatories.length > 0 ? (
              <div className="space-y-2">
                {signatories.map((signatory, index) => (
                  <div
                    key={signatory.address}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <code className="text-xs">
                        {signatory.address.slice(0, 8)}...
                        {signatory.address.slice(-6)}
                      </code>
                      {connectedAddress &&
                        isSignatory(connectedAddress, [signatory.address]) && (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        )}
                      {signatory.userId && (
                        <Badge variant="default" className="text-xs">
                          Linked
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Link to user button - only show for current user's address */}
                      {connectedAddress &&
                        currentUserId &&
                        isSignatory(connectedAddress, [signatory.address]) &&
                        !signatory.userId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updated = [...signatories]
                              updated[index] = {
                                ...signatory,
                                userId: currentUserId,
                              }
                              setSignatories(updated)
                              toast({
                                title: 'Address Linked',
                                description:
                                  'This signatory is now linked to your account',
                              })
                            }}
                          >
                            Link to me
                          </Button>
                        )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSignatory(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
                No signatories added yet. Add at least 2 addresses.
              </div>
            )}

            {/* Validation Result */}
            {validation && (
              <div
                className={`rounded-md p-4 ${
                  validation.valid
                    ? 'border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                    : 'border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                }`}
              >
                <div className="flex items-center gap-2">
                  {validation.valid ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`font-medium ${
                      validation.valid
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}
                  >
                    {validation.valid
                      ? 'Configuration Valid'
                      : 'Validation Failed'}
                  </span>
                </div>
                {!validation.valid && (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Computed: {validation.computedAddress.slice(0, 16)}...
                    </p>
                    <p className="text-muted-foreground">
                      Expected: {validation.expectedAddress.slice(0, 16)}...
                    </p>
                    <p className="text-red-600 dark:text-red-400">
                      Check that signatories and threshold are correct.
                    </p>
                  </div>
                )}
                {validation.valid && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    Signatories ({threshold}/{signatoryAddresses.length})
                    correctly produce the multisig address.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Wallet Verification (only show after valid signatories) */}
      {validation?.valid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verify Ownership</CardTitle>
            <CardDescription>
              Connect a wallet that is one of the signatories to save this
              configuration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isWalletConnected ? (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Select a wallet extension to connect:
                </p>
                <div className="flex flex-wrap gap-2">
                  {connectors.map(connector => (
                    <Button
                      key={connector.id}
                      variant="outline"
                      onClick={() => handleConnectWallet(connector.id)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wallet className="mr-2 h-4 w-4" />
                      )}
                      {connector.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : walletIsSignatory ? (
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-300">
                    Wallet Connected: {connectedAddress?.slice(0, 8)}...
                    {connectedAddress?.slice(-6)}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    You are signatory #{walletSignatoryIndex}. You can save this
                    configuration.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-300">
                    Wallet Connected: {connectedAddress?.slice(0, 8)}...
                    {connectedAddress?.slice(-6)}
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    This wallet is NOT one of the signatories. Connect a
                    different wallet to save.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Workflow Settings (only show when ready to save) */}
      {canSave && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow Settings</CardTitle>
            <CardDescription>
              Configure how review approvals relate to blockchain execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={approvalWorkflow}
              onValueChange={(v: 'merged' | 'separated') =>
                setApprovalWorkflow(v)
              }
            >
              <div className="space-y-4">
                <div className="flex items-start space-x-3 rounded-lg border p-4">
                  <RadioGroupItem
                    value="merged"
                    id="merged"
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="merged" className="cursor-pointer">
                      Merged (Recommended)
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Review approval directly triggers blockchain signature.
                      Decision and execution happen in one step.
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
                      step. Two-phase process gives more control.
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={!canSave || isSaving || isLoading}
        className="w-full"
        size="lg"
      >
        {(isSaving || isLoading) && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!discoveredStructure
          ? 'Discover bounty first'
          : !validation?.valid
            ? 'Configure valid signatories'
            : !walletIsSignatory
              ? 'Connect signatory wallet'
              : 'Save Configuration'}
      </Button>
    </div>
  )
}
