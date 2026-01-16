import { redirect } from 'next/navigation'
import { checkOnboardingStatus } from '../onboarding/actions'
import { DashboardContent } from './dashboard-content'

export default async function DashboardPage() {
  const status = await checkOnboardingStatus()

  // If user is not logged in, redirect to sign in
  if (!status.user) {
    redirect('/sign-in?redirect=/dashboard')
  }

  // If user needs onboarding, redirect to onboarding flow
  if (status.needsOnboarding) {
    redirect('/onboarding')
  }

  // User is logged in and has completed onboarding
  return <DashboardContent />
}
