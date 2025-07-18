import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllSubmissionsForReview, getSubmissionStats, getUser, checkIsReviewer, getReviewerPendingActions } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { ReviewDashboardClient } from './review-dashboard-client';

async function ReviewDashboard() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const isReviewer = await checkIsReviewer(user.id);
  
  if (!isReviewer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You need reviewer permissions to access this dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const [submissions, stats, pendingActions] = await Promise.all([
    getAllSubmissionsForReview(),
    getSubmissionStats(),
    getReviewerPendingActions()
  ]);

  return (
    <ReviewDashboardClient 
      initialSubmissions={submissions}
      stats={stats}
      pendingActions={pendingActions}
    />
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <ReviewDashboard />
    </Suspense>
  );
} 