import { CircleIcon, Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Verify Email Page
 *
 * This page is shown after Auth.js sends a magic link verification email.
 * It instructs users to check their email and click the sign-in link.
 */
export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Check your email
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-lg bg-white px-6 py-8 shadow-sm">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Mail className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <p className="mb-4 text-center text-gray-600">
            We&apos;ve sent a sign-in link to your email address.
          </p>

          <p className="mb-6 text-center text-sm text-gray-500">
            Click the link in your email to sign in to your account. The link
            expires in 10 minutes.
          </p>

          <div className="space-y-3">
            <Link href="/sign-in" className="block">
              <Button variant="outline" className="w-full">
                Use a different email
              </Button>
            </Link>

            <p className="text-center text-xs text-gray-400">
              Didn&apos;t receive an email? Check your spam folder or{' '}
              <Link href="/sign-in" className="text-orange-600 hover:underline">
                try again
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
