'use server';

import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { 
  validatedAction, 
  validatedActionWithUser 
} from '@/lib/auth/middleware';
import { 
  users,
  ActivityType
} from '@/lib/db/schema';
import { 
  comparePasswords, 
  hashPassword, 
  setSession
} from '@/lib/auth/session';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';

// Helper function for activity logging (simplified without team context)
async function logActivity(userId: number, activityType: ActivityType) {
  // For now, just log to console since we removed activityLogs table
  console.log(`[Activity]: User ${userId} performed ${activityType}`);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  const foundUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (foundUser.length === 0) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password
    };
  }

  const user = foundUser[0];

  // Check if user has a password hash (GitHub OAuth users might not have one)
  if (!user.passwordHash) {
    return {
      error: 'Please sign in with GitHub for this account.',
      email,
      password
    };
  }

  const isPasswordValid = await comparePasswords(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password
    };
  }

  await Promise.all([
    setSession(user),
    logActivity(user.id, ActivityType.SIGN_IN)
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    // Redirect to pricing page instead (no Stripe integration)
    redirect('/pricing');
  }

  redirect('/dashboard');
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1, 'Name is required').max(100)
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, name } = data;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return { error: 'Failed to create user. Please try again.' };
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
      primaryRole: 'team' // Default role for new users
    })
    .returning();

  if (!newUser) {
    return { error: 'Failed to create user. Please try again.' };
  }

  await Promise.all([
    setSession(newUser),
    logActivity(newUser.id, ActivityType.SIGN_UP)
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    // Redirect to pricing page instead (no Stripe integration)
    redirect('/pricing');
  }

  redirect('/dashboard');
});

export async function signOut() {
  const user = await getUser();
  if (user) {
    await logActivity(user.id, ActivityType.SIGN_OUT);
  }
  (await cookies()).delete('session');
  redirect('/sign-in');
}

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8).max(100),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, formData, user) => {
    const { currentPassword, newPassword } = data;

    if (!user.passwordHash) {
      return {
        error: 'Cannot update password for GitHub OAuth users.',
      };
    }

    const isCurrentPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return {
        error: 'Current password is incorrect.',
      };
    }

    if (currentPassword === newPassword) {
      return {
        error: 'New password must be different from the current password.',
      };
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await logActivity(user.id, ActivityType.UPDATE_PASSWORD);

    return { success: 'Password updated successfully.' };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, formData, user) => {
    const { password } = data;

    if (!user.passwordHash) {
      return {
        error: 'Cannot delete GitHub OAuth accounts through this method.',
      };
    }

    const isPasswordValid = await comparePasswords(password, user.passwordHash);

    if (!isPasswordValid) {
      return {
        error: 'Incorrect password.',
      };
    }

    // Soft delete the user account
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        email: `deleted_${user.id}_${user.email}`, // Prevent email conflicts
      })
      .where(eq(users.id, user.id));

    await logActivity(user.id, ActivityType.DELETE_ACCOUNT);
    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().min(3).max(255),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, formData, user) => {
    const { name, email } = data;

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await db
        .select()
        .from(users)
        .where(and(
          eq(users.email, email),
          // Make sure it's not the current user - comparing emails is sufficient
        ))
        .limit(1);

      if (existingUser.length > 0) {
        return { error: 'Email is already in use.' };
      }
    }

    await db
      .update(users)
      .set({
        name,
        email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await logActivity(user.id, ActivityType.UPDATE_ACCOUNT);

    return { success: 'Account updated successfully.' };
  }
);
