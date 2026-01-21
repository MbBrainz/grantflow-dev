import { Suspense } from 'react'
import { Login } from '../login'

export default function SignInPage() {
  // Auth check is handled by middleware
  return (
    <Suspense>
      <Login />
    </Suspense>
  )
}
