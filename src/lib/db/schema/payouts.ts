import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  bigint,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { submissions } from './submissions'
import { milestones } from './milestones'
import { groups } from './groups'
import { users } from './users'

export const payouts = pgTable('payouts', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id').references(() => submissions.id),
  milestoneId: integer('milestone_id').references(() => milestones.id),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  transactionHash: varchar('transaction_hash', { length: 128 }),
  blockExplorerUrl: varchar('block_explorer_url', { length: 500 }),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  triggeredBy: integer('triggered_by').references(() => users.id), // group member who triggered
  approvedBy: integer('approved_by').references(() => users.id), // final approver
  walletFrom: varchar('wallet_from', { length: 64 }), // group wallet
  walletTo: varchar('wallet_to', { length: 64 }), // recipient wallet
  createdAt: timestamp('created_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
})

export const payoutsRelations = relations(payouts, ({ one }) => ({
  submission: one(submissions, {
    fields: [payouts.submissionId],
    references: [submissions.id],
  }),
  milestone: one(milestones, {
    fields: [payouts.milestoneId],
    references: [milestones.id],
  }),
  group: one(groups, {
    fields: [payouts.groupId],
    references: [groups.id],
  }),
  triggeredByUser: one(users, {
    fields: [payouts.triggeredBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [payouts.approvedBy],
    references: [users.id],
  }),
}))

export const insertPayoutSchema = createInsertSchema(payouts)
export const selectPayoutSchema = createSelectSchema(payouts)

export type Payout = typeof payouts.$inferSelect
export type NewPayout = typeof payouts.$inferInsert
