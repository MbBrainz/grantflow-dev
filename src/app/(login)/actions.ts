'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { signOut as authSignOut, signIn } from '@/lib/auth'
import {
  validatedActionWithUser,
  validatedActionWithUserState,
} from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import {
  ActivityType,
  type UpdateAccountInput,
  updateAccountSchema,
  users,
} from '@/lib/db/schema'

// Helper function for activity logging (simplified without team context)
async function logActivity(userId: number, activityType: ActivityType) {
  await Promise.resolve()
  console.log(`[Activity]: User ${userId} performed ${activityType}`)
}

// ============================================================================
// Email OTP Authentication Actions
// ============================================================================

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, 'Email must be at least 3 characters')
    .max(255)
    .email('Invalid email address'),
})

const otpSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Code must be 6 digits'),
})

export interface EmailOTPState {
  error?: string
  success?: boolean
  message?: string
  email?: string
  step?: 'email' | 'code'
  redirect?: string
}

/**
 * Request an OTP code to be sent to the user's email
 */
export async function requestEmailOTP(
  prevState: EmailOTPState,
  formData: FormData
): Promise<EmailOTPState> {
  const data = Object.fromEntries(formData.entries())
  const result = emailSchema.safeParse(data)

  if (!result.success) {
    return {
      ...prevState,
      error: result.error?.issues[0]?.message ?? 'Invalid email',
      step: 'email',
    }
  }

  const { email } = result.data

  try {
    // Use Auth.js signIn with Resend provider
    // This sends the OTP email via the configured sendVerificationRequest
    await signIn('resend', {
      email,
      redirect: false,
      callbackUrl: '/dashboard',
    })

    return {
      email,
      step: 'code',
      success: true,
      message: 'Check your email for a 6-digit code',
    }
  } catch (error) {
    console.error('[requestEmailOTP]: Error', error)

    // Check if it's a redirect (which is expected behavior)
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      return {
        email,
        step: 'code',
        success: true,
        message: 'Check your email for a 6-digit code',
      }
    }

    return {
      ...prevState,
      error: 'Failed to send verification code. Please try again.',
      step: 'email',
    }
  }
}

/**
 * Verify the OTP code and sign in the user
 */
export async function verifyEmailOTP(
  prevState: EmailOTPState,
  formData: FormData
): Promise<EmailOTPState> {
  const data = Object.fromEntries(formData.entries())
  const result = otpSchema.safeParse(data)

  if (!result.success) {
    return {
      ...prevState,
      error: result.error?.issues[0]?.message ?? 'Invalid code',
      step: 'code',
    }
  }

  const { email, code } = result.data

  try {
    // Verify the OTP code with Auth.js
    // The callback URL after verification
    const callbackUrl = (formData.get('callbackUrl') as string) || '/dashboard'

    await signIn('resend', {
      email,
      token: code,
      redirect: false,
      callbackUrl,
    })

    // Log activity for existing users
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      await logActivity(existingUser[0].id, ActivityType.SIGN_IN)
    } else {
      // New user created via OTP
      const [newUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (newUser) {
        await logActivity(newUser.id, ActivityType.SIGN_UP)
      }
    }

    return {
      success: true,
      redirect: callbackUrl,
    }
  } catch (error) {
    console.error('[verifyEmailOTP]: Error', error)

    // Check if it's a redirect (which is expected behavior for successful auth)
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      return {
        success: true,
        redirect: '/dashboard',
      }
    }

    return {
      ...prevState,
      error: 'Invalid or expired code. Please try again.',
      step: 'code',
    }
  }
}

// ============================================================================
// GitHub OAuth Actions
// ============================================================================

/**
 * Initiate GitHub OAuth sign-in
 */
export async function signInWithGitHub(callbackUrl?: string) {
  await signIn('github', {
    redirectTo: callbackUrl ?? '/dashboard',
  })
}

// ============================================================================
// Sign Out Action
// ============================================================================

/**
 * Sign out the current user
 *
 * Uses Auth.js signOut with redirectTo to avoid throwing redirect errors
 * that would prevent SWR cache from being cleared on the client
 */
export async function handleSignOut() {
  const user = await getUser()
  if (user) {
    await logActivity(user.id, ActivityType.SIGN_OUT)
  }

  // Use Auth.js signOut - this handles the redirect properly
  await authSignOut({ redirectTo: '/' })
}

/**
 * Legacy signOut function for backwards compatibility
 * @deprecated Use handleSignOut instead
 */
export async function signOutAction() {
  await handleSignOut()
}

// ============================================================================
// Account Management Actions (Preserved from original)
// ============================================================================

import type { ActionState } from '@/lib/auth/middleware'

export interface AccountFormState extends ActionState {
  name?: string
}

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

// ============================================================================
// Wallet Linking Actions (Preserved from original)
// ============================================================================

const linkWalletSchema = z.object({
  walletAddress: z
    .string()
    .min(40, 'Invalid wallet address')
    .max(64, 'Invalid wallet address'),
})

export interface WalletLinkState extends ActionState {
  walletAddress?: string
}

/**
 * Link a wallet address to the current user's account
 */
export const linkWalletToAccount = validatedActionWithUser(
  linkWalletSchema,
  async (data, user) => {
    const { walletAddress } = data

    // Check if this wallet is already linked to another account
    const existingUser = await db.query.users.findFirst({
      where: eq(users.walletAddress, walletAddress),
    })

    if (existingUser && existingUser.id !== user.id) {
      return {
        error: 'This wallet address is already linked to another account.',
      }
    }

    // Link the wallet to the user's account
    await db
      .update(users)
      .set({
        walletAddress,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    await logActivity(user.id, ActivityType.UPDATE_ACCOUNT)

    return { success: true, message: 'Wallet linked successfully.' }
  }
)

/**
 * Unlink the wallet address from the current user's account
 */
export const unlinkWallet = validatedActionWithUser(
  z.object({}),
  async (_data, user) => {
    await db
      .update(users)
      .set({
        walletAddress: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    await logActivity(user.id, ActivityType.UPDATE_ACCOUNT)

    return { success: true, message: 'Wallet unlinked successfully.' }
  }
)

// ============================================================================
// Legacy exports for backwards compatibility
// ============================================================================

// These types are kept for any code that might still reference them
export interface SignInState extends ActionState {
  email?: string
  redirect?: string
}

export interface SignUpState extends ActionState {
  email?: string
  name?: string
  redirect?: string
}

/**
 * @deprecated Password-based sign-in removed. Use requestEmailOTP/verifyEmailOTP instead.
 */
export async function signInState(
  prevState: SignInState,
  _formData: FormData
): Promise<SignInState> {
  return {
    ...prevState,
    error:
      'Password-based sign-in has been removed. Please use email OTP or GitHub.',
  }
}

/**
 * @deprecated Password-based sign-up removed. Use requestEmailOTP/verifyEmailOTP instead.
 */
export async function signUpState(
  prevState: SignUpState,
  _formData: FormData
): Promise<SignUpState> {
  return {
    ...prevState,
    error:
      'Password-based sign-up has been removed. Please use email OTP or GitHub.',
  }
}

/**
 * @deprecated Use handleSignOut instead
 */
export async function signOut() {
  return handleSignOut()
}
