import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { setSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    console.error('[GitHub OAuth]: No authorization code received')
    return NextResponse.redirect(
      new URL('/sign-in?error=oauth_failed', request.url)
    )
  }

  try {
    console.log('[GitHub OAuth]: Processing authorization code')

    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    )

    if (!tokenResponse.ok) {
      console.error('[GitHub OAuth]: Failed to exchange code for token')
      return NextResponse.redirect(
        new URL('/sign-in?error=oauth_failed', request.url)
      )
    }

    const tokenData = (await tokenResponse.json()) as {
      error?: string
      access_token?: string
    }

    if (tokenData.error) {
      console.error('[GitHub OAuth]: Token exchange error:', tokenData)
      return NextResponse.redirect(
        new URL('/sign-in?error=oauth_failed', request.url)
      )
    }

    const accessToken = tokenData.access_token

    // Get GitHub user information
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/json',
      },
    })

    if (!userResponse.ok) {
      console.error('[GitHub OAuth]: Failed to fetch user information')
      return NextResponse.redirect(
        new URL('/sign-in?error=oauth_failed', request.url)
      )
    }

    const githubUser = (await userResponse.json()) as {
      id: number
      login: string
      name: string
      email: string
    }
    console.log('[GitHub OAuth]: Retrieved GitHub user:', githubUser.login)

    // Get user's primary email
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/json',
      },
    })

    let email = githubUser.email
    if (!email && emailResponse.ok) {
      const emails = (await emailResponse.json()) as {
        email: string
        primary: boolean
      }[]
      const primaryEmail = emails.find(e => e.primary)
      email = primaryEmail?.email ?? emails[0]?.email
    }

    if (!email) {
      console.error('[GitHub OAuth]: No email found for GitHub user')
      return NextResponse.redirect(
        new URL('/sign-in?error=no_email', request.url)
      )
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.githubId, String(githubUser.id)))
      .limit(1)

    let user

    if (existingUser.length > 0) {
      // User exists, update their information
      user = existingUser[0]
      console.log('[GitHub OAuth]: Existing user found, updating info')

      await db
        .update(users)
        .set({
          name: githubUser.name || githubUser.login,
          email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      // Update user object with new info for session
      user = {
        ...user,
        name: githubUser.name || githubUser.login,
        email,
      }
    } else {
      // Check if there's an existing user with this email
      const userByEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (userByEmail.length > 0) {
        // Link GitHub account to existing email-based account
        user = userByEmail[0]
        console.log('[GitHub OAuth]: Linking GitHub to existing email account')

        await db
          .update(users)
          .set({
            githubId: String(githubUser.id),
            name: githubUser.name || githubUser.login || user.name,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))

        // Update user object with GitHub info
        user = {
          ...user,
          githubId: String(githubUser.id),
          name: githubUser.name || githubUser.login || user.name,
        }
      } else {
        // Create new user
        console.log('[GitHub OAuth]: Creating new user')

        const [newUser] = await db
          .insert(users)
          .values({
            name: githubUser.name || githubUser.login,
            email,
            githubId: String(githubUser.id),
            primaryRole: 'team', // Default role for new GitHub users
            passwordHash: null, // GitHub OAuth users don't have passwords
          })
          .returning()

        if (!newUser) {
          console.error('[GitHub OAuth]: Failed to create new user')
          return NextResponse.redirect(
            new URL('/sign-in?error=creation_failed', request.url)
          )
        }

        user = newUser
        console.log('[GitHub OAuth]: New user created successfully')
      }
    }

    // Set session
    await setSession(user)
    console.log('[GitHub OAuth]: Session set for user:', user.id)

    // Determine redirect URL
    let redirectUrl = '/dashboard'
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state)) as {
          redirect?: string
        }
        if (stateData.redirect) {
          redirectUrl = stateData.redirect
        }
      } catch (e) {
        console.warn('[GitHub OAuth]: Failed to parse state parameter:', e)
      }
    }

    console.log(
      '[GitHub OAuth]: Authentication successful, redirecting to:',
      redirectUrl
    )
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  } catch (error) {
    console.error('[GitHub OAuth]: Authentication error:', error)
    return NextResponse.redirect(
      new URL('/sign-in?error=oauth_failed', request.url)
    )
  }
}
