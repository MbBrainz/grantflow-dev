/**
 * Milestone Approval Execute API Route
 * 
 * POST - Execute milestone payment (final signatory)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/next-auth'
import { 
  getMultisigApprovalById,
} from '@/lib/db/queries/multisig'
import {
  executeMillestonePayment,
  canUserVote,
} from '@/lib/polkadot/multisig'
import { updateMilestoneStatus } from '@/lib/db/writes/milestones'

/**
 * POST /api/milestones/[id]/approvals/[approvalId]/execute
 * 
 * Execute payment for approved milestone
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; approvalId: string }> }
) {
  const { id, approvalId } = await params
  const milestoneId = parseInt(id, 10)
  const approvalIdNum = parseInt(approvalId, 10)

  if (isNaN(milestoneId) || isNaN(approvalIdNum)) {
    return NextResponse.json(
      { error: 'Invalid milestone or approval ID' },
      { status: 400 }
    )
  }

  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { finalSignatoryAddress } = body

    if (!finalSignatoryAddress) {
      return NextResponse.json(
        { error: 'Missing signatory address' },
        { status: 400 }
      )
    }

    // Get approval
    const approval = await getMultisigApprovalById(approvalIdNum)
    if (!approval) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      )
    }

    // Check if user can vote
    const voteCheck = await canUserVote(approvalIdNum, finalSignatoryAddress)
    if (!voteCheck.canVote) {
      return NextResponse.json(
        { error: voteCheck.reason || 'Cannot vote' },
        { status: 403 }
      )
    }

    if (!voteCheck.isFinalVoter) {
      return NextResponse.json(
        { error: 'Not the final voter - use vote endpoint instead' },
        { status: 400 }
      )
    }

    // Execute payment
    const result = await executeMillestonePayment(
      approvalIdNum,
      finalSignatoryAddress
    )

    // Update milestone status to completed
    const { milestones } = await import('@/lib/db/schema/milestones')
    await updateMilestoneStatus(milestoneId, {
      status: 'completed',
      completedAt: new Date(),
      transactionHash: result.txHash,
    })

    // Fetch updated approval
    const updatedApproval = await getMultisigApprovalById(approvalIdNum)

    return NextResponse.json({
      approval: updatedApproval,
      execution: result,
    })
  } catch (error) {
    console.error('[POST /api/milestones/[id]/approvals/[approvalId]/execute]: Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute payment' },
      { status: 500 }
    )
  }
}

