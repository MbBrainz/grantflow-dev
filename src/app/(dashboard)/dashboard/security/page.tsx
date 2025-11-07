'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Lock, Trash2, Loader2 } from 'lucide-react'
import { useActionState } from 'react'
import {
  updatePasswordState,
  deleteAccountState,
  type PasswordState,
  type DeleteState,
} from '@/app/(login)/actions'
import type { User } from '@/lib/db/schema'
import useSWR from 'swr'
import { Suspense } from 'react'
import { fetcher } from '@/lib/utils'

function PasswordSection({
  passwordState,
  passwordAction,
  isPasswordPending,
}: {
  passwordState: PasswordState
  passwordAction: (payload: FormData) => void
  isPasswordPending: boolean
}) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={passwordAction}>
          <div>
            <Label htmlFor="current-password" className="mb-2">
              Current Password
            </Label>
            <Input
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              maxLength={100}
              defaultValue={passwordState.currentPassword ?? ''}
            />
          </div>
          <div>
            <Label htmlFor="new-password" className="mb-2">
              New Password
            </Label>
            <Input
              id="new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={100}
              defaultValue={passwordState.newPassword ?? ''}
            />
          </div>
          <div>
            <Label htmlFor="confirm-password" className="mb-2">
              Confirm New Password
            </Label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              maxLength={100}
              defaultValue={passwordState.confirmPassword ?? ''}
            />
          </div>
          {passwordState.error && (
            <p className="text-sm text-red-500">{passwordState.error}</p>
          )}
          {passwordState.success && (
            <p className="text-sm text-green-500">
              {typeof passwordState.success === 'string'
                ? passwordState.success
                : passwordState.message}
            </p>
          )}
          <Button
            type="submit"
            className="bg-orange-500 text-white hover:bg-orange-600"
            disabled={isPasswordPending}
          >
            {isPasswordPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Update Password
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function DeleteAccountSection({
  deleteState,
  deleteAction,
  isDeletePending,
  hasPassword,
}: {
  deleteState: DeleteState
  deleteAction: (payload: FormData) => void
  isDeletePending: boolean
  hasPassword: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete Account</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-gray-500">
          Account deletion is non-reversable. Please proceed with caution.
        </p>
        {hasPassword ? (
          <form action={deleteAction} className="space-y-4">
            <div>
              <Label htmlFor="delete-password" className="mb-2">
                Confirm Password
              </Label>
              <Input
                id="delete-password"
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={deleteState.password ?? ''}
              />
            </div>
            {deleteState.error && (
              <p className="text-sm text-red-500">{deleteState.error}</p>
            )}
            <Button
              type="submit"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletePending}
            >
              {isDeletePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </>
              )}
            </Button>
          </form>
        ) : (
          <p className="text-muted-foreground text-sm">
            GitHub OAuth accounts cannot be deleted through this interface.
            Please contact support if you need to delete your account.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SecurityContent({
  passwordState,
  passwordAction,
  isPasswordPending,
  deleteState,
  deleteAction,
  isDeletePending,
}: {
  passwordState: PasswordState
  passwordAction: (payload: FormData) => void
  isPasswordPending: boolean
  deleteState: DeleteState
  deleteAction: (payload: FormData) => void
  isDeletePending: boolean
}) {
  const { data: user } = useSWR<User>('/api/user', fetcher)

  const hasPassword = Boolean(user?.passwordHash ?? false)

  return (
    <>
      {hasPassword ? (
        <PasswordSection
          passwordState={passwordState}
          passwordAction={passwordAction}
          isPasswordPending={isPasswordPending}
        />
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              You are signed in with GitHub OAuth. Password management is not
              available for OAuth accounts.
            </p>
          </CardContent>
        </Card>
      )}

      <DeleteAccountSection
        deleteState={deleteState}
        deleteAction={deleteAction}
        isDeletePending={isDeletePending}
        hasPassword={hasPassword}
      />
    </>
  )
}

export default function SecurityPage() {
  const [passwordState, passwordAction, isPasswordPending] = useActionState(
    updatePasswordState,
    {} as PasswordState
  )

  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteAccountState,
    {} as DeleteState
  )

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="bold mb-6 text-lg font-medium text-gray-900 lg:text-2xl">
        Security Settings
      </h1>
      <Suspense
        fallback={
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Password</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-4">
                  <div className="bg-muted h-10 rounded"></div>
                  <div className="bg-muted h-10 rounded"></div>
                  <div className="bg-muted h-10 rounded"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Delete Account</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-4">
                  <div className="bg-muted h-10 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </>
        }
      >
        <SecurityContent
          passwordState={passwordState}
          passwordAction={passwordAction}
          isPasswordPending={isPasswordPending}
          deleteState={deleteState}
          deleteAction={deleteAction}
          isDeletePending={isDeletePending}
        />
      </Suspense>
    </section>
  )
}
