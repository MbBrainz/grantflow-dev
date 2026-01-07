import { compare, hash } from 'bcryptjs'
import { type JWTPayload, jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import type { NewUser } from '@/lib/db/schema'

const key = new TextEncoder().encode(process.env.AUTH_SECRET)
const SALT_ROUNDS = 10

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS)
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword)
}

interface SessionData extends JWTPayload {
  user: { id: number }
  expires: string
}

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key)
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  })
  return payload as SessionData
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value
  if (!session) return null
  return await verifyToken(session)
}

export async function setSession(user: NewUser) {
  if (!user.id) {
    throw new Error('Cannot create session: user ID is required')
  }

  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const session: SessionData = {
    user: { id: user.id },
    expires: expiresInOneDay.toISOString(),
  }

  try {
    const encryptedSession = await signToken(session)
    const cookieStore = await cookies()

    cookieStore.set('session', encryptedSession, {
      expires: expiresInOneDay,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    // Verify the cookie was actually set
    const verificationCookie = cookieStore.get('session')
    if (!verificationCookie) {
      throw new Error('Session cookie was not set')
    }

    console.log('[Session]: Session created successfully for user:', user.id)
  } catch (error) {
    console.error('[Session]: Failed to create session:', error)
    throw new Error('Failed to create session')
  }
}
