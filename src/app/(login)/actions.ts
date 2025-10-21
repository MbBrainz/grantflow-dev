'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import {
  validatedAction,
  validatedActionWithUser,
  validatedActionWithUserState,
} from '@/lib/auth/middleware'
import {
  users,
  ActivityType,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
  deleteAccountSchema,
  updateAccountSchema,
  type SignInInput,
  type SignUpInput,
  type UpdatePasswordInput,
  type DeleteAccountInput,
  type UpdateAccountInput,
} from '@/lib/db/schema'
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session'
import { getUser } from '@/lib/db/queries'
import { db } from '@/lib/db/drizzle'

// Helper function for activity logging (simplified without team context)
async function logActivity(userId: number, activityType: ActivityType) {
  // For now, just log to console since we removed activityLogs table
  await Promise.resolve()
  console.log(`[Activity]: User ${userId} performed ${activityType}`)
}

export const signIn = validatedAction(
  signInSchema,
  async (data: SignInInput) => {
    const { email, password } = data

    const foundUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (foundUser.length === 0) {
      return {
        error: 'Invalid email or password. Please try again.',
        email,
        password,
      }
    }

    const user = foundUser[0]

    // Check if user has a password hash (GitHub OAuth users might not have one)
    if (!user.passwordHash) {
      return {
        error: 'Please sign in with GitHub for this account.',
        email,
        password,
      }
    }

    const isPasswordValid = await comparePasswords(password, user.passwordHash)

    if (!isPasswordValid) {
      return {
        error: 'Invalid email or password. Please try again.',
        email,
        password,
      }
    }

    await Promise.all([
      setSession(user),
      logActivity(user.id, ActivityType.SIGN_IN),
    ])

    const redirectTo = data.redirect
    if (redirectTo === 'checkout') {
      // Redirect to pricing page instead (no Stripe integration)
      redirect('/pricing')
    }

    redirect('/dashboard')
  }
)

export const signUp = validatedAction(
  signUpSchema,
  async (data: SignUpInput) => {
    const { email, password, name } = data

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return { error: 'Failed to create user. Please try again.' }
    }

    const passwordHash = await hashPassword(password)

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
        primaryRole: 'team', // Default role for new users
      })
      .returning()

    if (!newUser) {
      return { error: 'Failed to create user. Please try again.' }
    }

    await Promise.all([
      setSession(newUser),
      logActivity(newUser.id, ActivityType.SIGN_UP),
    ])

    redirect('/dashboard')
  }
)

export async function signOut() {
  const user = await getUser()
  if (user) {
    await logActivity(user.id, ActivityType.SIGN_OUT)
  }

  // Delete both session cookies (custom JWT and NextAuth)
  const cookieStore = await cookies()
  cookieStore.delete('session') // Custom JWT session
  cookieStore.delete('next-auth.session-token') // NextAuth session (development)
  cookieStore.delete('__Secure-next-auth.session-token') // NextAuth session (production)

  // Redirect to home page
  redirect('/')
}

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data: UpdatePasswordInput, user) => {
    const { currentPassword, newPassword } = data

    if (!user.passwordHash) {
      return {
        error: 'Cannot update password for GitHub OAuth users.',
      }
    }

    const isCurrentPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    )

    if (!isCurrentPasswordValid) {
      return {
        error: 'Current password is incorrect.',
      }
    }

    if (currentPassword === newPassword) {
      return {
        error: 'New password must be different from the current password.',
      }
    }

    const newPasswordHash = await hashPassword(newPassword)

    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    await logActivity(user.id, ActivityType.UPDATE_PASSWORD)

    return { success: true, message: 'Password updated successfully.' }
  }
)

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data: DeleteAccountInput, user) => {
    const { password } = data

    if (!user.passwordHash) {
      return {
        error: 'Cannot delete GitHub OAuth accounts through this method.',
      }
    }

    const isPasswordValid = await comparePasswords(password, user.passwordHash)

    if (!isPasswordValid) {
      return {
        error: 'Incorrect password.',
      }
    }

    // Soft delete the user account
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        email: `deleted_${user.id}_${user.email}`, // Prevent email conflicts
      })
      .where(eq(users.id, user.id))

    await logActivity(user.id, ActivityType.DELETE_ACCOUNT)
    ;(await cookies()).delete('session')
    redirect('/sign-in')
  }
)

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data: UpdateAccountInput, user) => {
    const { name } = data

    await db
      .update(users)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    await logActivity(user.id, ActivityType.UPDATE_ACCOUNT)

    return { success: true, message: 'Account updated successfully.' }
  }
)

// ✅ State-compatible versions for useActionState

import type { ActionState } from '@/lib/auth/middleware'

export interface PasswordState extends ActionState {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

export interface DeleteState extends ActionState {
  password?: string
}

export interface AccountFormState extends ActionState {
  name?: string
}

export const updatePasswordState = validatedActionWithUserState<
  typeof updatePasswordSchema,
  PasswordState
>(updatePasswordSchema, async (data: UpdatePasswordInput, user) => {
  const { currentPassword, newPassword } = data

  if (!user.passwordHash) {
    return {
      error: 'Cannot update password for GitHub OAuth users.',
    }
  }

  const isCurrentPasswordValid = await comparePasswords(
    currentPassword,
    user.passwordHash
  )

  if (!isCurrentPasswordValid) {
    return {
      error: 'Current password is incorrect.',
    }
  }

  if (currentPassword === newPassword) {
    return {
      error: 'New password must be different from the current password.',
    }
  }

  const newPasswordHash = await hashPassword(newPassword)

  await db
    .update(users)
    .set({
      passwordHash: newPasswordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  await logActivity(user.id, ActivityType.UPDATE_PASSWORD)

  return { success: true, message: 'Password updated successfully.' }
})

export const deleteAccountState = validatedActionWithUserState<
  typeof deleteAccountSchema,
  DeleteState
>(deleteAccountSchema, async (data: DeleteAccountInput, user) => {
  const { password } = data

  if (!user.passwordHash) {
    return {
      error: 'Cannot delete GitHub OAuth accounts through this method.',
    }
  }

  const isPasswordValid = await comparePasswords(password, user.passwordHash)

  if (!isPasswordValid) {
    return {
      error: 'Incorrect password.',
    }
  }

  // Soft delete the user account
  await db
    .update(users)
    .set({
      deletedAt: new Date(),
      email: `deleted_${user.id}_${user.email}`, // Prevent email conflicts
    })
    .where(eq(users.id, user.id))

  await logActivity(user.id, ActivityType.DELETE_ACCOUNT)
  ;(await cookies()).delete('session')
  redirect('/sign-in')
})

export const updateAccountState = validatedActionWithUserState<
  typeof updateAccountSchema,
  AccountFormState
>(updateAccountSchema, async (data: UpdateAccountInput, user) => {
  const { name } = data

  await db
    .update(users)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  await logActivity(user.id, ActivityType.UPDATE_ACCOUNT)

  return { success: true, message: 'Account updated successfully.' }
})
