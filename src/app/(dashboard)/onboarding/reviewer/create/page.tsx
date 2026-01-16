'use client'

import {
  ConnectionStatus,
  useAccount,
  useApi,
  useConnect,
  useConnectors,
  useSwitchChain,
} from '@luno-kit/react'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle,
  Copy,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/lib/hooks/use-toast'
import { chains } from '@/lib/polkadot/chains'
import {
  isSignatory,
  normalizeToPolkadot,
  validateMultisigConfig,
} from '@/lib/polkadot/multisig-address'
import {
  discoverMultisigStructure,
  type MultisigStructure,
} from '@/lib/polkadot/multisig-discovery'
import { createCommitteeAction } from '../../actions'

type NetworkType = 'polkadot' | 'paseo'

interface SignatoryInput {
  address: string
}

export default function CreateCommitteePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Get network and bountyId from URL params
  const initialNetwork = (searchParams.get('network') as NetworkType) ?? 'paseo'
  const initialBountyId = searchParams.get('bountyId')

  // Form state - Step 1: Bounty
  const [network, setNetwork] = useState<NetworkType>(initialNetwork)
  const [bountyId, setBountyId] = useState(initialBountyId ?? '')

  // Discovery state
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [discoveredStructure, setDiscoveredStructure] =
    useState<MultisigStructure | null>(null)
  const [discoveryError, setDiscoveryError] = useState<string | null>(null)

  // Form state - Step 2: Committee Info
  const [committeeName, setCommitteeName] = useState('')
  const [description, setDescription] = useState('')
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [newFocusArea, setNewFocusArea] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [githubOrg, setGithubOrg] = useState('')

  // Form state - Step 3: Signatories
  const [signatories, setSignatories] = useState<SignatoryInput[]>([])
  const [threshold, setThreshold] = useState(2)
  const [newSignatory, setNewSignatory] = useState('')

  // Create state
  const [isPending, startTransition] = useTransition()
  const [createError, setCreateError] = useState<string | null>(null)

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

  const signatoryAddresses = signatories.map(s => s.address)

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

  // Can create committee?
  const canCreate =
    discoveredStructure &&
    committeeName.trim() &&
    validation?.valid &&
    walletIsSignatory &&
    connectedAddress

  // Handle bounty discovery
  const handleDiscover = async () => {
    const bountyIdNum = parseInt(bountyId, 10)
    if (isNaN(bountyIdNum) || bountyIdNum < 0) {
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

      const structure = await discoverMultisigStructure(client, bountyIdNum)

      if (!structure) {
        setDiscoveryError(
          `Bounty #${bountyIdNum} not found or has no curator on ${targetChain?.name ?? network}`
        )
        return
      }

      setDiscoveredStructure(structure)
      toast({
        title: 'Bounty Discovered',
        description: `Found bounty #${bountyIdNum} with status: ${structure.bountyStatus}`,
      })
    } catch (e) {
      console.error('[CreateCommittee] Discovery error:', e)
      setDiscoveryError(
        e instanceof Error ? e.message : 'Failed to discover bounty structure'
      )
    } finally {
      setIsDiscovering(false)
    }
  }

  // Handle adding focus area
  const handleAddFocusArea = () => {
    const trimmed = newFocusArea.trim()
    if (!trimmed || focusAreas.includes(trimmed)) return
    setFocusAreas([...focusAreas, trimmed])
    setNewFocusArea('')
  }

  // Handle adding signatory
  const handleAddSignatory = () => {
    const trimmed = newSignatory.trim()
    if (!trimmed) return

    const substrateAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/
    if (!substrateAddressRegex.exec(trimmed)) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Substrate address',
        variant: 'destructive',
      })
      return
    }

    const normalizedNew = normalizeToPolkadot(trimmed)
    const isDuplicate = signatoryAddresses.some(
      addr => normalizeToPolkadot(addr) === normalizedNew
    )
    if (isDuplicate) {
      toast({
        title: 'Duplicate Address',
        description: 'This address is already in the list',
        variant: 'destructive',
      })
      return
    }

    setSignatories([...signatories, { address: trimmed }])
    setNewSignatory('')
  }

  // Handle removing signatory
  const handleRemoveSignatory = (index: number) => {
    const newSignatories = signatories.filter((_, i) => i !== index)
    setSignatories(newSignatories)
    if (threshold > newSignatories.length && newSignatories.length >= 2) {
      setThreshold(newSignatories.length)
    }
  }

  // Handle wallet connection
  const handleConnectWallet = (connectorId: string) => {
    connect({ connectorId })
  }

  // Handle create committee
  const handleCreate = () => {
    if (!canCreate || !discoveredStructure || !connectedAddress) return

    setCreateError(null)
    startTransition(async () => {
      const result = await createCommitteeAction({
        name: committeeName.trim(),
        description: description.trim() || undefined,
        focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        githubOrg: githubOrg.trim() || undefined,
        network,
        parentBountyId: parseInt(bountyId, 10),
        curatorProxyAddress: discoveredStructure.curator.address,
        multisigAddress: discoveredStructure.effectiveMultisig,
        signatories: signatories.map(s => ({ address: s.address })),
        threshold,
        creatorWalletAddress: connectedAddress,
      })

      if ('error' in result && result.error) {
        setCreateError(result.error)
      } else if ('success' in result && result.success) {
        toast({
          title: 'Committee Created!',
          description: `${committeeName} is now live on GrantFlow`,
        })
        router.push('/dashboard')
      }
    })
  }

  // Copy address to clipboard
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedAddress(text)
    setTimeout(() => setCopiedAddress(null), 2000)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/onboarding/reviewer"
          className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Create New Committee
        </h1>
        <p className="mt-1 text-gray-600">
          Set up a new committee linked to your on-chain bounty.
        </p>
      </div>

      {/* Step 1: Bounty Discovery */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Bounty Discovery</CardTitle>
          <CardDescription>
            Verify the bounty details on-chain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bountyId">Bounty ID</Label>
              <Input
                id="bountyId"
                type="number"
                placeholder="e.g., 42"
                value={bountyId}
                onChange={e => setBountyId(e.target.value)}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Network</Label>
              <div className="flex h-9 items-center rounded-md border bg-gray-50 px-3 text-sm">
                {network === 'paseo' ? 'Paseo (Testnet)' : 'Polkadot (Mainnet)'}
              </div>
            </div>
          </div>

          <Button
            onClick={handleDiscover}
            disabled={!bountyId || isDiscovering}
          >
            {isDiscovering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Discovering...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Discover Bounty
              </>
            )}
          </Button>

          {discoveryError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{discoveryError}</AlertDescription>
            </Alert>
          )}

          {discoveredStructure && (
            <div className="space-y-3 rounded-md border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700">
                  Bounty #{discoveredStructure.bountyId} found
                </span>
                <Badge variant="outline" className="ml-auto">
                  {discoveredStructure.bountyStatus}
                </Badge>
              </div>
              {discoveredStructure.bountyDescription && (
                <p className="text-sm text-green-700">
                  {discoveredStructure.bountyDescription}
                </p>
              )}
              <div className="grid gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">
                    Curator (Pure Proxy)
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-white/50 px-2 py-1 text-xs">
                      {discoveredStructure.curator.address}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        copyToClipboard(discoveredStructure.curator.address)
                      }
                    >
                      {copiedAddress === discoveredStructure.curator.address ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">
                    Controlling Multisig
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-white/50 px-2 py-1 text-xs">
                      {discoveredStructure.effectiveMultisig}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        copyToClipboard(discoveredStructure.effectiveMultisig)
                      }
                    >
                      {copiedAddress ===
                      discoveredStructure.effectiveMultisig ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Committee Info (only show after discovery) */}
      {discoveredStructure && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Committee Information</CardTitle>
            <CardDescription>
              Enter details about your grant program.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="committeeName">
                Committee Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="committeeName"
                placeholder="e.g., Polkadot Developer Grants"
                value={committeeName}
                onChange={e => setCommitteeName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your grant program..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Focus Areas</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., DeFi, Infrastructure"
                  value={newFocusArea}
                  onChange={e => setNewFocusArea(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddFocusArea()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddFocusArea}
                  disabled={!newFocusArea.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {focusAreas.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {focusAreas.map(area => (
                    <Badge
                      key={area}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() =>
                        setFocusAreas(focusAreas.filter(a => a !== area))
                      }
                    >
                      {area} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website (optional)</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://..."
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="githubOrg">GitHub Organization (optional)</Label>
                <Input
                  id="githubOrg"
                  placeholder="e.g., polkadot-developers"
                  value={githubOrg}
                  onChange={e => setGithubOrg(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Signatories (only show after discovery) */}
      {discoveredStructure && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Configure Signatories</CardTitle>
            <CardDescription>
              Enter the wallet addresses that control the multisig.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <span className="text-sm text-gray-500">
                of {signatories.length || '?'} signatories required
              </span>
            </div>

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

            {signatories.length > 0 ? (
              <div className="space-y-2">
                {signatories.map((sig, index) => (
                  <div
                    key={sig.address}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <code className="text-xs">
                        {sig.address.slice(0, 8)}...{sig.address.slice(-6)}
                      </code>
                      {connectedAddress &&
                        isSignatory(connectedAddress, [sig.address]) && (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSignatory(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-gray-500">
                Add at least 2 signatory addresses.
              </div>
            )}

            {validation && (
              <div
                className={`rounded-md p-4 ${
                  validation.valid
                    ? 'border border-green-200 bg-green-50'
                    : 'border border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {validation.valid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`font-medium ${
                      validation.valid ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {validation.valid
                      ? 'Configuration Valid'
                      : 'Validation Failed'}
                  </span>
                </div>
                {!validation.valid && (
                  <p className="mt-2 text-sm text-red-600">
                    Signatories and threshold don&apos;t produce the expected
                    multisig address. Check your configuration.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Wallet Verification (only show when signatories valid) */}
      {validation?.valid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">4. Verify Your Membership</CardTitle>
            <CardDescription>
              Connect your wallet to prove you&apos;re a signatory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isWalletConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Select a wallet to connect:
                </p>
                <div className="flex flex-wrap gap-2">
                  {connectors.length > 0 ? (
                    connectors.map(connector => (
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
                        {getConnectorDisplayName(connector.id)}
                      </Button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No Polkadot wallet detected.{' '}
                      <a
                        href="https://www.talisman.xyz/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Install Talisman
                      </a>
                    </p>
                  )}
                </div>
              </div>
            ) : walletIsSignatory ? (
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">
                    Wallet Connected: {connectedAddress?.slice(0, 8)}...
                    {connectedAddress?.slice(-6)}
                  </p>
                  <p className="text-sm text-green-600">
                    You&apos;re a signatory. Ready to create!
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-700">
                    Wallet: {connectedAddress?.slice(0, 8)}...
                    {connectedAddress?.slice(-6)}
                  </p>
                  <p className="text-sm text-yellow-600">
                    This wallet is NOT a signatory. Connect a different wallet.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error display */}
      {createError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{createError}</AlertDescription>
        </Alert>
      )}

      {/* Create Button */}
      <Button
        onClick={handleCreate}
        disabled={!canCreate || isPending}
        className="w-full"
        size="lg"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Committee...
          </>
        ) : !discoveredStructure ? (
          'Discover bounty first'
        ) : !committeeName.trim() ? (
          'Enter committee name'
        ) : !validation?.valid ? (
          'Configure valid signatories'
        ) : !walletIsSignatory ? (
          'Connect signatory wallet'
        ) : (
          'Create Committee'
        )}
      </Button>
    </div>
  )
}
