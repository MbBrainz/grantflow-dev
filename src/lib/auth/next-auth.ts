import { getServerSession, type NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24, // 24 hours
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github' && profile) {
        try {
          // Check if user exists by GitHub ID
          const githubProfile = profile as {
            id: number
            login: string
            name: string
            email: string
            avatar_url: string
          }

          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.githubId, String(githubProfile.id)))
            .limit(1)

          if (existingUser.length > 0) {
            // Update existing user
            await db
              .update(users)
              .set({
                name: user.name ?? githubProfile.login,
                email: user.email ?? githubProfile.email ?? '',
                avatarUrl: user.image ?? githubProfile.avatar_url,
                updatedAt: new Date(),
              })
              .where(eq(users.id, existingUser[0].id))

            // Store user ID in token for later use
            user.id = String(existingUser[0].id)
          } else {
            // Check if user exists by email
            const userByEmail = user.email
              ? await db
                  .select()
                  .from(users)
                  .where(eq(users.email, user.email))
                  .limit(1)
              : []

            if (userByEmail.length > 0) {
              // Link GitHub to existing account
              await db
                .update(users)
                .set({
                  githubId: String(githubProfile.id),
                  name: user.name ?? userByEmail[0].name,
                  avatarUrl: user.image ?? githubProfile.avatar_url,
                  updatedAt: new Date(),
                })
                .where(eq(users.id, userByEmail[0].id))

              user.id = String(userByEmail[0].id)
            } else {
              // Create new user
              const [newUser] = await db
                .insert(users)
                .values({
                  name: user.name ?? githubProfile.login,
                  email: user.email ?? githubProfile.email ?? '',
                  githubId: String(githubProfile.id),
                  avatarUrl: user.image ?? githubProfile.avatar_url,
                  primaryRole: 'team',
                  passwordHash: null,
                })
                .returning()

              if (newUser) {
                user.id = String(newUser.id)
              } else {
                return false
              }
            }
          }

          return true
        } catch (error) {
          console.error('[NextAuth]: Error in signIn callback', error)
          return false
        }
      }

      return true
    },
    jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          userId: user.id,
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Add user ID to session
        session.user.id = token.userId!

        // Fetch fresh user data from database
        try {
          const userId = parseInt(token.userId!)
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

          if (dbUser) {
            session.user.name = dbUser.name
            session.user.email = dbUser.email
            session.user.image = dbUser.avatarUrl
            session.user.role = dbUser.primaryRole
          }
        } catch (error) {
          console.error('[NextAuth]: Error fetching user data', error)
        }
      }

      return session
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
}

/**
 * Get the current session using NextAuth
 * Use this in Server Components and Server Actions
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * Get the current user from the session
 * Returns the full user object from the database
 */
export async function getUser() {
  const session = await getSession()

  if (!session?.user?.id) {
    return null
  }

  try {
    const userId = parseInt(session.user.id)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return user || null
  } catch (error) {
    console.error('[Auth]: Error fetching user', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession()
  return !!session?.user
}

/**
 * Require authentication - redirect if not authenticated
 * Use in Server Components/Actions that require auth
 */
export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}
