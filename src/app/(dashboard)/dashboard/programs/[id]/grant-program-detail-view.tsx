'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { GrantProgramWithDetails } from '@/lib/db/queries/grant-programs'
import { GrantProgramCard } from '@/components/committee/grant-program-card'
import Image from 'next/image'

interface ProgramFinancials {
  programId: number
  totalBudget: number
  allocated: number
  spent: number
  remaining: number
  available: number
}

interface GrantProgramDetailViewProps {
  program: NonNullable<GrantProgramWithDetails>
  financials: ProgramFinancials | null
}

export function GrantProgramDetailView({
  program,
  financials,
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
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={program.isActive ? 'default' : 'secondary'}>
                {program.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {program.group && (
                <Link href={`/dashboard/committees/${program.group.id}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    {program.group.name}
                  </Badge>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Program Overview Card */}
      <GrantProgramCard
        program={program}
        financials={financials}
        showAdminActions={false}
      />

      {/* Committee Members */}
      {program.group?.members && program.group.members.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Committee Members</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {program.group.members.map(member => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                {member.user.avatarUrl && (
                  <Image
                    src={member.user.avatarUrl}
                    alt={member.user.name ?? ''}
                    className="h-10 w-10 rounded-full"
                    width={40}
                    height={40}
                  />
                )}
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
          <h2 className="mb-4 text-xl font-semibold">Recent Submissions</h2>
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
                      {submission.totalAmount && (
                        <>
                          <span>•</span>
                          <span>
                            ${submission.totalAmount.toLocaleString()}
                          </span>
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
