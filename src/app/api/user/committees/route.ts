import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getUser, getUserCommittees } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    // Get user from session or from query param (for backward compat)
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')

    let userId: number

    if (userIdParam) {
      // Legacy: userId passed as query param
      userId = parseInt(userIdParam)
    } else {
      // New: get user from session
      const user = await getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    }

    // Get all committees the user is a member of
    const userCommittees = await getUserCommittees(userId)

    // Transform the data for the frontend (full format for UserCommittees component)
    const memberships = userCommittees.map(committee => ({
      committee: {
        id: committee.id,
        name: committee.name,
        description: committee.description,
        logoUrl: committee.logoUrl,
        focusAreas: committee.focusAreas,
        isActive: committee.isActive,
        type: committee.type,
        websiteUrl: committee.websiteUrl,
        githubOrg: committee.githubOrg,
        walletAddress: committee.walletAddress,
      },
      role: 'member',
      permissions: [],
      joinedAt: new Date().toISOString(),
      isActive: committee.isActive,
    }))

    // Also include simplified format for dashboard navigation
    const committees = userCommittees.map(committee => ({
      id: committee.id,
      name: committee.name,
    }))

    return NextResponse.json({
      success: true,
      memberships,
      committees,
      totalMemberships: memberships.length,
      activeMemberships: memberships.filter(
        m => m.isActive && m.committee.isActive
      ).length,
    })
  } catch (error) {
    console.error('[user-committees]: Error fetching committees', error)
    return NextResponse.json(
      { error: 'Failed to fetch user committees' },
      { status: 500 }
    )
  }
}
