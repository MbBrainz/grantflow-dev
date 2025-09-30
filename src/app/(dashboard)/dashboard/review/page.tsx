import { Suspense } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  getAllSubmissionsForReview,
  getSubmissionStats,
  getUser,
  checkIsReviewer,
  getReviewerPendingActions,
} from '@/lib/db/queries'
import { redirect } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { ReviewDashboardClient } from './review-dashboard-client'

async function ReviewDashboard() {
  const user = await getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const isReviewer = await checkIsReviewer(user.id)

  if (!isReviewer) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-orange-500" />
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You need reviewer permissions to access this dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const [submissions, stats, pendingActions] = await Promise.all([
    getAllSubmissionsForReview(),
    getSubmissionStats(),
    getReviewerPendingActions(),
  ])

  return (
    <ReviewDashboardClient
      initialSubmissions={submissions as any}
      stats={stats}
      pendingActions={pendingActions as any}
    />
  )
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 animate-pulse rounded bg-gray-200" />
          <div className="grid gap-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-8 animate-pulse rounded bg-gray-200" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-6 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      }
    >
      <ReviewDashboard />
    </Suspense>
  )
}
