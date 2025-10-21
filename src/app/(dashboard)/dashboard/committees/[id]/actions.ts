'use server'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { z } from 'zod'
import {
  updateGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  createGrantProgram,
  updateGrantProgram,
} from '@/lib/db/writes/groups'
import { isCommitteeAdmin, getCommitteeById } from '@/lib/db/queries/committees'
import { searchUsers, getUserByEmail } from '@/lib/db/queries/users'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/drizzle'
import { groupMemberships } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

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
// Create Grant Program
// ============================================================================

const CreateGrantProgramSchema = z.object({
  committeeId: z.coerce.number(),
  name: z.string().min(1, 'Program name is required').max(100),
  description: z.string().optional().or(z.literal('')),
  fundingAmount: z.coerce.number().min(0).optional(),
  minGrantSize: z.coerce.number().min(0).optional(),
  maxGrantSize: z.coerce.number().min(0).optional(),
  minMilestoneSize: z.coerce.number().min(0).optional(),
  maxMilestoneSize: z.coerce.number().min(0).optional(),
})

export const createGrantProgramAction = validatedActionWithUser(
  CreateGrantProgramSchema,
  async (data, user) => {
    const {
      committeeId,
      name,
      description,
      fundingAmount,
      minGrantSize,
      maxGrantSize,
      minMilestoneSize,
      maxMilestoneSize,
    } = data

    console.log(
      `[createGrantProgramAction]: User ${user.id} creating grant program "${name}" for committee ${committeeId}`
    )

    // Check if user is admin
    const isAdmin = await isCommitteeAdmin(committeeId)
    if (!isAdmin) {
      return { error: 'You do not have permission to create grant programs' }
    }

    try {
      const program = await createGrantProgram({
        groupId: committeeId,
        name,
        description: description ?? undefined,
        fundingAmount,
        minGrantSize,
        maxGrantSize,
        minMilestoneSize,
        maxMilestoneSize,
      })

      revalidatePath(`/dashboard/committees/${committeeId}`)
      revalidatePath(`/dashboard/committees/${committeeId}/manage`)

      return { success: true, data: { programId: program.id } }
    } catch (error) {
      console.error('[createGrantProgramAction]: Error', error)
      return { error: 'Failed to create grant program' }
    }
  }
)

// ============================================================================
// Update Grant Program
// ============================================================================

const UpdateGrantProgramSchema = z.object({
  committeeId: z.coerce.number(),
  programId: z.coerce.number(),
  name: z.string().min(1, 'Program name is required').max(100),
  description: z.string().optional().or(z.literal('')),
  fundingAmount: z.coerce.number().min(0).optional(),
  minGrantSize: z.coerce.number().min(0).optional(),
  maxGrantSize: z.coerce.number().min(0).optional(),
  minMilestoneSize: z.coerce.number().min(0).optional(),
  maxMilestoneSize: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

export const updateGrantProgramAction = validatedActionWithUser(
  UpdateGrantProgramSchema,
  async (data, user) => {
    const { committeeId, programId, ...updateData } = data

    console.log(
      `[updateGrantProgramAction]: User ${user.id} updating grant program ${programId}`
    )

    // Check if user is admin
    const isAdmin = await isCommitteeAdmin(committeeId)
    if (!isAdmin) {
      return { error: 'You do not have permission to update grant programs' }
    }

    try {
      await updateGrantProgram(programId, {
        name: updateData.name,
        description: updateData.description ?? undefined,
        fundingAmount: updateData.fundingAmount,
        minGrantSize: updateData.minGrantSize,
        maxGrantSize: updateData.maxGrantSize,
        minMilestoneSize: updateData.minMilestoneSize,
        maxMilestoneSize: updateData.maxMilestoneSize,
        isActive: updateData.isActive,
      })

      revalidatePath(`/dashboard/committees/${committeeId}`)
      revalidatePath(`/dashboard/committees/${committeeId}/manage`)

      return { success: true }
    } catch (error) {
      console.error('[updateGrantProgramAction]: Error', error)
      return { error: 'Failed to update grant program' }
    }
  }
)

// ============================================================================
// Toggle Grant Program Active Status
// ============================================================================

const ToggleGrantProgramSchema = z.object({
  committeeId: z.coerce.number(),
  programId: z.coerce.number(),
  isActive: z.boolean(),
})

export const toggleGrantProgramAction = validatedActionWithUser(
  ToggleGrantProgramSchema,
  async (data, user) => {
    const { committeeId, programId, isActive } = data

    console.log(
      `[toggleGrantProgramAction]: User ${user.id} ${isActive ? 'activating' : 'deactivating'} grant program ${programId}`
    )

    // Check if user is admin
    const isAdmin = await isCommitteeAdmin(committeeId)
    if (!isAdmin) {
      return {
        error: 'You do not have permission to modify grant program status',
      }
    }

    try {
      await updateGrantProgram(programId, {
        isActive,
      })

      revalidatePath(`/dashboard/committees/${committeeId}`)
      revalidatePath(`/dashboard/committees/${committeeId}/manage`)

      return { success: true }
    } catch (error) {
      console.error('[toggleGrantProgramAction]: Error', error)
      return { error: 'Failed to update grant program status' }
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
