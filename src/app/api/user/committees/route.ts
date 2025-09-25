import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getUserCommittees } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: userId' 
      }, { status: 400 });
    }

    console.log('[user-committees]: Fetching committees for user', { userId: parseInt(userId) });

    // Get all committees the user is a member of
    const userCommittees = await getUserCommittees(parseInt(userId));

    // Transform the data for the frontend
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
      role: 'member', // Default role since we don't have membership details
      permissions: [],
      joinedAt: new Date().toISOString(), // Placeholder
      isActive: committee.isActive
    }));

    return NextResponse.json({
      success: true,
      memberships,
      totalMemberships: memberships.length,
      activeMemberships: memberships.filter(m => m.isActive && m.committee.isActive).length
    });

  } catch (error) {
    console.error('[user-committees]: Error fetching committees', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user committees' 
    }, { status: 500 });
  }
} 