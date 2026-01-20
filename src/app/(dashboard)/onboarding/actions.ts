'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import {
  createTeamAndJoin,
  findCommitteeByBounty,
  findMatchingSignatory,
  getCommitteeWithSignatories,
  isBountyRegistered,
  linkSignatoryAndJoin,
  searchCommittees,
} from '@/lib/db/queries/onboarding'
import { getUser } from '@/lib/db/queries/users'
import { groupMemberships, groups, users } from '@/lib/db/schema'
import type { GroupSettings } from '@/lib/db/schema/jsonTypes/GroupSettings'
import { createGroup } from '@/lib/db/writes/groups'

// ============================================================================
// Search Committees
// ============================================================================

const SearchCommitteesSchema = z.object({
  query: z.string().default(''),
})

export const searchCommitteesAction = validatedActionWithUser(
  SearchCommitteesSchema,
  async (data, user) => {
    console.log(
      `[searchCommitteesAction]: User ${user.id} searching for "${data.query}"`
    )

    try {
      const committees = await searchCommittees(data.query, 20)

      // Enrich with member counts
      const enrichedCommittees = await Promise.all(
        committees.map(async committee => {
          const memberCount = await db
            .select({ count: db.$count(groupMemberships) })
            .from(groupMemberships)
            .where(eq(groupMemberships.groupId, committee.id))

          return {
            id: committee.id,
            name: committee.name,
            description: committee.description,
            logoUrl: committee.logoUrl,
            focusAreas: committee.focusAreas,
            network: committee.settings?.multisig?.network,
            bountyId: committee.settings?.multisig?.parentBountyId,
            memberCount: Number(memberCount[0]?.count ?? 0),
          }
        })
      )

      return { success: true, data: enrichedCommittees }
    } catch (error) {
      console.error('[searchCommitteesAction]: Error', error)
      return { error: 'Failed to search committees' }
    }
  }
)

// ============================================================================
// Look Up Bounty
// ============================================================================

const LookUpBountySchema = z.object({
  network: z.enum(['polkadot', 'paseo']),
  bountyId: z.coerce.number().int().nonnegative('Bounty ID must be positive'),
})

export const lookUpBountyAction = validatedActionWithUser(
  LookUpBountySchema,
  async (data, user) => {
    console.log(
      `[lookUpBountyAction]: User ${user.id} looking up bounty ${data.bountyId} on ${data.network}`
    )

    try {
      // Check if bounty is already registered
      const existingCommittee = await findCommitteeByBounty(
        data.network,
        data.bountyId
      )

      if (existingCommittee) {
        return {
          success: true,
          data: {
            exists: true,
            committeeId: existingCommittee.id,
            committeeName: existingCommittee.name,
            network: data.network,
            bountyId: data.bountyId,
          },
        }
      }

      return {
        success: true,
        data: {
          exists: false,
          network: data.network,
          bountyId: data.bountyId,
        },
      }
    } catch (error) {
      console.error('[lookUpBountyAction]: Error', error)
      return { error: 'Failed to look up bounty' }
    }
  }
)

// ============================================================================
// Verify Wallet and Join Committee
// ============================================================================

const VerifyWalletAndJoinSchema = z.object({
  committeeId: z.coerce.number(),
  walletAddress: z.string().min(1, 'Wallet address is required'),
})

export const verifyWalletAndJoinAction = validatedActionWithUser(
  VerifyWalletAndJoinSchema,
  async (data, user) => {
    console.log(
      `[verifyWalletAndJoinAction]: User ${user.id} verifying wallet ${data.walletAddress} for committee ${data.committeeId}`
    )

    try {
      // Check if wallet matches a signatory
      const matchingSignatory = await findMatchingSignatory(
        data.committeeId,
        data.walletAddress
      )

      if (!matchingSignatory) {
        // Get committee signatories to show in error message
        const committee = await getCommitteeWithSignatories(data.committeeId)
        const signatories =
          committee?.settings?.multisig?.signatories?.map(s => s.address) ?? []

        return {
          error: 'Wallet address is not a signatory on this committee',
          data: { signatories },
        }
      }

      // Check if signatory is already linked to another user
      if (matchingSignatory.userId && matchingSignatory.userId !== user.id) {
        return {
          error: 'This signatory is already linked to another user account',
        }
      }

      // Link signatory and join committee
      const result = await linkSignatoryAndJoin(
        data.committeeId,
        user.id,
        data.walletAddress
      )

      if (!result.success) {
        return { error: result.error ?? 'Failed to join committee' }
      }

      revalidatePath('/dashboard')
      revalidatePath('/onboarding')

      return {
        success: true,
        data: { committeeId: data.committeeId },
      }
    } catch (error) {
      console.error('[verifyWalletAndJoinAction]: Error', error)
      return { error: 'Failed to verify wallet and join committee' }
    }
  }
)

// ============================================================================
// Get Committee for Joining
// ============================================================================

const GetCommitteeForJoiningSchema = z.object({
  committeeId: z.coerce.number(),
})

export const getCommitteeForJoiningAction = validatedActionWithUser(
  GetCommitteeForJoiningSchema,
  async (data, user) => {
    console.log(
      `[getCommitteeForJoiningAction]: User ${user.id} getting committee ${data.committeeId}`
    )

    try {
      const committee = await getCommitteeWithSignatories(data.committeeId)

      if (!committee) {
        return { error: 'Committee not found' }
      }

      return {
        success: true,
        data: {
          id: committee.id,
          name: committee.name,
          description: committee.description,
          logoUrl: committee.logoUrl,
          focusAreas: committee.focusAreas,
          websiteUrl: committee.websiteUrl,
          githubOrg: committee.githubOrg,
          network: committee.settings?.multisig?.network,
          bountyId: committee.settings?.multisig?.parentBountyId,
          signatories: committee.signatories,
          memberCount: committee.members.length,
        },
      }
    } catch (error) {
      console.error('[getCommitteeForJoiningAction]: Error', error)
      return { error: 'Failed to get committee' }
    }
  }
)

// ============================================================================
// Create Committee from Bounty
// ============================================================================

const SignatorySchema = z.object({
  address: z.string().min(1, 'Address is required'),
  userId: z.number().int().optional(),
})

const CreateCommitteeSchema = z.object({
  // Committee info
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  focusAreas: z.array(z.string()).optional(),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  githubOrg: z.string().max(100).optional().or(z.literal('')),

  // Bounty/multisig config
  network: z.enum(['polkadot', 'paseo']),
  parentBountyId: z.coerce.number().int().nonnegative(),
  curatorProxyAddress: z.string().min(1, 'Curator proxy address is required'),
  multisigAddress: z.string().min(1, 'Multisig address is required'),
  signatories: z
    .array(SignatorySchema)
    .min(2, 'At least 2 signatories required'),
  threshold: z.coerce.number().int().min(1, 'Threshold must be at least 1'),

  // Creator's wallet for verification
  creatorWalletAddress: z.string().min(1, 'Your wallet address is required'),
})

export const createCommitteeAction = validatedActionWithUser(
  CreateCommitteeSchema,
  async (data, user) => {
    console.log(
      `[createCommitteeAction]: User ${user.id} creating committee for bounty ${data.parentBountyId} on ${data.network}`
    )

    try {
      // Verify bounty is not already registered
      const isRegistered = await isBountyRegistered(
        data.network,
        data.parentBountyId
      )
      if (isRegistered) {
        return {
          error:
            'A committee already exists for this bounty. Please join the existing committee instead.',
        }
      }

      // Verify creator's wallet is one of the signatories
      const normalizedCreatorWallet = data.creatorWalletAddress.toLowerCase()
      const isSignatory = data.signatories.some(
        s => s.address.toLowerCase() === normalizedCreatorWallet
      )
      if (!isSignatory) {
        return {
          error:
            'Your wallet address must be one of the signatories to create this committee',
        }
      }

      // Validate threshold
      if (data.threshold > data.signatories.length) {
        return { error: 'Threshold cannot exceed number of signatories' }
      }

      // Prepare multisig config with creator linked
      const signatories = data.signatories.map(s => ({
        address: s.address,
        userId:
          s.address.toLowerCase() === normalizedCreatorWallet
            ? user.id
            : s.userId,
      }))

      const multisigConfig = {
        network: data.network,
        parentBountyId: data.parentBountyId,
        curatorProxyAddress: data.curatorProxyAddress,
        multisigAddress: data.multisigAddress,
        signatories,
        threshold: data.threshold,
        approvalWorkflow: 'merged' as const,
        votingTimeoutBlocks: 100,
        automaticExecution: false,
      }

      const settings: GroupSettings = {
        votingThreshold: 0.5,
        requiredApprovalPercentage: 50,
        stages: [],
        multisig: multisigConfig,
      }

      // Create the committee
      const committee = await createGroup({
        name: data.name,
        type: 'committee',
        description: data.description,
        focusAreas: data.focusAreas,
        websiteUrl: data.websiteUrl || undefined,
        githubOrg: data.githubOrg || undefined,
        settings,
      })

      // Add creator as admin member
      await db.insert(groupMemberships).values({
        groupId: committee.id,
        userId: user.id,
        role: 'admin',
        isActive: true,
      })

      // Set as user's primary group
      await db
        .update(users)
        .set({
          primaryGroupId: committee.id,
          primaryRole: 'committee',
          walletAddress: data.creatorWalletAddress,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      revalidatePath('/dashboard')
      revalidatePath('/onboarding')

      return {
        success: true,
        data: { committeeId: committee.id },
      }
    } catch (error) {
      console.error('[createCommitteeAction]: Error', error)
      return { error: 'Failed to create committee' }
    }
  }
)

// ============================================================================
// Create Team (Applicant)
// ============================================================================

const CreateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100),
  description: z.string().optional(),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  githubOrg: z.string().max(100).optional().or(z.literal('')),
})

export const createTeamAction = validatedActionWithUser(
  CreateTeamSchema,
  async (data, user) => {
    console.log(
      `[createTeamAction]: User ${user.id} creating team "${data.name}"`
    )

    try {
      const result = await createTeamAndJoin(user.id, {
        name: data.name,
        description: data.description,
        websiteUrl: data.websiteUrl || undefined,
        githubOrg: data.githubOrg || undefined,
      })

      if (!result.success) {
        return { error: result.error ?? 'Failed to create team' }
      }

      revalidatePath('/dashboard')
      revalidatePath('/onboarding')

      return {
        success: true,
        data: { teamId: result.teamId },
      }
    } catch (error) {
      console.error('[createTeamAction]: Error', error)
      return { error: 'Failed to create team' }
    }
  }
)

// ============================================================================
// Check Onboarding Status (Server function, not action)
// ============================================================================

export async function checkOnboardingStatus() {
  const user = await getUser()
  if (!user) {
    return { needsOnboarding: false, user: null }
  }

  const memberships = await db.query.groupMemberships.findMany({
    where: eq(groupMemberships.userId, user.id),
    with: {
      group: true,
    },
  })

  const activeMemberships = memberships.filter(m => m.isActive)

  return {
    needsOnboarding: activeMemberships.length === 0,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      primaryRole: user.primaryRole,
      primaryGroupId: user.primaryGroupId,
    },
    groups: activeMemberships.map(m => ({
      id: m.group.id,
      name: m.group.name,
      type: m.group.type,
      role: m.role,
    })),
  }
}
