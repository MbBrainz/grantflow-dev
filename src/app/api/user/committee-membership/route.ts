import { and, eq } from 'drizzle-orm'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { groupMemberships } from '@/lib/db/schema'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const groupId =
      searchParams.get('groupId') ?? searchParams.get('committeeId')

    if (!userId || !groupId) {
      return NextResponse.json(
        {
          error: 'Missing required parameters: userId and groupId',
        },
        { status: 400 }
      )
    }

    console.log('[committee-membership]: Checking membership', {
      userId: parseInt(userId),
      groupId: parseInt(groupId),
    })

    // Check if user is a member of this group/committee
    const membership = await db.query.groupMemberships.findFirst({
      where: and(
        eq(groupMemberships.userId, parseInt(userId)),
        eq(groupMemberships.groupId, parseInt(groupId)),
        eq(groupMemberships.isActive, true)
      ),
      with: {
        group: {
          columns: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            type: true,
          },
        },
      },
    })

    if (membership) {
      return NextResponse.json({
        isMember: true,
        role: membership.role,
        permissions: membership.permissions ?? [],
        joinedAt: membership.joinedAt,
        group: membership.group,
      })
    } else {
      return NextResponse.json({
        isMember: false,
        role: null,
        permissions: [],
        joinedAt: null,
        committee: null,
      })
    }
  } catch (error) {
    console.error('[committee-membership]: Error checking membership', error)
    return NextResponse.json(
      {
        error: 'Failed to check committee membership',
      },
      { status: 500 }
    )
  }
}
