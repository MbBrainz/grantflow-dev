'use client'

import { DollarSign, Globe, Search, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type CommitteeWithStats = {
  id: number
  name: string
  description: string | null
  logoUrl: string | null
  type: string
  focusAreas: string[] | null
  websiteUrl: string | null
  githubOrg: string | null
  walletAddress: string | null
  isActive: boolean
  fundingAmount: number | null
  minGrantSize: number | null
  maxGrantSize: number | null
  createdAt: Date
  updatedAt: Date
  stats: {
    totalSubmissions: number
    approvedSubmissions: number
    approvalRate: number
    totalFunding: number
    activeMembers: number
  }
}

function CommitteeCard({ committee }: { committee: CommitteeWithStats }) {
  const focusAreas = committee.focusAreas ?? []

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start gap-4">
          {committee.logoUrl ? (
            <Image
              src={committee.logoUrl}
              alt={`${committee.name} logo`}
              width={48}
              height={48}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Users className="h-6 w-6" />
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg">{committee.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {committee.description ?? 'No description available'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Focus Areas */}
          {focusAreas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {focusAreas.slice(0, 3).map((area: string) => (
                <span
                  key={area}
                  className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                >
                  {area}
                </span>
              ))}
              {focusAreas.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  +{focusAreas.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium">
                  ${(committee.stats.totalFunding || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Total Funding</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-medium">
                  {committee.stats.activeMembers}
                </div>
                <div className="text-xs text-gray-500">Reviewers</div>
              </div>
            </div>
          </div>

          {/* Approval Stats */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className="text-gray-600">Approval Rate</span>
            <span className="font-medium text-green-600">
              {committee.stats.approvalRate}%
            </span>
          </div>

          {/* Grant Size Range */}
          {(committee.minGrantSize || committee.maxGrantSize) && (
            <div className="text-xs text-gray-500">
              Grant Range: ${(committee.minGrantSize || 0).toLocaleString()} - $
              {(committee.maxGrantSize || 0).toLocaleString()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Link
              href={`/dashboard/committees/${committee.id}`}
              className="flex-1"
            >
              <Button variant="default" size="sm" className="w-full">
                View Committee
              </Button>
            </Link>
            {committee.websiteUrl && (
              <a
                href={committee.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <Globe className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CommitteesPageClientProps {
  committees: CommitteeWithStats[]
}

export function CommitteesPageClient({
  committees,
}: CommitteesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter committees based on search
  const filteredCommittees = useMemo(() => {
    if (!searchQuery.trim()) return committees

    const query = searchQuery.toLowerCase()
    return committees.filter(
      committee =>
        committee.name.toLowerCase().includes(query) ||
        committee.description?.toLowerCase().includes(query) ||
        committee.focusAreas?.some(area => area.toLowerCase().includes(query))
    )
  }, [committees, searchQuery])

  // Calculate aggregate stats
  const stats = useMemo(
    () => ({
      totalCommittees: committees.length,
      totalFunding: committees.reduce(
        (sum, c) => sum + (c.stats.totalFunding || 0),
        0
      ),
      totalSubmissions: committees.reduce(
        (sum, c) => sum + c.stats.totalSubmissions,
        0
      ),
      avgApprovalRate:
        committees.length > 0
          ? Math.round(
              committees.reduce((sum, c) => sum + c.stats.approvalRate, 0) /
                committees.length
            )
          : 0,
    }),
    [committees]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grant Committees</h1>
          <p className="text-muted-foreground">
            Discover committees and find the right grant program for your
            project
          </p>
        </div>
        <Link href="/dashboard/submissions/new">
          <Button>Submit Application</Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Committees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCommittees}</div>
            <p className="text-xs text-muted-foreground">
              Accepting applications
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalFunding.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Available across programs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">Submitted to date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Approval Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgApprovalRate}%</div>
            <p className="text-xs text-muted-foreground">
              Across all committees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search committees by name, description, or focus area..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Committees Grid */}
      {filteredCommittees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {committees.length === 0 ? (
              <>
                <p className="text-muted-foreground mb-4">
                  No grant committees available yet.
                </p>
                <Link href="/onboarding/reviewer/create">
                  <Button>Create the First Committee</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">
                  No committees match your search criteria.
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCommittees.map(committee => (
            <CommitteeCard key={committee.id} committee={committee} />
          ))}
        </div>
      )}
    </div>
  )
}
