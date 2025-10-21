import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createSchemaFactory } from 'drizzle-zod'
import { z } from 'zod'
import { groups } from './groups'

const { createInsertSchema, createSelectSchema } = createSchemaFactory({
  coerce: {
    number: true, // Handle form inputs
    date: true,
    boolean: true,
  },
})
import { groupMemberships } from './group-memberships'
import { submissions } from './submissions'
import { messages } from './messages'
import { reviews } from './reviews'
import { notifications } from './notifications'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: text('password_hash'),
  githubId: varchar('github_id', { length: 64 }),
  avatarUrl: text('avatar_url'),
  walletAddress: varchar('wallet_address', { length: 64 }),
  primaryGroupId: integer('primary_group_id').references(() => groups.id), // Will reference groups.id
  primaryRole: varchar('primary_role', { length: 20 })
    .notNull()
    .default('team'), // 'committee' | 'team'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const usersRelations = relations(users, ({ one, many }) => ({
  primaryGroup: one(groups, {
    fields: [users.primaryGroupId],
    references: [groups.id],
  }),
  groupMemberships: many(groupMemberships),
  submissions: many(submissions),
  discussionMessages: many(messages),
  reviews: many(reviews),
  notifications: many(notifications),
}))

export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// ============================================================================
// Auth-specific validation schemas
// ============================================================================

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, 'Email must be at least 3 characters')
    .max(255)
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  redirect: z.string().optional(),
})

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
})

export const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(100),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100),
})

export const updateAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .trim()
    .min(3, 'Email must be at least 3 characters')
    .max(255)
    .email('Invalid email address'),
})

// Type exports for auth schemas
export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
