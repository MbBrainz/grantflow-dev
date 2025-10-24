/**
 * Multisig Approvals Schema
 * 
 * Tracks multisig approval processes for milestone payments.
 * Each approval represents a multisig transaction that requires
 * multiple committee member signatures.
 */

import { pgTable, serial, text, integer, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { milestones } from './milestones'
import { groups } from './groups'

/**
 * Multisig Approval Status
 * 
 * - pending: Waiting for signatures
 * - threshold_met: Enough signatures collected, ready for execution
 * - executed: Transaction executed successfully
 * - cancelled: Approval process cancelled
 * - expired: Approval expired (optional timeout feature)
 */
export type ApprovalStatus = 'pending' | 'threshold_met' | 'executed' | 'cancelled' | 'expired'

/**
 * Timepoint for multisig tracking
 * 
 * After the first approval, Polkadot creates a timepoint that
 * uniquely identifies the multisig call in the chain state.
 */
export interface Timepoint {
  height: number // Block number
  index: number  // Extrinsic index within the block
}

/**
 * Multisig Approvals Table
 * 
 * Stores the state of multisig approval processes for milestone payments.
 */
export const multisigApprovals = pgTable('multisig_approvals', {
  id: serial('id').primaryKey(),
  
  // Link to milestone being approved
  milestoneId: integer('milestone_id')
    .notNull()
    .references(() => milestones.id, { onDelete: 'cascade' }),
  
  // Link to committee (multisig account owner)
  committeeId: integer('committee_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  
  // Multisig call details
  callHash: text('call_hash').notNull(), // Blake2-256 hash of call data
  callData: text('call_data').notNull(), // Hex-encoded full call data
  
  // Timepoint created after first approval
  // Null before first approval, set after
  timepoint: jsonb('timepoint').$type<Timepoint | null>(),
  
  // Approval status
  status: text('status').$type<ApprovalStatus>().notNull().default('pending'),
  
  // Who initiated (first signatory)
  initiatorAddress: text('initiator_address').notNull(),
  
  // Approval pattern used
  approvalPattern: text('approval_pattern').$type<'combined' | 'separated'>().notNull(),
  
  // Payment details (for combined pattern)
  paymentAmount: text('payment_amount'), // BigInt as string
  recipientAddress: text('recipient_address'),
  
  // Execution details
  executionTxHash: text('execution_tx_hash'),
  executionBlockNumber: integer('execution_block_number'),
  executedAt: timestamp('executed_at'),
  
  // Timing
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  
  // Optional: Expiry for approvals
  expiresAt: timestamp('expires_at'),
})

/**
 * Relations
 */
export const multisigApprovalsRelations = relations(multisigApprovals, ({ one, many }) => ({
  milestone: one(milestones, {
    fields: [multisigApprovals.milestoneId],
    references: [milestones.id],
  }),
  committee: one(groups, {
    fields: [multisigApprovals.committeeId],
    references: [groups.id],
  }),
  votes: many(signatoryVotes),
}))

/**
 * Signatory Votes Table
 * 
 * Records individual signatory votes on multisig approvals.
 */
export const signatoryVotes = pgTable('signatory_votes', {
  id: serial('id').primaryKey(),
  
  // Link to approval
  approvalId: integer('approval_id')
    .notNull()
    .references(() => multisigApprovals.id, { onDelete: 'cascade' }),
  
  // Signatory details
  signatoryAddress: text('signatory_address').notNull(),
  
  // Vote (approve or reject - though multisig only supports approve)
  vote: text('vote').$type<'approve' | 'reject'>().notNull(),
  
  // Transaction hash of the approval
  txHash: text('tx_hash').notNull(),
  
  // Flags
  isInitiator: boolean('is_initiator').notNull().default(false),
  isFinalApproval: boolean('is_final_approval').notNull().default(false),
  
  // Timing
  votedAt: timestamp('voted_at').notNull().defaultNow(),
  
  // Optional: Block number for verification
  blockNumber: integer('block_number'),
})

/**
 * Relations for signatory votes
 */
export const signatoryVotesRelations = relations(signatoryVotes, ({ one }) => ({
  approval: one(multisigApprovals, {
    fields: [signatoryVotes.approvalId],
    references: [multisigApprovals.id],
  }),
}))

/**
 * Type exports
 */
export type MultisigApproval = typeof multisigApprovals.$inferSelect
export type NewMultisigApproval = typeof multisigApprovals.$inferInsert

export type SignatoryVote = typeof signatoryVotes.$inferSelect
export type NewSignatoryVote = typeof signatoryVotes.$inferInsert

/**
 * Extended types with relations
 */
export type MultisigApprovalWithVotes = MultisigApproval & {
  votes: SignatoryVote[]
  milestone: {
    id: number
    title: string
    amount: string
    orderNumber: number
  }
  committee: {
    id: number
    name: string
    multisigAddress: string | null
    multisigThreshold: number | null
  }
}

