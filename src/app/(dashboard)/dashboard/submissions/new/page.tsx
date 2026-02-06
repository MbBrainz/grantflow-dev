import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { NewSubmissionForm } from './new-submission-form'

export default async function NewSubmissionPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/sign-in?callbackUrl=/dashboard/submissions/new')
  }

  return <NewSubmissionForm />
}
