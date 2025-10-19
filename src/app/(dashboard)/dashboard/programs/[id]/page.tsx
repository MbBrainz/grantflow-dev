import { notFound } from 'next/navigation'
import {
  getGrantProgramWithDetails,
  isGrantProgramAdmin,
} from '@/lib/db/queries'
import { GrantProgramDetailView } from './program-detail-view'

interface GrantProgramDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function GrantProgramDetailPage({
  params,
}: GrantProgramDetailPageProps) {
  const { id } = await params
  const programId = parseInt(id)

  if (isNaN(programId)) {
    notFound()
  }

  const [program, isAdmin] = await Promise.all([
    getGrantProgramWithDetails(programId),
    isGrantProgramAdmin(programId),
  ])

  if (!program) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <GrantProgramDetailView program={program} isAdmin={isAdmin} />
    </div>
  )
}
