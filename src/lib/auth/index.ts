import type { DefaultSession } from 'next-auth'
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Passkey from 'next-auth/providers/passkey'
import Resend from 'next-auth/providers/resend'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'
import { CustomDrizzleAdapter } from './adapter'

/**
 * Auth.js v5 Configuration
 *
 * Unified authentication with:
 * - GitHub OAuth (existing users preserved)
 * - Email OTP (passwordless via Resend)
 * - Passkeys/WebAuthn (optional biometric login)
 * - Test account bypass for dev/preview environments
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: CustomDrizzleAdapter(),

  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? 'noreply@grantflow.dev',
      // Custom email template with magic link
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const { Resend: ResendClient } = await import('resend')
        const resend = new ResendClient(provider.apiKey)

        const fromEmail = provider.from ?? 'noreply@grantflow.dev'
        const { error } = await resend.emails.send({
          from: fromEmail,
          to: identifier,
          subject: 'Sign in to GrantFlow',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Sign in to GrantFlow</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #f97316; margin: 0;">GrantFlow</h1>
                </div>
                <h2 style="color: #1f2937; margin-bottom: 20px;">Sign in to your account</h2>
                <p style="color: #4b5563; margin-bottom: 20px;">
                  Click the button below to sign in to your GrantFlow account:
                </p>
                <div style="text-align: center; margin-bottom: 20px;">
                  <a href="${url}" style="display: inline-block; background: #f97316; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 500;">
                    Sign in to GrantFlow
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="color: #6b7280; font-size: 12px; word-break: break-all; margin-bottom: 20px;">
                  ${url}
                </p>
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
                  This link expires in 10 minutes. If you didn't request this, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  GrantFlow - Grant Management Platform
                </p>
              </body>
            </html>
          `,
        })

        if (error) {
          console.error('[Auth]: Failed to send magic link email:', error)
          throw new Error('Failed to send sign-in email')
        }
      },
    }),

    Passkey({
      // Enable WebAuthn passkey support
    }),
  ],

  // Enable WebAuthn experimental feature
  experimental: {
    enableWebAuthn: true,
  },

  session: {
    strategy: 'database', // Use database sessions instead of JWT
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  pages: {
    signIn: '/sign-in',
    verifyRequest: '/verify-email', // OTP verification page
    error: '/sign-in', // Redirect to sign-in on error
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle GitHub OAuth sign-in
      if (account?.provider === 'github' && profile) {
        // Cast through unknown for GitHub profile shape
        const githubProfile = profile as unknown as {
          id?: number
          login?: string
          name?: string
          email?: string
          avatar_url?: string
        }

        // Update user avatar from GitHub
        if (user.id && githubProfile.avatar_url) {
          try {
            const { eq } = await import('drizzle-orm')
            await db
              .update(users)
              .set({
                avatarUrl: githubProfile.avatar_url,
                // Store githubId for backwards compatibility
                githubId: githubProfile.id ? String(githubProfile.id) : null,
                updatedAt: new Date(),
              })
              .where(eq(users.id, parseInt(user.id)))
          } catch (error) {
            console.error('[Auth]: Failed to update GitHub user:', error)
          }
        }
      }

      return true
    },

    async session({ session, user }) {
      // Add user ID and role to session
      if (session.user && user) {
        session.user.id = user.id

        // Fetch user role from database
        try {
          const { eq } = await import('drizzle-orm')
          const [dbUser] = await db
            .select({ primaryRole: users.primaryRole })
            .from(users)
            .where(eq(users.id, parseInt(user.id)))
            .limit(1)

          if (dbUser) {
            session.user.role = dbUser.primaryRole
          }
        } catch (error) {
          console.error('[Auth]: Failed to fetch user role:', error)
        }
      }

      return session
    },
  },

  // Trust the proxy headers in production
  trustHost: true,
})

/**
 * Type augmentation for Auth.js session
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role?: string
    } & DefaultSession['user']
  }

  interface User {
    role?: string
  }
}

// Re-export auth functions for convenience
export { auth as getSession }
