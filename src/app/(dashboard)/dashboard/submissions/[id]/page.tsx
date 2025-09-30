import { notFound } from 'next/navigation'
import { getUser } from '@/lib/db/queries'
import { getSubmissionWithMilestones } from '@/lib/db/queries/submissions'
import { SubmissionDetailView } from './submission-detail-view'

interface SubmissionDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SubmissionDetailPage({
  params,
}: SubmissionDetailPageProps) {
  const { id } = await params
  const submissionId = parseInt(id)

  if (isNaN(submissionId)) {
    notFound()
  }

  const [submission, currentUser] = await Promise.all([
    getSubmissionWithMilestones(submissionId),
    getUser(),
  ])

  if (!submission) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SubmissionDetailView submission={submission} currentUser={currentUser} />
    </div>
  )
}
