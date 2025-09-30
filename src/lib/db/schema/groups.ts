import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { grantPrograms } from './grant-programs'
import { groupMemberships } from './group-memberships'
import { submissions } from './submissions'
import { discussions } from './discussions'
import { milestones } from './milestones'
import { reviews } from './reviews'
import { payouts } from './payouts'
import { groupAnalytics } from './group-analytics'
import { users } from './users'
import type { FocusAreas, GroupSettings } from './jsonTypes/GroupSettings'

// Unified groups table for both committees and teams
export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 255 }),
  type: varchar('type', { length: 20 }).notNull(), // 'committee' | 'team'
  focusAreas: jsonb('focus_areas').$type<FocusAreas>(), // JSON array of focus areas
  websiteUrl: varchar('website_url', { length: 255 }),
  githubOrg: varchar('github_org', { length: 100 }),
  walletAddress: varchar('wallet_address', { length: 64 }),
  isActive: boolean('is_active').notNull().default(true),
  settings: jsonb('settings').$type<GroupSettings>(), // JSON configuration (voting thresholds, approval workflows, etc.)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const groupsRelations = relations(groups, ({ many }) => ({
  grantPrograms: many(grantPrograms),
  members: many(groupMemberships),
  submittedSubmissions: many(submissions, { relationName: 'submitterGroup' }),
  reviewingSubmissions: many(submissions, { relationName: 'reviewerGroup' }),
  discussions: many(discussions),
  milestones: many(milestones, { relationName: 'milestoneGroup' }),
  reviews: many(reviews),
  payouts: many(payouts),
  analytics: many(groupAnalytics),
  primaryUsers: many(users),
}))

export const insertGroupSchema = createInsertSchema(groups)
export const selectGroupSchema = createSelectSchema(groups)

export type Committee = typeof groups.$inferSelect
export type Group = typeof groups.$inferSelect
export type NewGroup = typeof groups.$inferInsert
