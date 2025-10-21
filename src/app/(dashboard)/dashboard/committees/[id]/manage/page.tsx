import { notFound, redirect } from 'next/navigation'
import { getCommitteeById, isCommitteeAdmin } from '@/lib/db/queries'
import { getGrantProgramsFinancials } from '@/lib/db/queries/grant-programs'
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

  // Get financial metrics for all grant programs
  const programIds = committee.grantPrograms?.map(p => p.id) ?? []
  const financials = await getGrantProgramsFinancials(programIds)

  // Create a map for easy lookup
  const financialsMap = new Map(financials.map(f => [f?.programId, f]))

  return (
    <div className="container mx-auto px-4 py-8">
      <ManageCommitteeView
        committee={committee}
        financialsMap={financialsMap}
      />
    </div>
  )
}
