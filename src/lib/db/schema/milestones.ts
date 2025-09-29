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
import { submissions } from './submissions'
import { groups } from './groups'
import { discussions } from './discussions'
import { reviews } from './reviews'
import { payouts } from './payouts'

export const milestones = pgTable('milestones', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id')
    .notNull()
    .references(() => submissions.id),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  requirements: text('requirements'), // What needs to be delivered
  amount: bigint('amount', { mode: 'number' }),
  dueDate: timestamp('due_date'),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  deliverables: text('deliverables'), // JSON array of deliverable items
  githubRepoUrl: varchar('github_repo_url', { length: 255 }),
  githubPrUrl: varchar('github_pr_url', { length: 255 }),
  githubCommitHash: varchar('github_commit_hash', { length: 64 }),
  codeAnalysis: text('code_analysis'), // AI analysis of code changes
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  submission: one(submissions, {
    fields: [milestones.submissionId],
    references: [submissions.id],
  }),
  group: one(groups, {
    fields: [milestones.groupId],
    references: [groups.id],
    relationName: 'milestoneGroup',
  }),
  discussions: many(discussions),
  reviews: many(reviews),
  payouts: many(payouts),
}))

export const insertMilestoneSchema = createInsertSchema(milestones)
export const selectMilestoneSchema = createSelectSchema(milestones)

export type Milestone = typeof milestones.$inferSelect
export type NewMilestone = typeof milestones.$inferInsert
