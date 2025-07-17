import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { getUserSubmissions } from './actions';

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
  // Parse the stored JSON data
  let formData = null;
  try {
    formData = JSON.parse(submission.formData || '{}');
  } catch (error) {
    console.error('Error parsing submission form data:', error);
  }

  const labels = JSON.parse(submission.labels || '[]');

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-lg">
              {formData?.title || 'Untitled Submission'}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {formData?.description || 'No description available'}
            </CardDescription>
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
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {label}
                </span>
              ))}
              {labels.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                  +{labels.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Funding Amount */}
          {formData?.totalAmount && (
            <div className="text-sm text-muted-foreground">
              <strong>Funding:</strong> ${parseFloat(formData.totalAmount).toLocaleString()}
            </div>
          )}

          {/* Submission Date */}
          <div className="text-sm text-muted-foreground">
            <strong>Submitted:</strong> {new Date(submission.createdAt).toLocaleDateString()}
          </div>

          {/* GitHub PR Link */}
          {submission.githubPrId && (
            <div className="text-sm">
              <a
                href={formData?.githubPrUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View GitHub PR #{submission.githubPrId}
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
  );
}

export default async function SubmissionsPage() {
  const submissions = await getUserSubmissions();

  // Calculate stats
  const stats = {
    total: submissions.length,
    underReview: submissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    totalFunding: submissions.reduce((sum, s) => {
      try {
        const formData = JSON.parse(s.formData || '{}');
        return sum + (parseFloat(formData.totalAmount) || 0);
      } catch {
        return sum;
      }
    }, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Grant Submissions</h1>
          <p className="text-muted-foreground">
            Submit grant proposals and track their progress
          </p>
        </div>
        <Link href="/dashboard/submissions/new">
          <Button>
            New Submission
          </Button>
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
              <p className="text-xs text-muted-foreground">
                {stats.total === 0 ? 'No submissions yet' : 'All time'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Under Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.underReview}</div>
              <p className="text-xs text-muted-foreground">
                Pending curator review
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">
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
              <p className="text-xs text-muted-foreground">
                Requested amount
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Submissions</CardTitle>
            <CardDescription>
              Track the status of all your grant submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  You haven't submitted any grant proposals yet.
                </p>
                <Link href="/dashboard/submissions/new">
                  <Button>
                    Create Your First Submission
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {submissions.map((submission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 