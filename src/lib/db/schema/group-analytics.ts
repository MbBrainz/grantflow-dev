import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  bigint,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { groups } from './groups'

export const groupAnalytics = pgTable('group_analytics', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id),
  period: varchar('period', { length: 20 }).notNull(), // 'monthly' | 'quarterly' | 'yearly'
  totalSubmissions: integer('total_submissions').notNull().default(0),
  approvedSubmissions: integer('approved_submissions').notNull().default(0),
  totalFunding: bigint('total_funding', { mode: 'number' })
    .notNull()
    .default(0),
  averageApprovalTime: integer('average_approval_time'), // in hours
  memberActivity: text('member_activity'), // JSON member activity data
  publicRating: integer('public_rating').default(0), // 1-5 rating
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const groupAnalyticsRelations = relations(groupAnalytics, ({ one }) => ({
  group: one(groups, {
    fields: [groupAnalytics.groupId],
    references: [groups.id],
  }),
}))

export const insertGroupAnalyticsSchema = createInsertSchema(groupAnalytics)
export const selectGroupAnalyticsSchema = createSelectSchema(groupAnalytics)

export type GroupAnalytics = typeof groupAnalytics.$inferSelect
export type NewGroupAnalytics = typeof groupAnalytics.$inferInsert
