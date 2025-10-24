/**
 * Milestone Database Write Functions
 * 
 * Functions for updating milestone records.
 */

import { eq } from 'drizzle-orm'
import { db } from '../drizzle'
import { milestones } from '../schema/milestones'
import type { Milestone } from '../schema/milestones'

/**
 * Update milestone status
 */
export async function updateMilestoneStatus(
  milestoneId: number,
  updates: {
    status?: 'pending' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'changes_requested' | 'rejected' | 'completed'
    completedAt?: Date | null
    transactionHash?: string | null
    submittedAt?: Date | null
    reviewedAt?: Date | null
  }
): Promise<Milestone> {
  console.log(`[updateMilestoneStatus]: Updating milestone ${milestoneId}`, JSON.stringify(updates, null, 2))

  const [updated] = await db
    .update(milestones)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(milestones.id, milestoneId))
    .returning()

  if (!updated) {
    throw new Error(`Milestone ${milestoneId} not found`)
  }

  console.log(`[updateMilestoneStatus]: Updated milestone ${milestoneId}`)
  return updated
}

/**
 * Mark milestone as submitted for review
 */
export async function submitMilestoneForReview(
  milestoneId: number,
  deliverables: {
    githubPrUrl?: string
    githubCommitHash?: string
    notes?: string
  }
): Promise<Milestone> {
  console.log(`[submitMilestoneForReview]: Submitting milestone ${milestoneId} for review`)

  const [updated] = await db
    .update(milestones)
    .set({
      status: 'submitted',
      submittedAt: new Date(),
      updatedAt: new Date(),
      ...deliverables,
    })
    .where(eq(milestones.id, milestoneId))
    .returning()

  if (!updated) {
    throw new Error(`Milestone ${milestoneId} not found`)
  }

  console.log(`[submitMilestoneForReview]: Submitted milestone ${milestoneId}`)
  return updated
}

/**
 * Mark milestone as under review
 */
export async function startMilestoneReview(
  milestoneId: number
): Promise<Milestone> {
  console.log(`[startMilestoneReview]: Starting review for milestone ${milestoneId}`)

  const [updated] = await db
    .update(milestones)
    .set({
      status: 'under_review',
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(milestones.id, milestoneId))
    .returning()

  if (!updated) {
    throw new Error(`Milestone ${milestoneId} not found`)
  }

  console.log(`[startMilestoneReview]: Started review for milestone ${milestoneId}`)
  return updated
}

/**
 * Mark milestone as completed with payment transaction
 */
export async function completeMilestoneWithPayment(
  milestoneId: number,
  transactionHash: string,
  blockNumber?: number
): Promise<Milestone> {
  console.log(`[completeMilestoneWithPayment]: Completing milestone ${milestoneId} with tx ${transactionHash}`)

  const [updated] = await db
    .update(milestones)
    .set({
      status: 'completed',
      completedAt: new Date(),
      transactionHash,
      updatedAt: new Date(),
    })
    .where(eq(milestones.id, milestoneId))
    .returning()

  if (!updated) {
    throw new Error(`Milestone ${milestoneId} not found`)
  }

  console.log(`[completeMilestoneWithPayment]: Completed milestone ${milestoneId}`)
  return updated
}

