'use client'

import {
  ConnectionStatus,
  useAccount,
  useConnect,
  useConnectors,
} from '@luno-kit/react'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle,
  ExternalLink,
  Loader2,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/lib/hooks/use-toast'
import {
  getCommitteeForJoiningAction,
  verifyWalletAndJoinAction,
} from '../../actions'

interface CommitteeData {
  id: number
  name: string
  description: string | null
  logoUrl: string | null
  focusAreas: string[] | null
  websiteUrl: string | null
  githubOrg: string | null
  network?: string
  bountyId?: number
  signatories: Array<{
    address: string
    userId?: number
    user?: {
      id: number
      name: string | null
      email: string | null
    } | null
  }>
  memberCount: number
}

type JoinStatus = 'idle' | 'verifying' | 'success' | 'error'

export default function JoinCommitteePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const committeeId = searchParams.get('committeeId')
  const { toast } = useToast()

  const [committee, setCommittee] = useState<CommitteeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [joinStatus, setJoinStatus] = useState<JoinStatus>('idle')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [errorSignatories, setErrorSignatories] = useState<string[]>([])

  // Wallet connection
  const { connect, status: connectStatus } = useConnect()
  const { account, address } = useAccount()
  const connectors = useConnectors()
  const isConnecting = connectStatus === ConnectionStatus.Connecting
  const isConnected = !!account && !!address

  const [isPending, startTransition] = useTransition()

  // Load committee data
  useEffect(() => {
    async function loadCommittee() {
      if (!committeeId) {
        setLoadError('No committee ID provided')
        setIsLoading(false)
        return
      }

      try {
        const result = await getCommitteeForJoiningAction({
          committeeId: parseInt(committeeId, 10),
        })

        if ('error' in result && result.error) {
          setLoadError(result.error)
        } else if ('success' in result && result.success && result.data) {
          setCommittee(result.data as CommitteeData)
        }
      } catch (error) {
        console.error('Failed to load committee:', error)
        setLoadError('Failed to load committee')
      } finally {
        setIsLoading(false)
      }
    }

    loadCommittee()
  }, [committeeId])

  const handleConnect = (connectorId: string) => {
    try {
      connect({ connectorId })
    } catch (err) {
      console.error('Failed to connect wallet:', err)
      toast({
        title: 'Connection failed',
        description:
          err instanceof Error ? err.message : 'Failed to connect wallet',
        variant: 'destructive',
      })
    }
  }

  const handleVerifyAndJoin = () => {
    if (!address || !committeeId) return

    setJoinStatus('verifying')
    setJoinError(null)
    setErrorSignatories([])

    startTransition(async () => {
      const result = await verifyWalletAndJoinAction({
        committeeId: parseInt(committeeId, 10),
        walletAddress: address,
      })

      if ('error' in result && result.error) {
        setJoinStatus('error')
        setJoinError(result.error)
        if ('data' in result && result.data && 'signatories' in result.data) {
          setErrorSignatories(result.data.signatories as string[])
        }
      } else if ('success' in result && result.success) {
        setJoinStatus('success')
        toast({
          title: 'Successfully joined!',
          description: `You are now a member of ${committee?.name}`,
        })
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (loadError || !committee) {
    return (
      <div className="space-y-4">
        <Link
          href="/onboarding/reviewer"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {loadError ?? 'Committee not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
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
          Back to Search
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Join {committee.name}
        </h1>
      </div>

      {/* Committee Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Building2 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <CardTitle>{committee.name}</CardTitle>
              <CardDescription>
                {committee.network && committee.bountyId
                  ? `Bounty #${committee.bountyId} on ${committee.network.charAt(0).toUpperCase() + committee.network.slice(1)}`
                  : 'No bounty linked'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {committee.description && (
            <p className="text-sm text-gray-600">{committee.description}</p>
          )}

          {committee.focusAreas && committee.focusAreas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {committee.focusAreas.map(area => (
                <Badge key={area} variant="secondary">
                  {area}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-4 text-sm text-gray-500">
            {committee.websiteUrl && (
              <a
                href={committee.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center hover:text-gray-700"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Website
              </a>
            )}
            {committee.githubOrg && (
              <a
                href={`https://github.com/${committee.githubOrg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center hover:text-gray-700"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                GitHub
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wallet Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verify Your Membership</CardTitle>
          <CardDescription>
            Connect your wallet to verify you are one of the signatories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Signatories List */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              Current Signatories:
            </p>
            <div className="space-y-2">
              {committee.signatories.map((sig, index) => (
                <div
                  key={sig.address}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
                >
                  <code className="text-xs text-gray-600">
                    {sig.address.slice(0, 12)}...{sig.address.slice(-8)}
                  </code>
                  {sig.user ? (
                    <Badge variant="outline" className="text-xs">
                      {sig.user.name ?? sig.user.email ?? 'Linked'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Not linked
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Success State */}
          {joinStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Verified!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your wallet matches a signatory. You&apos;re now a member of{' '}
                {committee.name}. Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          )}

          {/* Error State */}
          {joinStatus === 'error' && joinError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wallet Not Found</AlertTitle>
              <AlertDescription>
                <p>{joinError}</p>
                {errorSignatories.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm">
                      Please connect a wallet that matches one of these
                      addresses:
                    </p>
                    <ul className="mt-1 space-y-1">
                      {errorSignatories.map(addr => (
                        <li key={addr}>
                          <code className="text-xs">
                            {addr.slice(0, 12)}...{addr.slice(-8)}
                          </code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Wallet Connection / Verify Button */}
          {joinStatus !== 'success' && (
            <div className="flex flex-col gap-3 sm:flex-row">
              {isConnected ? (
                <>
                  <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Connected: {address?.slice(0, 8)}...{address?.slice(-6)}
                  </div>
                  <Button
                    onClick={handleVerifyAndJoin}
                    disabled={isPending || joinStatus === 'verifying'}
                  >
                    {isPending || joinStatus === 'verifying' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Join'
                    )}
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button disabled={isConnecting}>
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="mr-2 h-4 w-4" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Select Wallet</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {connectors.length > 0 ? (
                      connectors.map(connector => (
                        <DropdownMenuItem
                          key={connector.id}
                          onClick={() => handleConnect(connector.id)}
                          className="cursor-pointer"
                        >
                          {getConnectorDisplayName(connector.id)}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-center text-sm text-gray-500">
                        No Polkadot wallet detected.{' '}
                        <a
                          href="https://www.talisman.xyz/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Install Talisman
                        </a>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
