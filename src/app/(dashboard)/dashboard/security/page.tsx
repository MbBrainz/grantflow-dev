'use client'

import { Github, Key, Loader2, Mail, Shield, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import useSWR from 'swr'
import { handleSignOut } from '@/app/(login)/actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { User } from '@/lib/db/schema'
import { fetcher } from '@/lib/utils'
import { type DeleteAccountState, deleteAccount } from './actions'

function LinkedAccountsSection() {
  const { data: user } = useSWR<User>('/api/user', fetcher)

  const hasGitHub = Boolean(user?.githubId)
  const hasEmail = Boolean(user?.email)

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Linked Accounts
        </CardTitle>
        <CardDescription>
          Manage how you sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* GitHub */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">GitHub</p>
              <p className="text-sm text-gray-500">
                {hasGitHub ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {hasGitHub ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              Connected
            </span>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Connect
            </Button>
          )}
        </div>

        {/* Email */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Email (OTP)</p>
              <p className="text-sm text-gray-500">
                {hasEmail ? user?.email : 'Not set up'}
              </p>
            </div>
          </div>
          {hasEmail ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              Active
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              Not available
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PasskeysSection() {
  const [isRegistering, setIsRegistering] = useState(false)

  const handleRegisterPasskey = async () => {
    setIsRegistering(true)
    try {
      // WebAuthn passkey registration would go here
      // This requires calling the Auth.js webauthn registration endpoint
      console.log('Passkey registration not yet implemented')
      alert('Passkey registration coming soon!')
    } catch (error) {
      console.error('Failed to register passkey:', error)
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Passkeys
        </CardTitle>
        <CardDescription>
          Use biometric authentication (fingerprint, face) for faster sign-in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-lg border border-dashed border-gray-300 p-6 text-center">
          <Key className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <p className="mb-2 text-sm text-gray-600">
            No passkeys registered yet
          </p>
          <p className="mb-4 text-xs text-gray-500">
            Passkeys let you sign in securely using your device&apos;s biometric
            sensors
          </p>
          <Button
            onClick={handleRegisterPasskey}
            disabled={isRegistering}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isRegistering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Register a Passkey
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Passkeys are more secure than passwords and work across your devices.
        </p>
      </CardContent>
    </Card>
  )
}

function DeleteAccountSection() {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const initialState: DeleteAccountState = {}
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteAccount,
    initialState
  )

  // Handle successful deletion redirect
  useEffect(() => {
    if (deleteState.success) {
      handleSignOut()
    }
  }, [deleteState.success])

  if (!showConfirm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-500">
            Account deletion is permanent and cannot be undone. All your data,
            including submissions, reviews, and profile information will be
            deleted.
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowConfirm(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Confirm Account Deletion</CardTitle>
        <CardDescription>This action cannot be undone</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={deleteAction} className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Are you sure you want to delete your account? This will:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-red-700">
              <li>Delete all your submissions and drafts</li>
              <li>Remove your reviews and comments</li>
              <li>Unlink all connected accounts</li>
              <li>Permanently erase your profile</li>
            </ul>
          </div>

          {deleteState.error && (
            <p className="text-sm text-red-500">{deleteState.error}</p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isDeletePending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isDeletePending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Yes, Delete My Account
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function SecurityPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="mb-6 text-lg font-bold text-gray-900 lg:text-2xl">
        Security Settings
      </h1>

      <LinkedAccountsSection />
      <PasskeysSection />
      <DeleteAccountSection />
    </section>
  )
}
