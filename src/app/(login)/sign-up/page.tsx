import { redirect } from 'next/navigation'

/**
 * Sign-up page redirects to sign-in
 *
 * With passwordless OTP authentication, there's no separate sign-up flow.
 * New users are automatically created when they verify their email for the first time.
 */
export default function SignUpPage() {
  redirect('/sign-in')
}
