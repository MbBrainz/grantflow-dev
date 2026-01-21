import { relations } from 'drizzle-orm'
import {
  bigint,
  boolean,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { discussions } from './discussions'
import { groupAnalytics } from './group-analytics'
import { groupMemberships } from './group-memberships'
import type { FocusAreas, GroupSettings } from './jsonTypes/GroupSettings'
import { payouts } from './payouts'
import { submissions } from './submissions'
import { users } from './users'

// Unified groups table for both committees and teams
// For committees: This table now includes grant program fields (budget, templates)
// Each committee IS a grant program linked to an on-chain bounty
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
  settings: jsonb('settings').$type<GroupSettings>(), // JSON configuration (voting thresholds, approval workflows, multisig, etc.)

  // Budget configuration (for committees acting as grant programs)
  fundingAmount: bigint('funding_amount', { mode: 'number' }), // Total program budget
  minGrantSize: bigint('min_grant_size', { mode: 'number' }), // Minimum total grant per submission
  maxGrantSize: bigint('max_grant_size', { mode: 'number' }), // Maximum total grant per submission
  minMilestoneSize: bigint('min_milestone_size', { mode: 'number' }), // Minimum payout per milestone
  maxMilestoneSize: bigint('max_milestone_size', { mode: 'number' }), // Maximum payout per milestone

  // Template configuration (for committees)
  requirements: text('requirements'), // JSON structured requirements
  applicationTemplate: text('application_template'), // JSON form template
  milestoneStructure: text('milestone_structure'), // JSON milestone template

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(groupMemberships),
  submittedSubmissions: many(submissions, { relationName: 'submitterGroup' }),
  reviewingSubmissions: many(submissions, { relationName: 'reviewerGroup' }),
  discussions: many(discussions),
  payouts: many(payouts),
  analytics: many(groupAnalytics),
  primaryUsers: many(users),
}))

export const insertGroupSchema = createInsertSchema(groups)
export const selectGroupSchema = createSelectSchema(groups)

export type Committee = typeof groups.$inferSelect
export type Group = typeof groups.$inferSelect
export type NewGroup = typeof groups.$inferInsert
