import { eq } from 'drizzle-orm'
import { db } from '../drizzle'
import { milestones, payouts } from '../schema'

export async function createPayout(data: {
  submissionId?: number
  milestoneId: number
  groupId: number
  amount: number
  transactionHash: string
  blockExplorerUrl: string
  triggeredBy: number
  walletFrom?: string
  walletTo?: string
}) {
  const [payout] = await db
    .insert(payouts)
    .values({
      submissionId: data.submissionId,
      milestoneId: data.milestoneId,
      groupId: data.groupId,
      amount: data.amount,
      transactionHash: data.transactionHash,
      blockExplorerUrl: data.blockExplorerUrl,
      status: 'completed',
      triggeredBy: data.triggeredBy,
      approvedBy: data.triggeredBy,
      walletFrom: data.walletFrom,
      walletTo: data.walletTo,
      processedAt: new Date(),
    })
    .returning()

  return payout
}

export async function completeMilestoneWithPayout(data: {
  milestoneId: number
  groupId: number
  reviewerId: number
  transactionHash: string
  blockExplorerUrl: string
  amount: number
  walletFrom?: string
  walletTo?: string
}) {
  // Get the milestone to find the submission
  const milestone = await db
    .select()
    .from(milestones)
    .where(eq(milestones.id, data.milestoneId))
    .limit(1)

  if (!milestone[0]) {
    throw new Error('Milestone not found')
  }

  // Start transaction to update milestone and create payout record
  const results = await db.transaction(async tx => {
    // Update milestone status to completed
    const [updatedMilestone] = await tx
      .update(milestones)
      .set({
        status: 'completed',
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(milestones.id, data.milestoneId))
      .returning()

    // Create payout record with transaction details
    const [payout] = await tx
      .insert(payouts)
      .values({
        submissionId: milestone[0].submissionId,
        milestoneId: data.milestoneId,
        groupId: data.groupId,
        amount: data.amount,
        transactionHash: data.transactionHash,
        blockExplorerUrl: data.blockExplorerUrl,
        status: 'completed',
        triggeredBy: data.reviewerId,
        approvedBy: data.reviewerId,
        walletFrom: data.walletFrom,
        walletTo: data.walletTo,
        processedAt: new Date(),
      })
      .returning()

    return { milestone: updatedMilestone, payout }
  })

  return results
}
