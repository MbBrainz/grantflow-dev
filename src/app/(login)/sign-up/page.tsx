import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Login } from '../login'
import { getUser } from '@/lib/db/queries'

export default async function SignUpPage() {
  // Redirect to dashboard if already authenticated
  const user = await getUser()
  if (user) {
    redirect('/dashboard')
  }

  return (
    <Suspense>
      <Login mode="signup" />
    </Suspense>
  )
}
