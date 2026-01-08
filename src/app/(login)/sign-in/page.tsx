import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getUser } from '@/lib/db/queries'
import { Login } from '../login'

export default async function SignInPage() {
  // Redirect to dashboard if already authenticated
  const user = await getUser()
  if (user) {
    redirect('/dashboard')
  }

  return (
    <Suspense>
      <Login mode="signin" />
    </Suspense>
  )
}
