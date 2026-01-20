'use client'

import { ArrowLeft, Building2, Loader2, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { lookUpBountyAction, searchCommitteesAction } from '../actions'

interface CommitteeResult {
  id: number
  name: string
  description: string | null
  logoUrl: string | null
  focusAreas: string[] | null
  network?: string
  bountyId?: number
  memberCount: number
}

export default function ReviewerOnboardingPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [committees, setCommittees] = useState<CommitteeResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Bounty lookup state
  const [network, setNetwork] = useState<'polkadot' | 'paseo'>('paseo')
  const [bountyId, setBountyId] = useState('')
  const [isLookingUp, startLookup] = useTransition()
  const [lookupError, setLookupError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(searchQuery, 300)

  // Search committees when query changes
  useEffect(() => {
    async function search() {
      setIsSearching(true)
      try {
        const result = await searchCommitteesAction({ query: debouncedQuery })
        if ('success' in result && result.success && result.data) {
          setCommittees(result.data)
        }
      } catch (error) {
        console.error('Failed to search committees:', error)
      } finally {
        setIsSearching(false)
        setHasSearched(true)
      }
    }

    search()
  }, [debouncedQuery])

  const handleLookUpBounty = () => {
    if (!bountyId) return

    setLookupError(null)
    startLookup(async () => {
      const result = await lookUpBountyAction({
        network,
        bountyId: parseInt(bountyId, 10),
      })

      if (result.error) {
        setLookupError(result.error)
        return
      }

      if ('success' in result && result.success && result.data) {
        if (result.data.exists && 'committeeId' in result.data) {
          // Committee exists, redirect to join page
          router.push(
            `/onboarding/reviewer/join?committeeId=${result.data.committeeId}`
          )
        } else {
          // Bounty not in system, redirect to create page
          router.push(
            `/onboarding/reviewer/create?network=${network}&bountyId=${bountyId}`
          )
        }
      }
    })
  }

  const handleSelectCommittee = (committeeId: number) => {
    router.push(`/onboarding/reviewer/join?committeeId=${committeeId}`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/onboarding"
          className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Find Your Committee
        </h1>
        <p className="mt-1 text-gray-600">
          Search for an existing committee or enter your bounty details.
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Existing Committees</CardTitle>
          <CardDescription>
            Find and join a committee that&apos;s already registered on
            GrantFlow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by committee name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : committees.length > 0 ? (
            <div className="space-y-2">
              {committees.map(committee => (
                <button
                  key={committee.id}
                  onClick={() => handleSelectCommittee(committee.id)}
                  className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:border-orange-300 hover:bg-orange-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                      <Building2 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {committee.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {committee.network && committee.bountyId
                          ? `Bounty #${committee.bountyId} · ${committee.network.charAt(0).toUpperCase() + committee.network.slice(1)}`
                          : 'No bounty linked'}
                        {' · '}
                        {committee.memberCount} member
                        {committee.memberCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {committee.focusAreas && committee.focusAreas.length > 0 && (
                    <div className="hidden gap-1 sm:flex">
                      {committee.focusAreas.slice(0, 2).map(area => (
                        <Badge
                          key={area}
                          variant="secondary"
                          className="text-xs"
                        >
                          {area}
                        </Badge>
                      ))}
                      {committee.focusAreas.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{committee.focusAreas.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : hasSearched && searchQuery ? (
            <p className="py-4 text-center text-sm text-gray-500">
              No committees found matching &quot;{searchQuery}&quot;
            </p>
          ) : hasSearched ? (
            <p className="py-4 text-center text-sm text-gray-500">
              No committees registered yet. Enter your bounty details below to
              create the first one.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-50 px-2 text-gray-500">
            Or enter bounty details
          </span>
        </div>
      </div>

      {/* Bounty Lookup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Look Up by Bounty ID</CardTitle>
          <CardDescription>
            Enter your on-chain bounty ID to find or create a committee.
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
              <Label htmlFor="network">Network</Label>
              <Select
                value={network}
                onValueChange={v => setNetwork(v as 'polkadot' | 'paseo')}
              >
                <SelectTrigger id="network">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paseo">Paseo (Testnet)</SelectItem>
                  <SelectItem value="polkadot">Polkadot (Mainnet)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}

          <Button
            onClick={handleLookUpBounty}
            disabled={!bountyId || isLookingUp}
            className="w-full sm:w-auto"
          >
            {isLookingUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Looking up...
              </>
            ) : (
              'Look Up Bounty'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
