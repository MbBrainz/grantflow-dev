import { NextResponse } from 'next/server'
import { getUser, getUserCommittees } from '@/lib/db/queries'

export async function GET() {
  try {
    // Get user from session
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all committees the user is a member of
    const userCommittees = await getUserCommittees(user.id)

    // Return simplified format for dashboard navigation
    const committees = userCommittees.map(committee => ({
      id: committee.id,
      name: committee.name,
    }))

    return NextResponse.json({ committees })
  } catch (error) {
    console.error('[user-committees]: Error fetching committees', error)
    return NextResponse.json(
      { error: 'Failed to fetch user committees' },
      { status: 500 }
    )
  }
}
