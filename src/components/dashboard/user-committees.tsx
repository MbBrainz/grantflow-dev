'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import type { Group } from '@/lib/db/schema'

interface UserCommitteesResponse {
  success: boolean
  memberships: {
    committee: Group
    role: string
    isActive: boolean
  }[]
  totalMemberships: number
  activeMemberships: number
}

interface UserCommitteesProps {
  userId: number
}

const fetcher = async (url: string): Promise<UserCommitteesResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch committees')

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return res.json()
}

export function UserCommittees({ userId }: UserCommitteesProps) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data, error, isLoading } = useSWR<UserCommitteesResponse>(
    `/api/user/committees?userId=${userId}`,
    fetcher
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Committees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Committees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load committees</p>
        </CardContent>
      </Card>
    )
  }

  const activeCommittees =
    data?.memberships.filter(m => m.isActive && m.committee.isActive) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Committees
          </div>
          {activeCommittees.length > 0 && (
            <Badge variant="secondary">{activeCommittees.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeCommittees.length > 0 ? (
          <div className="space-y-3">
            {activeCommittees.map(({ committee, role }) => (
              <Link
                key={committee.id}
                href={`/dashboard/committees/${committee.id}`}
              >
                <div className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {committee.logoUrl ? (
                      <Image
                        src={committee.logoUrl}
                        alt={`${committee.name} logo`}
                        className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                        width={40}
                        height={40}
                      />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">
                        {committee.name}
                      </p>
                      {committee.description && (
                        <p className="truncate text-sm text-gray-600">
                          {committee.description}
                        </p>
                      )}
                      <div className="mt-1 flex min-w-0 items-center gap-2">
                        <Badge
                          variant="outline"
                          className="flex-shrink-0 text-xs capitalize"
                        >
                          {role}
                        </Badge>
                        {committee.focusAreas &&
                          Array.isArray(committee.focusAreas) &&
                          committee.focusAreas.length > 0 && (
                            <span className="truncate text-xs text-gray-500">
                              {committee.focusAreas.slice(0, 2).join(', ')}
                              {committee.focusAreas.length > 2 &&
                                ` +${committee.focusAreas.length - 2}`}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                </div>
              </Link>
            ))}

            {activeCommittees.length > 3 && (
              <div className="mt-4 border-t pt-4">
                <Link href="/dashboard/committees">
                  <Button variant="outline" className="w-full" size="sm">
                    View All Committees
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              You are not a member of any committees yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
