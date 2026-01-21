'use client'

import { CircleIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import AsyncButton from '@/components/ui/async-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/lib/hooks/use-toast'
import type { EmailOTPState } from './actions'
import { requestEmailOTP, signInWithGitHub, verifyEmailOTP } from './actions'

export function Login() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirect =
    searchParams.get('redirect') || searchParams.get('callbackUrl')
  const { toast } = useToast()

  // State for the two-step OTP flow
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')

  // Request OTP action state
  const initialEmailState: EmailOTPState = { step: 'email' }
  const [emailState, emailFormAction, emailPending] = useActionState(
    requestEmailOTP,
    initialEmailState
  )

  // Verify OTP action state
  const initialCodeState: EmailOTPState = { step: 'code' }
  const [codeState, codeFormAction, codePending] = useActionState(
    verifyEmailOTP,
    initialCodeState
  )

  // Handle email submission success - move to code step
  useEffect(() => {
    if (emailState.success && emailState.step === 'code' && emailState.email) {
      setStep('code')
      setEmail(emailState.email)
      toast({
        title: 'Code sent',
        description:
          emailState.message || 'Check your email for a 6-digit code',
      })
    }
  }, [emailState, toast])

  // Handle code verification success - redirect
  useEffect(() => {
    if (codeState.success && codeState.redirect) {
      router.push(codeState.redirect)
    }
  }, [codeState, router])

  // Show error toasts
  useEffect(() => {
    if (emailState.error) {
      toast({
        title: 'Error',
        description: emailState.error,
        variant: 'destructive',
      })
    }
  }, [emailState.error, toast])

  useEffect(() => {
    if (codeState.error) {
      toast({
        title: 'Invalid code',
        description: codeState.error,
        variant: 'destructive',
      })
    }
  }, [codeState.error, toast])

  const handleGitHubLogin = async () => {
    try {
      toast({
        title: 'Redirecting to GitHub...',
        description:
          'Please wait while we redirect you to GitHub for authentication.',
      })
      await signInWithGitHub(redirect ?? '/dashboard')
    } catch {
      toast({
        title: 'GitHub Sign In Failed',
        description: 'Failed to connect to GitHub. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setEmail('')
  }

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 'email' ? 'Sign in to your account' : 'Enter your code'}
        </h2>
        {step === 'code' && (
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a 6-digit code to{' '}
            <span className="font-medium">{email}</span>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* GitHub OAuth Button */}
        {step === 'email' && (
          <>
            <div className="mb-6">
              <Button
                onClick={handleGitHubLogin}
                className="flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Continue with GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 px-2 text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div>
          </>
        )}

        {/* Email Input Step */}
        {step === 'email' && (
          <form className="mt-6 space-y-6" action={emailFormAction}>
            <input
              type="hidden"
              name="callbackUrl"
              value={redirect ?? '/dashboard'}
            />

            <div>
              <Label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={255}
                  className="relative block w-full appearance-none rounded-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:ring-orange-500 focus:outline-none sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <AsyncButton
                type="submit"
                className="flex w-full items-center justify-center rounded-full border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
                pendingExternal={emailPending}
              >
                Send code
              </AsyncButton>
            </div>
          </form>
        )}

        {/* OTP Code Input Step */}
        {step === 'code' && (
          <form className="mt-6 space-y-6" action={codeFormAction}>
            <input type="hidden" name="email" value={email} />
            <input
              type="hidden"
              name="callbackUrl"
              value={redirect ?? '/dashboard'}
            />

            <div>
              <Label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700"
              >
                6-digit code
              </Label>
              <div className="mt-1">
                <Input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="relative block w-full appearance-none rounded-full border border-gray-300 px-3 py-2 text-center text-lg font-mono tracking-widest text-gray-900 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:ring-orange-500 focus:outline-none sm:text-sm"
                  placeholder="000000"
                />
              </div>
              <p className="mt-2 text-center text-xs text-gray-500">
                Code expires in 10 minutes
              </p>
            </div>

            <div className="space-y-3">
              <AsyncButton
                type="submit"
                className="flex w-full items-center justify-center rounded-full border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
                pendingExternal={codePending}
              >
                Verify code
              </AsyncButton>

              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToEmail}
                className="flex w-full items-center justify-center text-sm text-gray-600 hover:text-gray-900"
              >
                Use a different email
              </Button>
            </div>
          </form>
        )}

        {/* Test accounts hint for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="text-center text-xs text-gray-500">
              <span className="font-medium">Dev mode:</span> Test accounts use
              code <code className="rounded bg-gray-200 px-1">000000</code>
            </p>
            <p className="mt-1 text-center text-xs text-gray-400">
              reviewer1@test.com, reviewer2@test.com, test@grantflow.dev
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
