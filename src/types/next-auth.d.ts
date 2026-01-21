import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  /**
   * Extended Session interface for Auth.js v5
   * Adds user.id and user.role to the session
   */
  interface Session {
    user: {
      id: string
      role?: string
    } & DefaultSession['user']
  }

  /**
   * Extended User interface
   * Maps to our database users table
   */
  interface User {
    id: string
    role?: string
    primaryRole?: string
  }
}

declare module '@auth/core/adapters' {
  /**
   * Adapter User interface extension
   * Ensures adapter returns role field
   */
  interface AdapterUser {
    role?: string
    primaryRole?: string
  }
}
