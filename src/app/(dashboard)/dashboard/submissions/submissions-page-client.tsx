'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { MilestoneProgressBadge } from '@/components/submissions/milestone-progress-badge'
import type { UserSubmissions } from './actions'

function StatusBadge({ status }: { status: string }) {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    'in-review': 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-purple-100 text-purple-800',
    'changes-requested': 'bg-orange-100 text-orange-800',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colors[status as keyof typeof colors] ?? colors.draft
      }`}
    >
      {status.replace(/_|-/g, ' ').toUpperCase()}
    </span>
  )
}

type UserSubmission = UserSubmissions[number]

function SubmissionCard({ submission }: { submission: UserSubmission }) {
  // Ensure labels is always a string array
  // labels is stored as JSON string in DB, so we need to parse it
  const labels: string[] = (() => {
    if (!submission.labels) return []
    if (Array.isArray(submission.labels)) {
      return submission.labels.filter((l): l is string => typeof l === 'string')
    }
    if (typeof submission.labels === 'string') {
      try {
        const parsed = JSON.parse(submission.labels)
        return Array.isArray(parsed)
          ? parsed.filter((l): l is string => typeof l === 'string')
          : [submission.labels]
      } catch {
        return [submission.labels]
      }
    }
    return []
  })()

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">
              {submission.title ?? 'Untitled Submission'}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {submission.description ?? 'No description available'}
            </CardDescription>

            {/* Committee Badge */}
            {submission.reviewerGroup && (
              <div className="text-xs text-gray-600">
                Reviewed by: {submission.reviewerGroup.name}
              </div>
            )}

            {/* Milestone Progress */}
            <MilestoneProgressBadge
              milestones={submission.milestones ?? []}
              submissionStatus={submission.status}
              variant="compact"
            />
          </div>
          <StatusBadge status={submission.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Labels */}
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {labels.slice(0, 3).map((label: string) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                >
                  {label}
                </span>
              ))}
              {labels.length > 3 && (
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  +{labels.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Funding Amount */}
          {submission.totalAmount && (
            <div className="text-muted-foreground text-sm">
              <strong>Funding:</strong> $
              {submission.totalAmount.toLocaleString()}
            </div>
          )}

          {/* Submission Date */}
          <div className="text-muted-foreground text-sm">
            <strong>Submitted:</strong>{' '}
            {new Date(submission.createdAt).toLocaleDateString()}
          </div>

          {/* GitHub Repo Link */}
          {submission.githubRepoUrl && (
            <div className="text-sm">
              <a
                href={submission.githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                View Repository
              </a>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Link href={`/dashboard/submissions/${submission.id}`}>
              <Button variant="outline" size="sm">
                View Details & Discussion
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type FilterStatus = 'all' | 'active' | 'rejected'

interface SubmissionsPageClientProps {
  submissions: UserSubmissions
}

export function SubmissionsPageClient({
  submissions,
}: SubmissionsPageClientProps) {
  // Default filter is 'active' (approved + in-review + pending + changes-requested)
  const [filter, setFilter] = useState<FilterStatus>('active')

  // Filter submissions based on selected filter
  const filteredSubmissions = useMemo(() => {
    if (filter === 'all') {
      return submissions
    } else if (filter === 'active') {
      // Active = approved, in-review, pending, changes-requested
      return submissions.filter(s =>
        ['approved', 'in-review', 'pending', 'changes-requested'].includes(
          s.status
        )
      )
    } else if (filter === 'rejected') {
      return submissions.filter(s => s.status === 'rejected')
    }
    return submissions
  }, [submissions, filter])

  // Calculate stats
  const stats = {
    total: submissions.length,
    active: submissions.filter(s =>
      ['approved', 'in-review', 'pending', 'changes-requested'].includes(
        s.status
      )
    ).length,
    underReview: submissions.filter(
      s => s.status === 'pending' || s.status === 'in-review'
    ).length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    totalFunding: submissions.reduce((sum, s) => {
      return sum + (s.totalAmount ?? 0)
    }, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grant Submissions</h1>
          <p className="text-muted-foreground">
            Submit grant proposals and track their progress
          </p>
        </div>
        <Link href="/dashboard/submissions/new">
          <Button>New Submission</Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-muted-foreground text-xs">
                {stats.total === 0 ? 'No submissions yet' : 'All time'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-muted-foreground text-xs">
                In progress or under review
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-muted-foreground text-xs">
                Ready for milestones
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Funding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalFunding.toLocaleString()}
              </div>
              <p className="text-muted-foreground text-xs">Requested amount</p>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Submissions</CardTitle>
                <CardDescription>
                  Track the status of all your grant submissions
                </CardDescription>
              </div>
              {/* Filter Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={filter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('active')}
                >
                  Active
                  {stats.active > 0 && (
                    <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                      {stats.active}
                    </span>
                  )}
                </Button>
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'rejected' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('rejected')}
                >
                  Rejected
                  {stats.rejected > 0 && (
                    <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                      {stats.rejected}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven&apos;t submitted any grant proposals yet.
                </p>
                <Link href="/dashboard/submissions/new">
                  <Button>Create Your First Submission</Button>
                </Link>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No submissions found for the selected filter.
                </p>
                <Button variant="outline" onClick={() => setFilter('all')}>
                  View All Submissions
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredSubmissions.map(submission => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
