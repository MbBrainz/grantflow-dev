import { notFound, redirect } from 'next/navigation'
import {
  getCommitteeById,
  getCommitteeFinancials,
  isCommitteeAdmin,
} from '@/lib/db/queries'
import { ManageCommitteeView } from './manage-committee-view'

interface ManageCommitteePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ManageCommitteePage({
  params,
}: ManageCommitteePageProps) {
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

  // Only admins can access this page
  if (!isAdmin) {
    redirect(`/dashboard/committees/${committeeId}`)
  }

  // Get financial metrics for the committee (which IS the grant program now)
  const financials = await getCommitteeFinancials(committeeId)

  return (
    <div className="container mx-auto px-4 py-8">
      <ManageCommitteeView committee={committee} financials={financials} />
    </div>
  )
}
