'use client'

import { Loader2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateUserNameAction } from '../actions'

interface ProfileCompletionProps {
  userEmail?: string | null
}

export function ProfileCompletion({ userEmail }: ProfileCompletionProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    startTransition(async () => {
      const result = await updateUserNameAction({ name: name.trim() })

      if ('error' in result && result.error) {
        setError(result.error)
      } else if ('success' in result && result.success) {
        // Refresh the page to continue with onboarding
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Complete Your Profile
        </h1>
        <p className="mt-2 text-gray-600">
          Before we continue, please tell us your name.
        </p>
      </div>

      <Card className="mx-auto max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <User className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Your Name</CardTitle>
              <CardDescription>
                This will be visible to other users.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={100}
                required
                autoFocus
              />
            </div>

            {userEmail && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">
                  Your email address is already set.
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={!canSubmit || isPending}
              className="w-full"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
