import { relations } from 'drizzle-orm'
import {
  bigint,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { discussions } from './discussions'
import { groups } from './groups'
import { milestones } from './milestones'
import { notifications } from './notifications'
import { payouts } from './payouts'
import { reviews } from './reviews'
import { users } from './users'

const SUBMISSION_STATUS_OPTIONS = [
  'pending',
  'in-review',
  'changes-requested',
  'approved',
  'rejected',
] as const

export const submissionStatusEnum = pgEnum(
  'submission_status',
  SUBMISSION_STATUS_OPTIONS
)
export type SubmissionStatus = (typeof SUBMISSION_STATUS_OPTIONS)[number]

// Submissions are submitted to committees (reviewerGroupId)
// The committee IS the grant program (no separate grant_programs table)
export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  submitterGroupId: integer('submitter_group_id')
    .notNull()
    .references(() => groups.id), // team that submitted
  reviewerGroupId: integer('reviewer_group_id')
    .notNull()
    .references(() => groups.id), // committee (grant program) reviewing
  submitterId: integer('submitter_id')
    .notNull()
    .references(() => users.id), // individual who submitted
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  executiveSummary: text('executive_summary'),
  postGrantPlan: text('post_grant_plan'),
  labels: text('labels'), // JSON array of project labels
  githubRepoUrl: varchar('github_repo_url', { length: 255 }),
  walletAddress: varchar('wallet_address', { length: 64 }), // Grantee wallet
  status: submissionStatusEnum('status').notNull().default('pending'),
  totalAmount: bigint('total_amount', { mode: 'number' }),
  appliedAt: timestamp('applied_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  submitterGroup: one(groups, {
    fields: [submissions.submitterGroupId],
    references: [groups.id],
    relationName: 'submitterGroup',
  }),
  // reviewerGroup is the committee (which IS the grant program)
  reviewerGroup: one(groups, {
    fields: [submissions.reviewerGroupId],
    references: [groups.id],
    relationName: 'reviewerGroup',
  }),
  submitter: one(users, {
    fields: [submissions.submitterId],
    references: [users.id],
  }),
  discussions: many(discussions),
  milestones: many(milestones),
  reviews: many(reviews),
  payouts: many(payouts),
  notifications: many(notifications),
}))

export const insertSubmissionSchema = createInsertSchema(submissions)
export const selectSubmissionSchema = createSelectSchema(submissions)

export type Submission = typeof submissions.$inferSelect
export type NewSubmission = typeof submissions.$inferInsert
