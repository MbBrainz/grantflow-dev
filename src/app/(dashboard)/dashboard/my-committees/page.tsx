import { Building2 } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getUser, getUserCommittees } from '@/lib/db/queries'

export default async function MyCommitteesPage() {
  const user = await getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const committees = await getUserCommittees(user.id)

  // If user has only one committee, redirect directly to it
  if (committees.length === 1) {
    redirect(`/dashboard/committees/${committees[0].id}`)
  }

  // If user has no committees
  if (committees.length === 0) {
    return (
      <div className="flex-1 p-4 lg:p-8">
        <h1 className="mb-6 text-lg font-medium text-gray-900 lg:text-2xl">
          My Committees
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-gray-400" />
            <p className="text-center text-gray-500">
              You are not a member of any committees yet.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 lg:p-8">
      <h1 className="mb-6 text-lg font-medium text-gray-900 lg:text-2xl">
        My Committees
      </h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {committees.map(committee => (
          <Link
            key={committee.id}
            href={`/dashboard/committees/${committee.id}`}
          >
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {committee.logoUrl ? (
                    <img
                      src={committee.logoUrl}
                      alt={committee.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                      <Building2 className="h-5 w-5 text-orange-600" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-base">
                      {committee.name}
                    </CardTitle>
                    {committee.focusAreas && (
                      <CardDescription className="text-xs">
                        {committee.focusAreas}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              {committee.description && (
                <CardContent>
                  <p className="line-clamp-2 text-sm text-gray-600">
                    {committee.description}
                  </p>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
