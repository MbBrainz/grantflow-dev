'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Settings,
  ExternalLink,
  Github,
  DollarSign,
  Users,
  Shield,
  Wallet,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CommitteeWithDetails } from '@/lib/db/queries/committees'
import Image from 'next/image'
import type { SignatoryMapping } from '@/lib/db/schema/jsonTypes/GroupSettings'

interface CommitteeFinancials {
  totalBudget: number
  allocated: number
  spent: number
  remaining: number
  available: number
}

interface CommitteeDetailViewProps {
  committee: NonNullable<CommitteeWithDetails>
  isAdmin: boolean
  financials?: CommitteeFinancials | null
}

/**
 * Merged Members & Signatories Card
 * Shows committee members with signatory badges + external signatories
 */
function MembersAndSignatoriesCard({
  committee,
}: {
  committee: NonNullable<CommitteeWithDetails>
}) {
  const multisig = committee.settings?.multisig
  const signatories: SignatoryMapping[] = multisig?.signatories ?? []

  // Create a map of signatory addresses to their linked user IDs
  const signatoryAddressToUserId = new Map<string, number | undefined>()
  signatories.forEach(s => {
    signatoryAddressToUserId.set(s.address, s.userId)
  })

  // Find which members are signatories (by userId)
  const memberSignatoryMap = new Map<number, string>() // userId -> address
  signatories.forEach(s => {
    if (s.userId) {
      memberSignatoryMap.set(s.userId, s.address)
    }
  })

  // Find external signatories (those not linked to any member)
  const _linkedUserIds = new Set(signatories.map(s => s.userId).filter(Boolean))
  const memberUserIds = new Set(committee.members?.map(m => m.user.id) ?? [])
  const externalSignatories = signatories.filter(
    s => !s.userId || !memberUserIds.has(s.userId)
  )

  const hasMultisig = multisig && signatories.length > 0
  const hasMembers = committee.members && committee.members.length > 0

  if (!hasMembers && !hasMultisig) {
    return null
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5" />
          {hasMultisig ? 'Members & Signatories' : 'Committee Members'}
        </h2>
        {hasMultisig && (
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              {multisig.network === 'polkadot' ? 'Polkadot' : 'Paseo'}
            </Badge>
            <span className="text-muted-foreground">
              Threshold: {multisig.threshold} of {signatories.length}
            </span>
          </div>
        )}
      </div>

      {/* Members Grid */}
      {hasMembers && (
        <div className="grid gap-4 sm:grid-cols-2">
          {committee.members?.map(member => {
            const isSignatory = memberSignatoryMap.has(member.user.id)
            const signatoryAddress = memberSignatoryMap.get(member.user.id)

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                {member.user.avatarUrl ? (
                  <Image
                    src={member.user.avatarUrl ?? ''}
                    alt={member.user.name ?? ''}
                    className="h-10 w-10 rounded-full"
                    width={40}
                    height={40}
                  />
                ) : (
                  <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                    <Users className="text-muted-foreground h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{member.user.name}</p>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {member.role}
                    </Badge>
                    {isSignatory && (
                      <Badge
                        variant="secondary"
                        className="gap-1 text-xs text-green-700 dark:text-green-400"
                      >
                        <Shield className="h-3 w-3" />
                        Signatory
                      </Badge>
                    )}
                  </div>
                  {isSignatory && signatoryAddress && (
                    <code className="text-muted-foreground mt-1 block text-xs">
                      {signatoryAddress.slice(0, 8)}...
                      {signatoryAddress.slice(-6)}
                    </code>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* External Signatories (not linked to members) */}
      {hasMultisig && externalSignatories.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-muted-foreground mb-3 flex items-center gap-2 text-sm font-medium">
            <Wallet className="h-4 w-4" />
            External Signatories ({externalSignatories.length})
          </h3>
          <div className="space-y-2">
            {externalSignatories.map(signatory => (
              <div
                key={signatory.address}
                className="bg-muted/50 flex items-center justify-between rounded-md p-2"
              >
                <code className="text-xs">
                  {signatory.address.slice(0, 12)}...
                  {signatory.address.slice(-8)}
                </code>
                <Badge variant="outline" className="text-xs">
                  Not linked
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export function CommitteeDetailView({
  committee,
  isAdmin,
  financials,
}: CommitteeDetailViewProps) {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            {committee.logoUrl && (
              <Image
                src={committee.logoUrl ?? undefined}
                alt={committee.name}
                className="h-12 w-12 rounded-lg object-cover"
                width={48}
                height={48}
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{committee.name}</h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={committee.isActive ? 'default' : 'secondary'}>
                  {committee.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">Committee</Badge>
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/committees/${committee.id}/manage`)
            }
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Manage Committee
          </Button>
        )}
      </div>

      {/* Overview Card - Combined About, Links, and Focus Areas */}
      {(Boolean(committee.description) ||
        Boolean(committee.websiteUrl) ||
        Boolean(committee.githubOrg) ||
        (committee.focusAreas && Array.isArray(committee.focusAreas))) && (
        <Card className="p-6">
          <div className="space-y-5">
            {/* About */}
            {committee.description && (
              <div>
                <h2 className="mb-2 text-lg font-semibold">About</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {committee.description}
                </p>
              </div>
            )}

            {/* Links */}
            {(Boolean(committee.websiteUrl) ||
              Boolean(committee.githubOrg)) && (
              <div>
                <h2 className="mb-2 text-lg font-semibold">Links</h2>
                <div className="flex flex-wrap gap-3">
                  {committee.websiteUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={committee.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Website
                      </a>
                    </Button>
                  )}
                  {committee.githubOrg && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://github.com/${committee.githubOrg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <Github className="h-4 w-4" />
                        GitHub
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Focus Areas */}
            {committee.focusAreas && Array.isArray(committee.focusAreas) && (
              <div>
                <h2 className="mb-2 text-lg font-semibold">Focus Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {committee.focusAreas.map((area, idx) => (
                    <Badge key={idx} variant="secondary">
                      {typeof area === 'string' ? area : String(area)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Budget Information (Committee IS the grant program) */}
      {(financials ?? committee.fundingAmount) && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Budget Information</h2>
          </div>

          {/* Financial Summary */}
          {financials && (
            <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-5 dark:border-gray-700">
              <div>
                <p className="text-muted-foreground text-sm">Total Budget</p>
                <p className="text-lg font-semibold">
                  ${financials.totalBudget.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Allocated</p>
                <p className="text-lg font-semibold">
                  ${financials.allocated.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Spent</p>
                <p className="text-lg font-semibold">
                  ${financials.spent.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Remaining</p>
                <p className="text-lg font-semibold text-green-600">
                  ${financials.remaining.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Available</p>
                <p className="text-lg font-semibold text-blue-600">
                  ${financials.available.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Grant Size Limits */}
          {(committee.minGrantSize ?? committee.maxGrantSize) && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {committee.minGrantSize && (
                <div>
                  <p className="text-muted-foreground text-sm">Min Grant</p>
                  <p className="font-medium">
                    ${committee.minGrantSize.toLocaleString()}
                  </p>
                </div>
              )}
              {committee.maxGrantSize && (
                <div>
                  <p className="text-muted-foreground text-sm">Max Grant</p>
                  <p className="font-medium">
                    ${committee.maxGrantSize.toLocaleString()}
                  </p>
                </div>
              )}
              {committee.minMilestoneSize && (
                <div>
                  <p className="text-muted-foreground text-sm">Min Milestone</p>
                  <p className="font-medium">
                    ${committee.minMilestoneSize.toLocaleString()}
                  </p>
                </div>
              )}
              {committee.maxMilestoneSize && (
                <div>
                  <p className="text-muted-foreground text-sm">Max Milestone</p>
                  <p className="font-medium">
                    ${committee.maxMilestoneSize.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Members & Signatories */}
      <MembersAndSignatoriesCard committee={committee} />

      {/* Recent Submissions */}
      {committee.reviewingSubmissions &&
        committee.reviewingSubmissions.length > 0 && (
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Recent Submissions</h2>
            <div className="space-y-3">
              {committee.reviewingSubmissions.map(submission => (
                <Link
                  key={submission.id}
                  href={`/dashboard/submissions/${submission.id}`}
                  className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {submission.title || 'Untitled Submission'}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>By {submission.submitter?.name}</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        submission.status === 'approved'
                          ? 'default'
                          : submission.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {submission.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
    </div>
  )
}
