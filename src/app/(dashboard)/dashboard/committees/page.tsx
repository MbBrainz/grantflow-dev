import { getGroupsWithStats } from '@/lib/db/queries/groups'
import { CommitteesPageClient } from './committees-page-client'

export default async function CommitteesPage() {
  const allGroups = await getGroupsWithStats()
  // Filter only committees
  const committees = allGroups.filter(group => group.type === 'committee')

  return <CommitteesPageClient committees={committees} />
}
