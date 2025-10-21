import { getUserSubmissions } from './actions'
import { SubmissionsPageClient } from './submissions-page-client'

export default async function SubmissionsPage() {
  const submissions = await getUserSubmissions()

  return <SubmissionsPageClient submissions={submissions} />
}
