'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { getCommitteeById, isCommitteeAdmin } from '@/lib/db/queries/committees'
import { getUserByEmail, searchUsers } from '@/lib/db/queries/users'
import { groupMemberships } from '@/lib/db/schema'
import {
  addMemberToGroup,
  removeMemberFromGroup,
  updateGroup,
} from '@/lib/db/writes/groups'

// ============================================================================
// Update Committee Information
// ============================================================================

const UpdateCommitteeInfoSchema = z.object({
  committeeId: z.coerce.number(),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  githubOrg: z.string().max(100).optional().or(z.literal('')),
  focusAreas: z
    .array(z.string())
    .optional()
    .transform(val => (val && val.length > 0 ? val : undefined)),
})

export const updateCommitteeInfo = validatedActionWithUser(
  UpdateCommitteeInfoSchema,
  async (data, user) => {
    const { committeeId, ...updateData } = data

    console.log(
      `[updateCommitteeInfo]: User ${user.id} updating committee ${committeeId}`
    )

    // Check if user is admin
    const isAdmin = await isCommitteeAdmin(committeeId)
    if (!isAdmin) {
      return { error: 'You do not have permission to update this committee' }
    }

    try {
      await updateGroup(committeeId, {
        name: updateData.name,
        description: updateData.description ?? '',
        websiteUrl: updateData.websiteUrl ?? undefined,
        githubOrg: updateData.githubOrg ?? undefined,
        focusAreas: updateData.focusAreas,
      })

      revalidatePath(`/dashboard/committees/${committeeId}`)
      revalidatePath(`/dashboard/committees/${committeeId}/manage`)

      return { success: true }
    } catch (error) {
      console.error('[updateCommitteeInfo]: Error', error)
      return { error: 'Failed to update committee information' }
    }
  }
)

// ============================================================================
// Search Users
// ============================================================================

const SearchUsersSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
})

export const searchUsersAction = validatedActionWithUser(
  SearchUsersSchema,
  async (data, user) => {
    console.log(
      `[searchUsersAction]: User ${user.id} searching for "${data.query}"`
    )

    try {
      const users = await searchUsers(data.query, 10)
      return { success: true, data: users }
    } catch (error) {
      console.error('[searchUsersAction]: Error', error)
      return { error: 'Failed to search users' }
    }
  }
)

// ============================================================================
// Add Committee Member
// ============================================================================

const AddCommitteeMemberSchema = z.object({
  committeeId: z.coerce.number(),
  userEmail: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']).default('member'),
})

export const addCommitteeMember = validatedActionWithUser(
  AddCommitteeMemberSchema,
  async (data, user) => {
    const { committeeId, userEmail, role } = data

    console.log(
      `[addCommitteeMember]: User ${user.id} adding ${userEmail} to committee ${committeeId} as ${role}`
    )

    // Check if user is admin
    const isAdmin = await isCommitteeAdmin(committeeId)
    if (!isAdmin) {
      return { error: 'You do not have permission to add members' }
    }

    try {
      // Find user by email
      const userToAdd = await getUserByEmail(userEmail)
      if (!userToAdd) {
        return { error: 'User not found with that email address' }
      }

      // Check if user is already a member
      const existingMembership = await db.query.groupMemberships.findFirst({
        where: and(
          eq(groupMemberships.groupId, committeeId),
          eq(groupMemberships.userId, userToAdd.id)
        ),
      })

      if (existingMembership?.isActive) {
        return { error: 'User is already a member of this committee' }
      }

      // If membership exists but is inactive, reactivate it
      if (existingMembership && !existingMembership.isActive) {
        await db
          .update(groupMemberships)
          .set({
            isActive: true,
            role,
            joinedAt: new Date(),
          })
          .where(eq(groupMemberships.id, existingMembership.id))
      } else {
        // Add new member
        await addMemberToGroup({
          groupId: committeeId,
          userId: userToAdd.id,
          role,
        })
      }

      revalidatePath(`/dashboard/committees/${committeeId}`)
      revalidatePath(`/dashboard/committees/${committeeId}/manage`)

      return { success: true, data: { userName: userToAdd.name } }
    } catch (error) {
      console.error('[addCommitteeMember]: Error', error)
      return { error: 'Failed to add committee member' }
    }
  }
)

// ============================================================================
// Remove Committee Member
// ============================================================================

const RemoveCommitteeMemberSchema = z.object({
  committeeId: z.coerce.number(),
  userId: z.coerce.number(),
})

export const removeCommitteeMember = validatedActionWithUser(
  RemoveCommitteeMemberSchema,
  async (data, user) => {
    const { committeeId, userId } = data

    console.log(
      `[removeCommitteeMember]: User ${user.id} removing user ${userId} from committee ${committeeId}`
    )

    // Check if user is admin
    const isAdmin = await isCommitteeAdmin(committeeId)
    if (!isAdmin) {
      return { error: 'You do not have permission to remove members' }
    }

    // Don't allow removing yourself
    if (userId === user.id) {
      return { error: 'You cannot remove yourself from the committee' }
    }

    try {
      await removeMemberFromGroup(committeeId, userId)

      revalidatePath(`/dashboard/committees/${committeeId}`)
      revalidatePath(`/dashboard/committees/${committeeId}/manage`)

      return { success: true }
    } catch (error) {
      console.error('[removeCommitteeMember]: Error', error)
      return { error: 'Failed to remove committee member' }
    }
  }
)

// ============================================================================
// Update Member Role
// ============================================================================

const UpdateMemberRoleSchema = z.object({
  committeeId: z.coerce.number(),
  userId: z.coerce.number(),
  role: z.enum(['admin', 'member']),
})

export const updateMemberRole = validatedActionWithUser(
  UpdateMemberRoleSchema,
  async (data, user) => {
    const { committeeId, userId, role } = data

    console.log(
      `[updateMemberRole]: User ${user.id} updating user ${userId} role to ${role} in committee ${committeeId}`
    )

    // Check if user is admin
    const isAdmin = await isCommitteeAdmin(committeeId)
    if (!isAdmin) {
      return { error: 'You do not have permission to update member roles' }
    }

    // Don't allow changing your own role
    if (userId === user.id) {
      return { error: 'You cannot change your own role' }
    }

    try {
      await db
        .update(groupMemberships)
        .set({ role })
        .where(
          and(
            eq(groupMemberships.groupId, committeeId),
            eq(groupMemberships.userId, userId)
          )
        )

      revalidatePath(`/dashboard/committees/${committeeId}`)
      revalidatePath(`/dashboard/committees/${committeeId}/manage`)

      return { success: true }
    } catch (error) {
      console.error('[updateMemberRole]: Error', error)
      return { error: 'Failed to update member role' }
    }
  }
)

// ============================================================================
// Update Committee Budget Configuration
// ============================================================================

const UpdateCommitteeBudgetSchema = z.object({
  committeeId: z.coerce.number(),
  fundingAmount: z.coerce.number().min(0).optional(),
  minGrantSize: z.coerce.number().min(0).optional(),
  maxGrantSize: z.coerce.number().min(0).optional(),
  minMilestoneSize: z.coerce.number().min(0).optional(),
  maxMilestoneSize: z.coerce.number().min(0).optional(),
})

export const updateCommitteeBudget = validatedActionWithUser(
  UpdateCommitteeBudgetSchema,
  async (data, user) => {
    const { committeeId, ...budgetData } = data

    console.log(
      `[updateCommitteeBudget]: User ${user.id} updating budget for committee ${committeeId}`
    )

    // Check if user is admin
    const isAdmin = await isCommitteeAdmin(committeeId)
    if (!isAdmin) {
      return { error: 'You do not have permission to update committee budget' }
    }

    // Validate min/max constraints
    if (
      budgetData.minGrantSize !== undefined &&
      budgetData.maxGrantSize !== undefined &&
      budgetData.minGrantSize > budgetData.maxGrantSize
    ) {
      return { error: 'Minimum grant size cannot exceed maximum grant size' }
    }

    if (
      budgetData.minMilestoneSize !== undefined &&
      budgetData.maxMilestoneSize !== undefined &&
      budgetData.minMilestoneSize > budgetData.maxMilestoneSize
    ) {
      return {
        error: 'Minimum milestone size cannot exceed maximum milestone size',
      }
    }

    try {
      await updateGroup(committeeId, {
        fundingAmount: budgetData.fundingAmount,
        minGrantSize: budgetData.minGrantSize,
        maxGrantSize: budgetData.maxGrantSize,
        minMilestoneSize: budgetData.minMilestoneSize,
        maxMilestoneSize: budgetData.maxMilestoneSize,
      })

      revalidatePath(`/dashboard/committees/${committeeId}`)
      revalidatePath(`/dashboard/committees/${committeeId}/manage`)

      return { success: true }
    } catch (error) {
      console.error('[updateCommitteeBudget]: Error', error)
      return { error: 'Failed to update committee budget' }
    }
  }
)

// ============================================================================
// Get Committee for Management (Server-side only, not an action)
// ============================================================================

export async function getCommitteeForManagement(committeeId: number) {
  const committee = await getCommitteeById(committeeId)
  return committee
}

// ============================================================================
// Update Multisig Configuration
// ============================================================================

const SignatoryMappingSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  userId: z.number().int().optional(),
})

const UpdateMultisigConfigSchema = z.object({
  committeeId: z.coerce.number(),
  multisigAddress: z.string().min(1, 'Multisig address is required'),
  signatories: z
    .array(SignatoryMappingSchema)
    .min(2, 'At least 2 signatories required'),
  threshold: z.number().int().min(1, 'Threshold must be at least 1'),
  approvalWorkflow: z.enum(['merged', 'separated']),
  votingTimeoutBlocks: z.number().int().positive(),
  automaticExecution: z.boolean(),
  network: z.enum(['polkadot', 'paseo']),
  parentBountyId: z.number().int().nonnegative('Parent bounty ID is required'),
  curatorProxyAddress: z.string().min(1, 'Curator proxy address is required'),
  bountyDescription: z.string().optional(),
})

export const updateMultisigConfig = validatedActionWithUser(
  UpdateMultisigConfigSchema,
  async (data, user) => {
    const { committeeId, ...multisigConfig } = data

    console.log(
      `[updateMultisigConfig]: User ${user.id} updating multisig for committee ${committeeId}`
    )

    // Check if user is admin
    const isAdmin = await isCommitteeAdmin(committeeId)
    if (!isAdmin) {
      return { error: 'You do not have permission to update this committee' }
    }

    // Validate threshold doesn't exceed signatory count
    if (multisigConfig.threshold > multisigConfig.signatories.length) {
      return { error: 'Threshold cannot exceed number of signatories' }
    }

    try {
      const committee = await getCommitteeById(committeeId)
      if (!committee) {
        return { error: 'Committee not found' }
      }

      // Update committee with multisig config
      const currentSettings = committee.settings ?? {
        votingThreshold: 0.5,
        requiredApprovalPercentage: 50,
        stages: [],
      }

      await updateGroup(committeeId, {
        settings: {
          ...currentSettings,
          multisig: multisigConfig,
        },
      })

      revalidatePath(`/dashboard/committees/${committeeId}/manage`)
      revalidatePath(`/dashboard/committees/${committeeId}`)

      return { success: true }
    } catch (error) {
      console.error('[updateMultisigConfig]: Error', error)
      return { error: 'Failed to update multisig configuration' }
    }
  }
)

// ============================================================================
// Link Signatory to User Account
// ============================================================================

const LinkSignatorySchema = z.object({
  committeeId: z.coerce.number(),
  address: z.string().min(1, 'Wallet address is required'),
})

export const linkSignatoryToUser = validatedActionWithUser(
  LinkSignatorySchema,
  async (data, user) => {
    const { committeeId, address } = data

    console.log(
      `[linkSignatoryToUser]: User ${user.id} linking signatory ${address} to their account`
    )

    try {
      const committee = await getCommitteeById(committeeId)
      if (!committee) {
        return { error: 'Committee not found' }
      }

      const multisig = committee.settings?.multisig
      if (!multisig) {
        return { error: 'Committee has no multisig configuration' }
      }

      // Check if this address exists in the signatories
      const signatoryIndex = multisig.signatories.findIndex(
        s => s.address === address
      )
      if (signatoryIndex === -1) {
        return { error: 'Address is not a signatory of this committee' }
      }

      // Update the signatory mapping - user can always claim their own address
      const updatedSignatories = [...multisig.signatories]
      updatedSignatories[signatoryIndex] = {
        address,
        userId: user.id,
      }

      const currentSettings = committee.settings ?? {
        votingThreshold: 0.5,
        requiredApprovalPercentage: 50,
        stages: [],
      }

      await updateGroup(committeeId, {
        settings: {
          ...currentSettings,
          multisig: {
            ...multisig,
            signatories: updatedSignatories,
          },
        },
      })

      revalidatePath(`/dashboard/committees/${committeeId}/manage`)
      revalidatePath(`/dashboard/committees/${committeeId}`)

      return { success: true }
    } catch (error) {
      console.error('[linkSignatoryToUser]: Error', error)
      return { error: 'Failed to link signatory to user' }
    }
  }
)
