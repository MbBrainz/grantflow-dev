'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { GrantProgramWithDetails } from '@/lib/db/queries/grant-programs'
import Image from 'next/image'

interface GrantProgramDetailViewProps {
  program: NonNullable<GrantProgramWithDetails>
  isAdmin: boolean
}

export function GrantProgramDetailView({
  program,
  isAdmin,
}: GrantProgramDetailViewProps) {
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
            <h1 className="text-3xl font-bold">{program.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={program.isActive ? 'default' : 'secondary'}>
                {program.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {program.fundingAmount && (
                <Badge variant="outline">
                  ${program.fundingAmount.toLocaleString()} funding
                </Badge>
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/programs/${program.id}/manage`)
            }
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Manage Program
          </Button>
        )}
      </div>

      {/* Description */}
      {program.description && (
        <Card className="p-6">
          <h2 className="mb-3 text-lg font-semibold">About</h2>
          <p className="text-gray-700 dark:text-gray-300">
            {program.description}
          </p>
        </Card>
      )}

      {/* Managed by Committee */}
      {program.group && (
        <Card className="p-6">
          <h2 className="mb-3 text-lg font-semibold">Managed by</h2>
          <Link
            href={`/dashboard/committees/${program.group.id}`}
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {program.group.logoUrl && (
              <Image
                src={program.group.logoUrl ?? undefined}
                alt={program.group.name}
                className="h-12 w-12 rounded-lg object-cover"
                width={48}
                height={48}
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{program.group.name}</h3>
              {program.group.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {program.group.description}
                </p>
              )}
            </div>
            <Badge variant="outline">Committee</Badge>
          </Link>
        </Card>
      )}

      {/* Requirements */}
      {program.requirements && (
        <Card className="p-6">
          <h2 className="mb-3 text-lg font-semibold">Requirements</h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {program.requirements}
            </p>
          </div>
        </Card>
      )}

      {/* Committee Members */}
      {program.group?.members && program.group.members.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Committee Members</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {program.group.members.map(member => (
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
      {program.submissions && program.submissions.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Submissions</h2>
            <Badge variant="outline">{program.submissions.length} total</Badge>
          </div>
          <div className="space-y-3">
            {program.submissions.map(submission => (
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
                      {submission.submitterGroup && (
                        <>
                          <span>•</span>
                          <span>{submission.submitterGroup.name}</span>
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
