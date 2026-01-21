import { relations } from 'drizzle-orm'
import {
  bigint,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { createSchemaFactory } from 'drizzle-zod'
import { discussions } from './discussions'
import { payouts } from './payouts'
import { reviews } from './reviews'
import { submissions } from './submissions'

const { createInsertSchema, createSelectSchema } = createSchemaFactory({
  coerce: {
    number: true, // Handle form inputs
    date: true,
    boolean: true,
  },
})

const MILESTONE_STATUS_OPTIONS = [
  'pending',
  'in-review',
  'changes-requested',
  'completed',
  'rejected',
] as const

export const milestoneStatusEnum = pgEnum(
  'milestone_status',
  MILESTONE_STATUS_OPTIONS
)
export type MilestoneStatus = (typeof MILESTONE_STATUS_OPTIONS)[number]

interface Deliverable {
  description: string
  commits?: { sha: string; shortSha: string; url: string }[]
  submittedAt?: string
  submittedBy?: number
}

export const milestones = pgTable('milestones', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id')
    .notNull()
    .references(() => submissions.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  requirements: jsonb('requirements').$type<string[]>().notNull().default([]), // What needs to be delivered
  amount: bigint('amount', { mode: 'number' }),
  dueDate: timestamp('due_date'),
  status: milestoneStatusEnum('status').notNull().default('pending'),
  deliverables: jsonb('deliverables')
    .$type<Deliverable[]>()
    .notNull()
    .default([]), // JSON array of deliverable items
  githubRepoUrl: varchar('github_repo_url', { length: 255 }),
  githubPrUrl: varchar('github_pr_url', { length: 255 }),
  githubCommitHash: varchar('github_commit_hash', { length: 64 }),
  codeAnalysis: text('code_analysis'), // AI analysis of code changes
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  rejectionCount: integer('rejection_count').default(0), // Track number of rejections (for analytics)
  lastRejectedAt: timestamp('last_rejected_at'), // Track when last rejected (for analytics)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  submission: one(submissions, {
    fields: [milestones.submissionId],
    references: [submissions.id],
  }),
  discussions: many(discussions),
  reviews: many(reviews),
  payouts: many(payouts),
}))

export const insertMilestoneSchema = createInsertSchema(milestones)
export const selectMilestoneSchema = createSelectSchema(milestones)

export type Milestone = typeof milestones.$inferSelect
export type NewMilestone = typeof milestones.$inferInsert
