'use client'

import { Building2, Users } from 'lucide-react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface RoleSelectionProps {
  userName?: string
}

export function RoleSelection({ userName }: RoleSelectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Link href="/onboarding/reviewer" className="group">
        <Card className="h-full cursor-pointer transition-all hover:border-orange-300 hover:shadow-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 transition-colors group-hover:bg-orange-200">
              <Building2 className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Reviewer</CardTitle>
            <CardDescription className="text-base">
              I&apos;m part of a bounty committee
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500">
              Join or create a committee to review and approve grant
              applications. You&apos;ll need to verify your wallet address
              matches a multisig signatory.
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/onboarding/applicant" className="group">
        <Card className="h-full cursor-pointer transition-all hover:border-blue-300 hover:shadow-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 transition-colors group-hover:bg-blue-200">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Applicant</CardTitle>
            <CardDescription className="text-base">
              I want to apply for grants
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500">
              Create a team to submit grant applications. You&apos;ll be able to
              browse available grant programs and track your submissions.
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
