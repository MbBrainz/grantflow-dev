import { notFound } from 'next/navigation'
import {
  getGrantProgramWithDetails,
  getGrantProgramFinancials,
} from '@/lib/db/queries/grant-programs'
import { GrantProgramDetailView } from './grant-program-detail-view'

interface GrantProgramPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function GrantProgramPage({
  params,
}: GrantProgramPageProps) {
  const { id } = await params
  const programId = parseInt(id)

  if (isNaN(programId)) {
    notFound()
  }

  const [program, financials] = await Promise.all([
    getGrantProgramWithDetails(programId),
    getGrantProgramFinancials(programId),
  ])

  if (!program) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <GrantProgramDetailView program={program} financials={financials} />
    </div>
  )
}
