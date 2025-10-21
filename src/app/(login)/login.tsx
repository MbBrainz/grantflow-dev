'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn as nextAuthSignIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import AsyncButton from '@/components/ui/async-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CircleIcon } from 'lucide-react'
import { signInState, signUpState } from './actions'
import type { SignInState, SignUpState } from './actions'

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const priceId = searchParams.get('priceId')
  const inviteId = searchParams.get('inviteId')

  type State = SignInState | SignUpState
  const initialState: State = { error: '' }
  const action = mode === 'signin' ? signInState : signUpState
  const [state, formAction, pending] = useActionState<State, FormData>(
    action as (prevState: State, formData: FormData) => Promise<State>,
    initialState
  )

  const handleGitHubLogin = async () => {
    await nextAuthSignIn('github', {
      callbackUrl: redirect ?? '/dashboard',
    })
  }

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'signin'
            ? 'Sign in to your account'
            : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* GitHub OAuth Button */}
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

        <form className="mt-6 space-y-6" action={formAction}>
          <input type="hidden" name="redirect" value={redirect ?? ''} />
          <input type="hidden" name="priceId" value={priceId ?? ''} />
          <input type="hidden" name="inviteId" value={inviteId ?? ''} />

          {mode === 'signup' && (
            <div>
              <Label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </Label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  defaultValue={
                    'name' in state ? (state.name as string | undefined) : ''
                  }
                  required
                  maxLength={100}
                  className="relative block w-full appearance-none rounded-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:ring-orange-500 focus:outline-none sm:text-sm"
                  placeholder="Enter your name"
                />
              </div>
            </div>
          )}

          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={'email' in state ? (state.email ?? '') : ''}
                required
                maxLength={50}
                className="relative block w-full appearance-none rounded-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:ring-orange-500 focus:outline-none sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </Label>
            <div className="mt-1">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                defaultValue={'password' in state ? (state.password ?? '') : ''}
                required
                minLength={8}
                maxLength={100}
                className="relative block w-full appearance-none rounded-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:ring-orange-500 focus:outline-none sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {state?.error && (
            <div className="text-sm text-red-500">{state.error}</div>
          )}

          <div>
            <AsyncButton
              type="submit"
              className="flex w-full items-center justify-center rounded-full border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
              pendingExternal={pending}
            >
              {mode === 'signin' ? 'Sign in' : 'Sign up'}
            </AsyncButton>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-2 text-gray-500">
                {mode === 'signin'
                  ? 'New to our platform?'
                  : 'Already have an account?'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                redirect ? `?redirect=${redirect}` : ''
              }${priceId ? `&priceId=${priceId}` : ''}`}
              className="flex w-full justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
            >
              {mode === 'signin'
                ? 'Create an account'
                : 'Sign in to existing account'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
