/**
 * Custom Auth.js Adapter for GrantFlow
 *
 * This adapter bridges Auth.js v5 (which expects string UUIDs) with our
 * PostgreSQL schema (which uses integer serial primary keys).
 *
 * Key differences from standard DrizzleAdapter:
 * - User IDs are integers, converted to strings for Auth.js
 * - Uses `avatarUrl` instead of `image` column
 * - Handles type conversions transparently
 */

import { and, eq } from 'drizzle-orm'
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from 'next-auth/adapters'
import { db } from '@/lib/db/drizzle'
import {
  accounts,
  authenticators,
  sessions,
  users,
  verificationTokens,
} from '@/lib/db/schema'

/**
 * Convert database user to Auth.js user format
 */
function toAdapterUser(dbUser: typeof users.$inferSelect): AdapterUser {
  return {
    id: String(dbUser.id),
    email: dbUser.email ?? '',
    emailVerified: dbUser.emailVerified,
    name: dbUser.name,
    image: dbUser.avatarUrl, // Map avatarUrl to image
  }
}

/**
 * Custom adapter for Auth.js v5 with integer user IDs
 */
export function CustomDrizzleAdapter(): Adapter {
  return {
    async createUser(data) {
      const [user] = await db
        .insert(users)
        .values({
          email: data.email,
          name: data.name,
          avatarUrl: data.image,
          emailVerified: data.emailVerified,
        })
        .returning()

      return toAdapterUser(user)
    },

    async getUser(id) {
      const userId = parseInt(id, 10)
      if (isNaN(userId)) return null

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      return user ? toAdapterUser(user) : null
    },

    async getUserByEmail(email) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      return user ? toAdapterUser(user) : null
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const [result] = await db
        .select({ user: users })
        .from(accounts)
        .innerJoin(users, eq(accounts.userId, users.id))
        .where(
          and(
            eq(accounts.provider, provider),
            eq(accounts.providerAccountId, providerAccountId)
          )
        )
        .limit(1)

      return result ? toAdapterUser(result.user) : null
    },

    async updateUser(data) {
      const userId = parseInt(data.id, 10)
      if (isNaN(userId)) throw new Error('Invalid user ID')

      const [user] = await db
        .update(users)
        .set({
          name: data.name,
          email: data.email,
          avatarUrl: data.image,
          emailVerified: data.emailVerified,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning()

      return toAdapterUser(user)
    },

    async deleteUser(id) {
      const userId = parseInt(id, 10)
      if (isNaN(userId)) return

      await db.delete(users).where(eq(users.id, userId))
    },

    async linkAccount(data) {
      const userId = parseInt(data.userId, 10)
      if (isNaN(userId)) throw new Error('Invalid user ID')

      await db.insert(accounts).values({
        userId,
        type: data.type as 'oauth' | 'oidc' | 'email' | 'webauthn',
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        access_token: data.access_token ?? null,
        refresh_token: data.refresh_token ?? null,
        expires_at: data.expires_at ?? null,
        token_type: data.token_type ?? null,
        scope: data.scope ?? null,
        id_token: data.id_token ?? null,
        session_state:
          typeof data.session_state === 'string' ? data.session_state : null,
      })

      return data as AdapterAccount
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await db
        .delete(accounts)
        .where(
          and(
            eq(accounts.provider, provider),
            eq(accounts.providerAccountId, providerAccountId)
          )
        )
    },

    async createSession(data) {
      const userId = parseInt(data.userId, 10)
      if (isNaN(userId)) throw new Error('Invalid user ID')

      const [session] = await db
        .insert(sessions)
        .values({
          userId,
          sessionToken: data.sessionToken,
          expires: data.expires,
        })
        .returning()

      return {
        sessionToken: session.sessionToken,
        userId: String(session.userId),
        expires: session.expires,
      }
    },

    async getSessionAndUser(sessionToken) {
      const [result] = await db
        .select({ session: sessions, user: users })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.sessionToken, sessionToken))
        .limit(1)

      if (!result) return null

      return {
        session: {
          sessionToken: result.session.sessionToken,
          userId: String(result.session.userId),
          expires: result.session.expires,
        },
        user: toAdapterUser(result.user),
      }
    },

    async updateSession(data) {
      const [session] = await db
        .update(sessions)
        .set({
          expires: data.expires,
        })
        .where(eq(sessions.sessionToken, data.sessionToken))
        .returning()

      if (!session) return null

      return {
        sessionToken: session.sessionToken,
        userId: String(session.userId),
        expires: session.expires,
      }
    },

    async deleteSession(sessionToken) {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken))
    },

    async createVerificationToken(data) {
      const [token] = await db
        .insert(verificationTokens)
        .values({
          identifier: data.identifier,
          token: data.token,
          expires: data.expires,
        })
        .returning()

      return token
    },

    async useVerificationToken({ identifier, token }) {
      const [verificationToken] = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token)
          )
        )
        .limit(1)

      if (!verificationToken) return null

      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token)
          )
        )

      return verificationToken
    },

    // WebAuthn/Passkey methods
    async createAuthenticator(data) {
      const userId = parseInt(data.userId, 10)
      if (isNaN(userId)) throw new Error('Invalid user ID')

      const [authenticator] = await db
        .insert(authenticators)
        .values({
          userId,
          credentialID: data.credentialID,
          // Use credentialID as providerAccountId for WebAuthn
          providerAccountId: data.credentialID,
          credentialPublicKey: data.credentialPublicKey,
          counter: data.counter,
          credentialDeviceType: data.credentialDeviceType,
          credentialBackedUp: data.credentialBackedUp,
          transports: data.transports ?? null,
        })
        .returning()

      return {
        ...authenticator,
        userId: String(authenticator.userId),
        transports: authenticator.transports ?? undefined,
      }
    },

    async getAuthenticator(credentialID) {
      const [authenticator] = await db
        .select()
        .from(authenticators)
        .where(eq(authenticators.credentialID, credentialID))
        .limit(1)

      if (!authenticator) return null

      return {
        ...authenticator,
        userId: String(authenticator.userId),
        transports: authenticator.transports ?? undefined,
      }
    },

    async listAuthenticatorsByUserId(userId) {
      const userIdInt = parseInt(userId, 10)
      if (isNaN(userIdInt)) return []

      const results = await db
        .select()
        .from(authenticators)
        .where(eq(authenticators.userId, userIdInt))

      return results.map(a => ({
        ...a,
        userId: String(a.userId),
        transports: a.transports ?? undefined,
      }))
    },

    async updateAuthenticatorCounter(credentialID, newCounter) {
      const [authenticator] = await db
        .update(authenticators)
        .set({ counter: newCounter })
        .where(eq(authenticators.credentialID, credentialID))
        .returning()

      if (!authenticator) throw new Error('Authenticator not found')

      return {
        ...authenticator,
        userId: String(authenticator.userId),
        transports: authenticator.transports ?? undefined,
      }
    },

    async getAccount(providerAccountId, provider) {
      const [account] = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.provider, provider),
            eq(accounts.providerAccountId, providerAccountId)
          )
        )
        .limit(1)

      if (!account) return null

      return {
        ...account,
        userId: String(account.userId),
      } as AdapterAccount
    },
  }
}
