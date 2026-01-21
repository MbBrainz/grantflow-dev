'use server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { ActionState } from '@/lib/auth/middleware'
import { validatedActionWithUserState } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { accounts, sessions, users } from '@/lib/db/schema'

export interface DeleteAccountState extends ActionState {
  success?: boolean
}

const deleteAccountSchema = z.object({})

/**
 * Delete the current user's account
 *
 * This action:
 * 1. Deletes all sessions
 * 2. Deletes all linked accounts
 * 3. Soft-deletes the user (sets deletedAt)
 */
export const deleteAccount = validatedActionWithUserState<
  typeof deleteAccountSchema,
  DeleteAccountState
>(deleteAccountSchema, async (_data, user) => {
  try {
    // Delete all sessions for this user
    await db.delete(sessions).where(eq(sessions.userId, user.id))

    // Delete all linked accounts
    await db.delete(accounts).where(eq(accounts.userId, user.id))

    // Soft-delete the user (preserves data integrity for related records)
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        email: null, // Clear email to allow re-registration
        name: 'Deleted User',
        avatarUrl: null,
        githubId: null,
        walletAddress: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    return { success: true }
  } catch (error) {
    console.error('[deleteAccount]: Error', error)
    return { error: 'Failed to delete account. Please try again.' }
  }
})
