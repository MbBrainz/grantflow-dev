import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { submissions, milestones } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { SubmissionDetailView } from './submission-detail-view';

interface SubmissionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getSubmissionWithMilestones(id: number) {
  try {
    const submission = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, id))
      .limit(1);

    if (submission.length === 0) {
      return null;
    }

    const submissionMilestones = await db
      .select()
      .from(milestones)
      .where(eq(milestones.submissionId, id))
      .orderBy(milestones.createdAt);

    return {
      ...submission[0],
      milestones: submissionMilestones,
      // Legacy support - create formData from structured fields for backward compatibility
      formData: JSON.stringify({
        title: submission[0].title,
        description: submission[0].description,
        executiveSummary: submission[0].executiveSummary,
        postGrantPlan: submission[0].postGrantPlan,
      }),
    };
  } catch (error) {
    console.error('[getSubmissionWithMilestones]: Error fetching submission', error);
    return null;
  }
}

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const { id } = await params;
  const submissionId = parseInt(id);
  
  if (isNaN(submissionId)) {
    notFound();
  }

  const [submission, currentUser] = await Promise.all([
    getSubmissionWithMilestones(submissionId),
    getUser(),
  ]);

  if (!submission) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SubmissionDetailView 
        submission={submission} 
        currentUser={currentUser}
      />
    </div>
  );
} 