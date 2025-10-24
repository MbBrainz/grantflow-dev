import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  pgEnum,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { milestones } from './milestones'
import { groups } from './groups'
import { users } from './users'
import { reviews } from './reviews'

// Approval status enum
const APPROVAL_STATUS_OPTIONS = [
  'pending',
  'threshold_met',
  'executed',
  'cancelled',
] as const

export const approvalStatusEnum = pgEnum(
  'approval_status',
  APPROVAL_STATUS_OPTIONS
)
export type ApprovalStatus = (typeof APPROVAL_STATUS_OPTIONS)[number]

// Timepoint interface for tracking multisig call
export interface Timepoint {
  height: number
  index: number
}

// Milestone approvals table - tracks multisig approval process
export const milestoneApprovals = pgTable('milestone_approvals', {
  id: serial('id').primaryKey(),
  milestoneId: integer('milestone_id')
    .notNull()
    .references(() => milestones.id),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id), // Committee that owns the multisig
  multisigCallHash: varchar('multisig_call_hash', { length: 128 }).notNull(), // Blake2 hash of the call
  multisigCallData: text('multisig_call_data').notNull(), // Hex-encoded call data
  timepoint: jsonb('timepoint').$type<Timepoint | null>(), // Block height and extrinsic index
  status: approvalStatusEnum('status').notNull().default('pending'),
  initiatorId: integer('initiator_id')
    .notNull()
    .references(() => users.id), // User who initiated the approval
  initiatorAddress: varchar('initiator_address', { length: 64 }).notNull(), // Wallet address of initiator
  approvalWorkflow: varchar('approval_workflow', { length: 20 }).notNull(), // 'merged' | 'separated'
  payoutAmount: varchar('payout_amount', { length: 64 }), // BigInt as string
  beneficiaryAddress: varchar('beneficiary_address', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  executedAt: timestamp('executed_at'),
  executionTxHash: varchar('execution_tx_hash', { length: 128 }), // Final execution transaction
  executionBlockNumber: integer('execution_block_number'),
})

export const milestoneApprovalsRelations = relations(
  milestoneApprovals,
  ({ one, many }) => ({
    milestone: one(milestones, {
      fields: [milestoneApprovals.milestoneId],
      references: [milestones.id],
    }),
    group: one(groups, {
      fields: [milestoneApprovals.groupId],
      references: [groups.id],
    }),
    initiator: one(users, {
      fields: [milestoneApprovals.initiatorId],
      references: [users.id],
    }),
    signatures: many(multisigSignatures),
  })
)

export const insertMilestoneApprovalSchema =
  createInsertSchema(milestoneApprovals)
export const selectMilestoneApprovalSchema =
  createSelectSchema(milestoneApprovals)

export type MilestoneApproval = typeof milestoneApprovals.$inferSelect
export type NewMilestoneApproval = typeof milestoneApprovals.$inferInsert

// Multisig signatures table - tracks blockchain signatures from committee members
// Note: This is different from the 'reviews' table which tracks off-chain voting/feedback
// This table tracks actual cryptographic signatures for on-chain multisig execution
const SIGNATURE_OPTIONS = ['signed', 'rejected'] as const

export const signatureEnum = pgEnum('signature_type', SIGNATURE_OPTIONS)
export type SignatureType = (typeof SIGNATURE_OPTIONS)[number]

export const multisigSignatures = pgTable('multisig_signatures', {
  id: serial('id').primaryKey(),
  approvalId: integer('approval_id')
    .notNull()
    .references(() => milestoneApprovals.id),
  reviewId: integer('review_id').references(() => reviews.id), // Link to the review that led to this signature
  userId: integer('user_id').references(() => users.id), // Optional: link to user if known
  signatoryAddress: varchar('signatory_address', { length: 64 }).notNull(),
  signatureType: signatureEnum('signature_type').notNull(),
  txHash: varchar('tx_hash', { length: 128 }).notNull(),
  signedAt: timestamp('signed_at').notNull().defaultNow(),
  isInitiator: boolean('is_initiator').notNull().default(false),
  isFinalApproval: boolean('is_final_approval').notNull().default(false),
})

export const multisigSignaturesRelations = relations(
  multisigSignatures,
  ({ one }) => ({
    approval: one(milestoneApprovals, {
      fields: [multisigSignatures.approvalId],
      references: [milestoneApprovals.id],
    }),
    review: one(reviews, {
      fields: [multisigSignatures.reviewId],
      references: [reviews.id],
    }),
    user: one(users, {
      fields: [multisigSignatures.userId],
      references: [users.id],
    }),
  })
)

export const insertMultisigSignatureSchema =
  createInsertSchema(multisigSignatures)
export const selectMultisigSignatureSchema =
  createSelectSchema(multisigSignatures)

export type MultisigSignature = typeof multisigSignatures.$inferSelect
export type NewMultisigSignature = typeof multisigSignatures.$inferInsert
