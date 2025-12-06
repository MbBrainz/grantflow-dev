'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import {
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

// ✅ State-compatible versions for useActionState

export interface SignInState extends ActionState {
  email?: string
  password?: string
  redirect?: string
  priceId?: string
  inviteId?: string
}

export interface SignUpState extends ActionState {
  email?: string
  password?: string
  name?: string
  redirect?: string
}

async function signInStateHandler(data: SignInInput): Promise<SignInState> {
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

  // Return redirect URL in state instead of calling redirect()
  // This works better with useActionState which expects return values
  const redirectTo = data.redirect === 'checkout' ? '/pricing' : '/dashboard'
  return { redirect: redirectTo }
}

async function signUpStateHandler(data: SignUpInput): Promise<SignUpState> {
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

  // Return redirect URL in state instead of calling redirect()
  // This works better with useActionState which expects return values
  return { redirect: '/dashboard' }
}

export async function signInState(
  prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const data = Object.fromEntries(formData.entries())
  const result = signInSchema.safeParse(data)

  if (!result.success) {
    console.error('[signInState]: Validation failed', result.error)
    return {
      ...prevState,
      error: result.error?.issues[0]?.message ?? 'Validation failed',
    }
  }

  try {
    return await signInStateHandler(result.data)
  } catch (error) {
    console.error('[signInState]: Action failed', error)

    // Check for connection errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ECONNREFUSED') {
        return {
          ...prevState,
          error:
            'Database connection failed. Please ensure the database is running and try again.',
        }
      }
    }

    return {
      ...prevState,
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.',
    }
  }
}

export async function signUpState(
  prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const data = Object.fromEntries(formData.entries())
  const result = signUpSchema.safeParse(data)

  if (!result.success) {
    console.error('[signUpState]: Validation failed', result.error)
    return {
      ...prevState,
      error: result.error?.issues[0]?.message ?? 'Validation failed',
    }
  }

  try {
    return await signUpStateHandler(result.data)
  } catch (error) {
    console.error('[signUpState]: Action failed', error)

    // Check for connection errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ECONNREFUSED') {
        return {
          ...prevState,
          error:
            'Database connection failed. Please ensure the database is running and try again.',
        }
      }
    }

    return {
      ...prevState,
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.',
    }
  }
}

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
  redirect?: string
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

  // Return redirect URL in state instead of calling redirect()
  // This works better with useActionState which expects return values
  return { redirect: '/sign-in' }
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
