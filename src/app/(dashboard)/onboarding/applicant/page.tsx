'use client'

import { ArrowLeft, CheckCircle, Loader2, Users } from 'lucide-react'
import Link from 'next/link'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/lib/hooks/use-toast'
import { createTeamAction } from '../actions'

export default function ApplicantOnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [githubOrg, setGithubOrg] = useState('')

  const [isPending, startTransition] = useTransition()
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    startTransition(async () => {
      const result = await createTeamAction({
        name: name.trim(),
        description: description.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        githubOrg: githubOrg.trim() || undefined,
      })

      if ('error' in result && result.error) {
        setError(result.error)
      } else if ('success' in result && result.success) {
        setIsSuccess(true)
        toast({
          title: 'Team Created!',
          description: `${name} is ready to submit grant applications.`,
        })
        // Redirect after showing success
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    })
  }

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-800">Team Created!</CardTitle>
            <CardDescription className="text-green-700">
              &quot;{name}&quot; is ready. You can now browse grant programs and
              submit applications.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/committees')}
            >
              Browse Grant Programs
            </Button>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/onboarding"
          className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Create Your Team
        </h1>
        <p className="mt-1 text-gray-600">
          Set up your team to start submitting grant applications.
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Team Details</CardTitle>
              <CardDescription>
                This information will be visible to grant committees.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Team Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Acme Labs"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500">
                Choose a name that represents your team or organization.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell us about your team and what you're building..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website (optional)</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://..."
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="githubOrg">
                  GitHub Organization (optional)
                </Label>
                <Input
                  id="githubOrg"
                  placeholder="e.g., acme-labs"
                  value={githubOrg}
                  onChange={e => setGithubOrg(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
              <p>
                <strong>Note:</strong> You&apos;ll set up your payout wallet
                address when submitting your first grant application.
              </p>
            </div>

            <Button
              type="submit"
              disabled={!canSubmit || isPending}
              className="w-full"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Team...
                </>
              ) : (
                'Create Team'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
