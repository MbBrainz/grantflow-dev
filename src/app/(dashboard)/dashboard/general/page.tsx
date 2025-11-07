'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import {
  updateAccountState,
  type AccountFormState,
} from '@/app/(login)/actions'
import type { User } from '@/lib/db/schema'
import useSWR from 'swr'
import { Suspense } from 'react'
import { fetcher } from '@/lib/utils'

interface AccountFormProps {
  state: AccountFormState
  nameValue?: string
  emailValue?: string
}

function AccountForm({
  state,
  nameValue = '',
  emailValue = '',
}: AccountFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your name"
          defaultValue={(state.name ?? nameValue) || ''}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          defaultValue={emailValue || ''}
          disabled
          className="bg-muted cursor-not-allowed"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Email addresses cannot be changed
        </p>
      </div>
    </>
  )
}

function AccountFormWithData({ state }: { state: AccountFormState }) {
  const { data: user } = useSWR<User>('/api/user', fetcher)
  return (
    <AccountForm
      state={state}
      nameValue={(user?.name ?? '') || ''}
      emailValue={(user?.email ?? '') || ''}
    />
  )
}

export default function GeneralPage() {
  const [state, formAction, isPending] = useActionState(
    updateAccountState,
    {} as AccountFormState
  )

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="mb-6 text-lg font-medium text-gray-900 lg:text-2xl">
        General Settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={formAction}>
            <Suspense fallback={<AccountForm state={state} />}>
              <AccountFormWithData state={state} />
            </Suspense>
            {state.error && (
              <p className="text-sm text-red-500">{state.error}</p>
            )}
            {state.success && (
              <p className="text-sm text-green-500">
                {typeof state.success === 'string'
                  ? state.success
                  : (state.message ?? 'Account updated successfully.')}
              </p>
            )}
            <Button
              type="submit"
              className="bg-orange-500 text-white hover:bg-orange-600"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
