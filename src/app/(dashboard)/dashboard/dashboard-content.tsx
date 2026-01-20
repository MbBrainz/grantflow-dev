'use client'

import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Gavel,
  Loader2,
  MessageSquare,
  PlusCircle,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import useSWR from 'swr'
import { UserCommittees } from '@/components/dashboard/user-committees'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { User } from '@/lib/db/schema'

type UserData = Pick<User, 'id' | 'name' | 'email' | 'primaryRole'> & {
  role: string // API-specific field for compatibility
}

interface DashboardStatsType {
  submissions: {
    total: number
    pending: number
    approved: number
    inReview: number
  }
  milestones: {
    total: number
    completed: number
    inProgress: number
    pending: number
  }
  committees: { active: number; isReviewer: boolean }
  recentActivity: {
    type: string
    project: string
    time: string
  }[]
  upcomingDeadlines?: {
    id: number
    title: string
    project: string
    dueDate: string
    status: string
    urgent: boolean
  }[]
}

const fetcher = async (url: string): Promise<UserData> => {
  const res = await fetch(url)
  return res.json() as Promise<UserData>
}

function UserProfile() {
  const result = useSWR<UserData>('/api/user', fetcher)
  const user = result.data
  const error = result.error as Error | undefined

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load user data</p>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
              <div className="h-3 w-48 animate-pulse rounded bg-gray-200"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const userInitials =
    user.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase() ??
    user.email?.[0]?.toUpperCase() ??
    'U'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <span className="text-lg font-semibold text-blue-600">
              {userInitials}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {user.name ?? 'Anonymous'}
            </h2>
            <p className="text-sm text-gray-600">{user.email}</p>
            <Badge variant="outline" className="mt-1 capitalize">
              {user.role}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

function RecentActivity({
  activities,
}: {
  activities: DashboardStatsType['recentActivity']
}) {
  const getActivityInfo = (type: string) => {
    switch (type) {
      case 'milestone_completed':
        return {
          title: 'Milestone completed',
          icon: CheckCircle,
          color: 'text-green-600',
        }
      case 'vote_cast':
        return {
          title: 'Vote cast',
          icon: MessageSquare,
          color: 'text-blue-600',
        }
      case 'submission_approved':
        return {
          title: 'Submission approved',
          icon: CheckCircle,
          color: 'text-green-600',
        }
      case 'submission_rejected':
        return {
          title: 'Submission rejected',
          icon: AlertCircle,
          color: 'text-red-600',
        }
      default:
        return {
          title: 'Activity',
          icon: Activity,
          color: 'text-orange-600',
        }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <>
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const activityInfo = getActivityInfo(activity.type)
                const Icon = activityInfo.icon
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`rounded-full bg-gray-100 p-2 ${activityInfo.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {activityInfo.title}
                      </p>
                      <p className="truncate text-sm text-gray-600">
                        {activity.project}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 border-t pt-4">
              <Link href="/dashboard/activity">
                <Button variant="outline" className="w-full" size="sm">
                  View All Activity
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">No recent activity</p>
        )}
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  const result = useSWR<UserData>('/api/user', fetcher)
  const user = result.data
  const isReviewer = user?.role === 'committee' || user?.role === 'admin'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {!isReviewer && (
            <Link href="/dashboard/submissions/new">
              <Button className="flex h-16 w-full flex-col items-center justify-center space-y-2">
                <PlusCircle className="h-6 w-6" />
                <span>New Submission</span>
              </Button>
            </Link>
          )}

          <Link href="/dashboard/submissions">
            <Button
              variant="outline"
              className="flex h-16 w-full flex-col items-center justify-center space-y-2"
            >
              <FileText className="h-6 w-6" />
              <span>
                {isReviewer ? 'Review Submissions' : 'View Submissions'}
              </span>
            </Button>
          </Link>

          {isReviewer && (
            <Link href="/dashboard/review">
              <Button className="flex h-16 w-full flex-col items-center justify-center space-y-2">
                <Gavel className="h-6 w-6" />
                <span>Reviewer Dashboard</span>
              </Button>
            </Link>
          )}

          <Link href="/dashboard/activity">
            <Button
              variant="outline"
              className="flex h-16 w-full flex-col items-center justify-center space-y-2"
            >
              <Activity className="h-6 w-6" />
              <span>Activity Feed</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function UpcomingDeadlines({
  deadlines,
}: {
  deadlines: DashboardStatsType['upcomingDeadlines']
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deadlines && deadlines.length > 0 ? (
          <div className="space-y-3">
            {deadlines.map(deadline => (
              <div
                key={deadline.id}
                className={`rounded-lg border p-3 ${
                  deadline.urgent
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium">{deadline.title}</p>
                  {deadline.urgent && (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                </div>
                <p className="text-xs text-gray-600">{deadline.project}</p>
                <p
                  className={`mt-1 text-xs ${
                    deadline.urgent
                      ? 'font-medium text-orange-600'
                      : 'text-gray-500'
                  }`}
                >
                  {deadline.dueDate}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No upcoming deadlines</p>
        )}
      </CardContent>
    </Card>
  )
}

function DashboardStats() {
  const result = useSWR<UserData>('/api/user', fetcher)
  const user = result.data
  const {
    data: stats,
    isLoading: loading,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    error,
  } = useSWR<DashboardStatsType>(
    user ? '/api/dashboard/stats' : null,
    async (url: string): Promise<DashboardStatsType> => {
      console.log('[dashboard_page]: fetching dashboard stats from ${url}')
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch dashboard stats')
      return (await res.json()) as DashboardStatsType
    }
  )

  if (loading || !user || !stats) {
    return (
      <>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-8 w-1/2 rounded bg-gray-200"></div>
                  <div className="h-3 w-full rounded bg-gray-200"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Failed to load dashboard statistics
        </p>
      </div>
    )
  }

  return (
    <>
      <DashboardStatsDisplay stats={stats} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <QuickActions />
          <UserCommittees userId={user.id} />
          <UpcomingDeadlines deadlines={stats.upcomingDeadlines} />
        </div>
        <RecentActivity activities={stats.recentActivity} />
      </div>
    </>
  )
}

function DashboardStatsDisplay({ stats }: { stats: DashboardStatsType }) {
  const isReviewer = stats.committees.isReviewer

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isReviewer ? 'Review Queue' : 'Your Submissions'}
          </CardTitle>
          <FileText className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.submissions.total}</div>
          <p className="text-muted-foreground text-xs">
            {isReviewer
              ? `${stats.submissions.pending} pending review`
              : `${stats.submissions.approved} approved`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Milestones
          </CardTitle>
          <Target className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.milestones.inProgress}
          </div>
          <p className="text-muted-foreground text-xs">
            {stats.milestones.completed} completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Committees</CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.committees.active}</div>
          <p className="text-muted-foreground text-xs">
            {isReviewer ? 'Reviewer access' : 'Available to apply'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.submissions.total > 0
              ? Math.round(
                  (stats.submissions.approved / stats.submissions.total) * 100
                )
              : 0}
            %
          </div>
          <p className="text-muted-foreground text-xs">Approval rate</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function DashboardContent() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Grant Dashboard</h1>
        <p className="text-muted-foreground">
          Track your grant applications, milestones, and committee activities
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="p-6">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        }
      >
        <UserProfile />
      </Suspense>

      <DashboardStats />
    </div>
  )
}
