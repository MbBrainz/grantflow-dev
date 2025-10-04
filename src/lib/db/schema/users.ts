import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { groups } from './groups'
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
  primaryGroupId: integer('primary_group_id'), // Will reference groups.id
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
