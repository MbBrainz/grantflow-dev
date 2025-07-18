import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { getAllSubmissionsForReview, getSubmissionStats, getUser, checkIsCurator, getCuratorPendingActions } from '@/lib/db/queries';
import type { Submission } from '@/lib/db/schema';
import { redirect } from 'next/navigation';
import { Clock, FileText, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { CommitteeBadge } from '@/components/submissions/committee-badge';
import { MilestoneProgressBadge } from '@/components/submissions/milestone-progress-badge';
import { PendingActionsPanel } from '@/components/curator/pending-actions-panel';

function StatusBadge({ status }: { status: string }) {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      colors[status as keyof typeof colors] || colors.draft
    }`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}

function SubmissionCard({ submission }: { submission: any }) {
  const labels = submission.labels ? JSON.parse(submission.labels) : [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-lg">
              {submission.title || 'Untitled Submission'}
            </CardTitle>
            <CardDescription>
              by {submission.submitter?.name || 'Anonymous'} • {new Date(submission.createdAt).toLocaleDateString()}
            </CardDescription>
            
            {/* Committee Badge */}
            {submission.committee && (
              <CommitteeBadge 
                committee={submission.committee} 
                variant="compact"
                className="mt-1"
              />
            )}
            
            {/* Milestone Progress for Approved Submissions */}
            <MilestoneProgressBadge 
              milestones={submission.milestones || []}
              submissionStatus={submission.status}
              variant="compact"
            />
          </div>
          <StatusBadge status={submission.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {submission.description || submission.executiveSummary || 'No description available'}
          </p>
          
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {labels.slice(0, 3).map((label: string) => (
                <span 
                  key={label}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md"
                >
                  {label}
                </span>
              ))}
              {labels.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-md">
                  +{labels.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {submission.milestones?.length || 0} milestones
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {submission.totalAmount ? `$${submission.totalAmount.toLocaleString()}` : 
                 submission.grantProgram?.fundingAmount ? `$${submission.grantProgram.fundingAmount.toLocaleString()}` : 'Amount TBD'}
              </div>
              {submission.grantProgram && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {submission.grantProgram.name}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Link href={`/dashboard/submissions/${submission.id}`}>
                <Button variant="outline" size="sm">
                  Review & Discuss
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function CuratorDashboard() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const isCurator = await checkIsCurator(user.id);
  
  if (!isCurator) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You need curator permissions to access this dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const [submissions, stats, pendingActions] = await Promise.all([
    getAllSubmissionsForReview(),
    getSubmissionStats(),
    getCuratorPendingActions()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Curator Review Dashboard</h1>
          <p className="text-muted-foreground">
            Review grant submissions and manage the approval process
          </p>
        </div>
      </div>

      {/* Pending Actions - Priority Section */}
      <PendingActionsPanel 
        submissionsNeedingVote={pendingActions.submissionsNeedingVote as any}
        milestonesNeedingReview={pendingActions.milestonesNeedingReview as any}
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.underReview}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button variant="default" size="sm">All ({stats.total})</Button>
        <Button variant="outline" size="sm">Pending ({stats.submitted})</Button>
        <Button variant="outline" size="sm">Under Review ({stats.underReview})</Button>
        <Button variant="outline" size="sm">Approved ({stats.approved})</Button>
        <Button variant="outline" size="sm">Rejected ({stats.rejected})</Button>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No submissions found. Check back later for new grant applications.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CuratorPage() {
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
      <CuratorDashboard />
    </Suspense>
  );
} 