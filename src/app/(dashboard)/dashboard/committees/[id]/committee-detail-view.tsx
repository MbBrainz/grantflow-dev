'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Settings, ExternalLink, Github } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CommitteeWithDetails } from '@/lib/db/queries/committees'
import Image from 'next/image'
import { GrantProgramCard } from '@/components/committee/grant-program-card'

interface ProgramFinancials {
  programId: number
  totalBudget: number
  allocated: number
  spent: number
  remaining: number
  available: number
}

interface CommitteeDetailViewProps {
  committee: NonNullable<CommitteeWithDetails>
  isAdmin: boolean
  financialsMap: Map<number | undefined, ProgramFinancials | null | undefined>
}

export function CommitteeDetailView({
  committee,
  isAdmin,
  financialsMap,
}: CommitteeDetailViewProps) {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

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

      {/* Grant Programs */}
      {committee.grantPrograms && committee.grantPrograms.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Grant Programs</h2>
          <div className="space-y-3">
            {committee.grantPrograms
              .filter(program => program.isActive)
              .map(program => (
                <Link
                  key={program.id}
                  href={`/dashboard/programs/${program.id}`}
                  className="block transition-transform hover:scale-[1.01]"
                >
                  <GrantProgramCard
                    program={program}
                    variant="compact"
                    financials={financialsMap.get(program.id) ?? null}
                    showAdminActions={false}
                  />
                </Link>
              ))}
          </div>
        </Card>
      )}

      {/* Members */}
      {committee.members && committee.members.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Committee Members</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {committee.members.map(member => (
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
                ) : null}
                <div className="flex-1">
                  <p className="font-medium">{member.user.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {member.role}
                    </Badge>
                    {member.user.primaryRole && (
                      <Badge variant="secondary" className="text-xs">
                        {member.user.primaryRole}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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
                        {submission.grantProgram && (
                          <>
                            <span>•</span>
                            <span>{submission.grantProgram.name}</span>
                          </>
                        )}
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
