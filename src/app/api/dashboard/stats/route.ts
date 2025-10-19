import { NextResponse } from 'next/server'
import {
  getDashboardStats,
  getUpcomingDeadlines,
} from '@/lib/db/queries/dashboard'
import { getUser } from '@/lib/db/queries/users'

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [stats, deadlines] = await Promise.all([
      getDashboardStats(),
      getUpcomingDeadlines(user.id),
    ])

    return NextResponse.json({ ...stats, upcomingDeadlines: deadlines })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
