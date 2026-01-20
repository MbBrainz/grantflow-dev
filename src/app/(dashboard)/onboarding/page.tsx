import { redirect } from 'next/navigation'
import { checkOnboardingStatus } from './actions'
import { RoleSelection } from './components/role-selection'

export default async function OnboardingPage() {
  const status = await checkOnboardingStatus()

  // If user is not logged in, redirect to sign in
  if (!status.user) {
    redirect('/sign-in?redirect=/onboarding')
  }

  // If user already has groups, redirect to dashboard
  if (!status.needsOnboarding) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome to GrantFlow
        </h1>
        <p className="mt-2 text-gray-600">
          Let&apos;s get you set up. What brings you here?
        </p>
      </div>

      <RoleSelection userName={status.user.name ?? undefined} />
    </div>
  )
}
