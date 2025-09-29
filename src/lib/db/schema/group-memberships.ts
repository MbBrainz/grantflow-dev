import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { groups } from './groups'
import { users } from './users'

// Unified memberships for all groups (committees and teams)
export const groupMemberships = pgTable('group_memberships', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  role: varchar('role', { length: 20 }).notNull().default('member'), // 'admin' | 'member'
  permissions: text('permissions'), // JSON array of permissions
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
})

export const groupMembershipsRelations = relations(
  groupMemberships,
  ({ one }) => ({
    group: one(groups, {
      fields: [groupMemberships.groupId],
      references: [groups.id],
    }),
    user: one(users, {
      fields: [groupMemberships.userId],
      references: [users.id],
    }),
  })
)

export const insertGroupMembershipSchema = createInsertSchema(groupMemberships)
export const selectGroupMembershipSchema = createSelectSchema(groupMemberships)

export type GroupMembership = typeof groupMemberships.$inferSelect
export type NewGroupMembership = typeof groupMemberships.$inferInsert
