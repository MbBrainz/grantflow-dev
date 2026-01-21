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
// Email Magic Link Authentication Actions
// ============================================================================

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, 'Email must be at least 3 characters')
    .max(255)
    .email('Invalid email address'),
})

/**
 * State for magic link email flow
 */
export interface EmailLinkState {
  error?: string
  success?: boolean
  message?: string
  email?: string
}

/**
 * Request a magic link to be sent to the user's email
 *
 * Uses Auth.js Resend provider which sends a clickable magic link.
 * When clicked, the user is automatically signed in.
 */
export async function requestEmailLink(
  prevState: EmailLinkState,
  formData: FormData
): Promise<EmailLinkState> {
  const data = Object.fromEntries(formData.entries())
  const result = emailSchema.safeParse(data)

  if (!result.success) {
    return {
      ...prevState,
      error: result.error?.issues[0]?.message ?? 'Invalid email',
    }
  }

  const { email } = result.data
  const callbackUrl = (formData.get('callbackUrl') as string) || '/dashboard'

  try {
    // Use Auth.js signIn with Resend provider
    // This sends the magic link email via the configured sendVerificationRequest
    await signIn('resend', {
      email: email.toLowerCase(),
      redirect: false,
      redirectTo: callbackUrl,
    })

    return {
      email,
      success: true,
      message: 'Check your email for a sign-in link',
    }
  } catch (error) {
    console.error('[requestEmailLink]: Error', error)

    // Check if it's a redirect (which can happen with some configurations)
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      return {
        email,
        success: true,
        message: 'Check your email for a sign-in link',
      }
    }

    return {
      ...prevState,
      error: 'Failed to send sign-in link. Please try again.',
    }
  }
}

// ============================================================================
// Legacy OTP Types (kept for backwards compatibility)
// ============================================================================

export interface EmailOTPState {
  error?: string
  success?: boolean
  message?: string
  email?: string
  step?: 'email' | 'code'
  redirect?: string
}

/**
 * @deprecated Use requestEmailLink instead. OTP code entry has been replaced with magic links.
 */
export async function requestEmailOTP(
  prevState: EmailOTPState,
  _formData: FormData
): Promise<EmailOTPState> {
  return {
    ...prevState,
    error:
      'OTP verification has been replaced with magic links. Please use the sign-in link sent to your email.',
  }
}

/**
 * @deprecated Use magic links instead. OTP code entry has been replaced with magic links.
 */
export async function verifyEmailOTP(
  prevState: EmailOTPState,
  _formData: FormData
): Promise<EmailOTPState> {
  return {
    ...prevState,
    error:
      'OTP verification has been replaced with magic links. Please use the sign-in link sent to your email.',
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
