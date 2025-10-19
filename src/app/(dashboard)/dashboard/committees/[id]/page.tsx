import { notFound } from 'next/navigation'
import { getCommitteeById, isCommitteeAdmin } from '@/lib/db/queries'
import { CommitteeDetailView } from './committee-detail-view'

interface CommitteeDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CommitteeDetailPage({
  params,
}: CommitteeDetailPageProps) {
  const { id } = await params
  const committeeId = parseInt(id)

  if (isNaN(committeeId)) {
    notFound()
  }

  const [committee, isAdmin] = await Promise.all([
    getCommitteeById(committeeId),
    isCommitteeAdmin(committeeId),
  ])

  if (!committee) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CommitteeDetailView committee={committee} isAdmin={isAdmin} />
    </div>
  )
}
