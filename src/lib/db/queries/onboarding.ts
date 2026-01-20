import { and, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '../drizzle'
import { groupMemberships, groups, users } from '../schema'
import type {
  MultisigConfig,
  SignatoryMapping,
} from '../schema/jsonTypes/GroupSettings'
import { getUser, getUserGroups } from './users'

/**
 * Check if the current user needs to go through onboarding
 * Returns true if user has no active group memberships
 */
export async function needsOnboarding(): Promise<boolean> {
  const user = await getUser()
  if (!user) return false

  const userGroups = await getUserGroups(user.id)
  return userGroups.length === 0
}

/**
 * Check if a specific user needs onboarding
 */
export async function userNeedsOnboarding(userId: number): Promise<boolean> {
  const userGroups = await getUserGroups(userId)
  return userGroups.length === 0
}

/**
 * Search committees by name
 * Returns active committees matching the search query
 */
export async function searchCommittees(query: string, limit = 10) {
  if (!query.trim()) {
    // Return all active committees if no query
    return await db.query.groups.findMany({
      where: and(eq(groups.type, 'committee'), eq(groups.isActive, true)),
      limit,
      orderBy: (groups, { desc }) => [desc(groups.createdAt)],
    })
  }

  return await db.query.groups.findMany({
    where: and(
      eq(groups.type, 'committee'),
      eq(groups.isActive, true),
      or(
        ilike(groups.name, `%${query}%`),
        ilike(groups.description, `%${query}%`)
      )
    ),
    limit,
    orderBy: (groups, { desc }) => [desc(groups.createdAt)],
  })
}

/**
 * Find a committee by network and bounty ID
 * Returns null if no committee exists for this bounty
 */
export async function findCommitteeByBounty(
  network: 'polkadot' | 'paseo',
  bountyId: number
) {
  // Query committees where settings.multisig.network and settings.multisig.parentBountyId match
  const committees = await db.query.groups.findMany({
    where: and(eq(groups.type, 'committee'), eq(groups.isActive, true)),
  })

  // Filter in JS since we need to check JSONB fields
  return (
    committees.find(committee => {
      const multisig = committee.settings?.multisig
      if (!multisig) return false
      return (
        multisig.network === network && multisig.parentBountyId === bountyId
      )
    }) ?? null
  )
}

/**
 * Check if a bounty is already registered in the system
 */
export async function isBountyRegistered(
  network: 'polkadot' | 'paseo',
  bountyId: number
): Promise<boolean> {
  const committee = await findCommitteeByBounty(network, bountyId)
  return committee !== null
}

/**
 * Find a signatory mapping that matches the given wallet address
 * Returns the signatory if found, null otherwise
 */
export async function findMatchingSignatory(
  committeeId: number,
  walletAddress: string
): Promise<SignatoryMapping | null> {
  const committee = await db.query.groups.findFirst({
    where: and(eq(groups.id, committeeId), eq(groups.type, 'committee')),
  })

  if (!committee?.settings?.multisig?.signatories) {
    return null
  }

  const normalizedAddress = walletAddress.toLowerCase()
  return (
    committee.settings.multisig.signatories.find(
      s => s.address.toLowerCase() === normalizedAddress
    ) ?? null
  )
}

/**
 * Get committee with its signatories for display
 */
export async function getCommitteeWithSignatories(committeeId: number) {
  const committee = await db.query.groups.findFirst({
    where: and(eq(groups.id, committeeId), eq(groups.type, 'committee')),
    with: {
      members: {
        where: eq(groupMemberships.isActive, true),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              walletAddress: true,
            },
          },
        },
      },
    },
  })

  if (!committee) return null

  const signatories = committee.settings?.multisig?.signatories ?? []

  // Enrich signatories with user info where linked
  const enrichedSignatories = signatories.map(sig => {
    const linkedMember = committee.members.find(m => m.user.id === sig.userId)
    return {
      ...sig,
      user: linkedMember?.user ?? null,
    }
  })

  return {
    ...committee,
    signatories: enrichedSignatories,
  }
}

/**
 * Link a wallet address to a user in the committee's signatory list
 * and add the user as a member of the committee
 */
export async function linkSignatoryAndJoin(
  committeeId: number,
  userId: number,
  walletAddress: string
): Promise<{ success: boolean; error?: string }> {
  const committee = await db.query.groups.findFirst({
    where: and(eq(groups.id, committeeId), eq(groups.type, 'committee')),
  })

  if (!committee) {
    return { success: false, error: 'Committee not found' }
  }

  const multisig = committee.settings?.multisig
  if (!multisig?.signatories) {
    return { success: false, error: 'Committee has no multisig configuration' }
  }

  // Find the signatory with matching address
  const normalizedAddress = walletAddress.toLowerCase()
  const signatoryIndex = multisig.signatories.findIndex(
    s => s.address.toLowerCase() === normalizedAddress
  )

  if (signatoryIndex === -1) {
    return { success: false, error: 'Wallet address is not a signatory' }
  }

  // Check if signatory is already linked to another user
  const existingSignatory = multisig.signatories[signatoryIndex]
  if (existingSignatory.userId && existingSignatory.userId !== userId) {
    return {
      success: false,
      error: 'This signatory is already linked to another user',
    }
  }

  // Update the signatory to link to this user
  const updatedSignatories = [...multisig.signatories]
  updatedSignatories[signatoryIndex] = {
    ...existingSignatory,
    userId,
  }

  const updatedSettings = {
    // Preserve existing settings or use defaults
    votingThreshold: committee.settings?.votingThreshold ?? 1,
    requiredApprovalPercentage:
      committee.settings?.requiredApprovalPercentage ?? 100,
    stages: committee.settings?.stages ?? ['review', 'approved', 'rejected'],
    multisig: {
      ...multisig,
      signatories: updatedSignatories,
    },
  }

  // Start transaction to update both committee settings and add membership
  await db.transaction(async tx => {
    // Update committee settings with linked signatory
    await tx
      .update(groups)
      .set({
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, committeeId))

    // Check if user is already a member
    const existingMembership = await tx.query.groupMemberships.findFirst({
      where: and(
        eq(groupMemberships.groupId, committeeId),
        eq(groupMemberships.userId, userId)
      ),
    })

    if (existingMembership) {
      // Reactivate if inactive
      if (!existingMembership.isActive) {
        await tx
          .update(groupMemberships)
          .set({ isActive: true })
          .where(eq(groupMemberships.id, existingMembership.id))
      }
    } else {
      // Add as new member
      await tx.insert(groupMemberships).values({
        groupId: committeeId,
        userId,
        role: 'member',
        isActive: true,
      })
    }

    // Update user's primary group if not set
    await tx
      .update(users)
      .set({
        primaryGroupId: committeeId,
        primaryRole: 'committee',
        walletAddress: walletAddress,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), sql`${users.primaryGroupId} IS NULL`))
  })

  return { success: true }
}

/**
 * Create a new team for an applicant and set as their primary group
 */
export async function createTeamAndJoin(
  userId: number,
  data: {
    name: string
    description?: string
    websiteUrl?: string
    githubOrg?: string
  }
): Promise<{ success: boolean; teamId?: number; error?: string }> {
  try {
    const result = await db.transaction(async tx => {
      // Create the team
      const [team] = await tx
        .insert(groups)
        .values({
          name: data.name,
          type: 'team',
          description: data.description,
          websiteUrl: data.websiteUrl,
          githubOrg: data.githubOrg,
          isActive: true,
        })
        .returning()

      // Add user as admin of the team
      await tx.insert(groupMemberships).values({
        groupId: team.id,
        userId,
        role: 'admin',
        isActive: true,
      })

      // Set as user's primary group
      await tx
        .update(users)
        .set({
          primaryGroupId: team.id,
          primaryRole: 'team',
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      return team
    })

    return { success: true, teamId: result.id }
  } catch (error) {
    console.error('Failed to create team:', error)
    return { success: false, error: 'Failed to create team' }
  }
}

/**
 * Get committee statistics for display in search results
 */
export async function getCommitteeStats(committeeId: number) {
  const memberCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(groupMemberships)
    .where(
      and(
        eq(groupMemberships.groupId, committeeId),
        eq(groupMemberships.isActive, true)
      )
    )

  return {
    memberCount: Number(memberCount[0]?.count ?? 0),
  }
}

export type CommitteeWithSignatories = Awaited<
  ReturnType<typeof getCommitteeWithSignatories>
>
