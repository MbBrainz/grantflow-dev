import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { users } from './users'

/**
 * Accounts table - Links OAuth provider accounts to users
 * Required by Auth.js Drizzle adapter for OAuth providers (GitHub, Google, etc.)
 */
export const accounts = pgTable(
  'accounts',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 })
      .notNull()
      .$type<'email' | 'oauth' | 'oidc' | 'webauthn'>(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', {
      length: 255,
    }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
  },
  table => [primaryKey({ columns: [table.provider, table.providerAccountId] })]
)

/**
 * Sessions table - Stores database sessions
 * Required by Auth.js when using database sessions (not JWT)
 */
export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

/**
 * Verification Tokens table - Used for Email OTP codes
 * Stores 6-digit codes with 10 minute expiry
 */
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(), // email address
    token: varchar('token', { length: 255 }).notNull(), // 6-digit OTP code
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  table => [primaryKey({ columns: [table.identifier, table.token] })]
)

/**
 * Authenticators table - Stores WebAuthn credentials (passkeys)
 * Required by Auth.js for passkey/biometric authentication
 */
export const authenticators = pgTable(
  'authenticators',
  {
    credentialID: varchar('credential_id', { length: 255 }).notNull().unique(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerAccountId: varchar('provider_account_id', {
      length: 255,
    }).notNull(),
    credentialPublicKey: text('credential_public_key').notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: varchar('credential_device_type', {
      length: 32,
    }).notNull(),
    credentialBackedUp: boolean('credential_backed_up').notNull(),
    transports: varchar('transports', { length: 255 }),
  },
  table => [primaryKey({ columns: [table.userId, table.credentialID] })]
)

// Type exports
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type VerificationToken = typeof verificationTokens.$inferSelect
export type NewVerificationToken = typeof verificationTokens.$inferInsert
export type Authenticator = typeof authenticators.$inferSelect
export type NewAuthenticator = typeof authenticators.$inferInsert
