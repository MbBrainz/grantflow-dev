/**
 * Milestone Approval Vote API Route
 * 
 * POST - Cast a vote on a milestone approval
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/next-auth'
import { 
  getMultisigApprovalById,
  hasSignatoryVoted,
} from '@/lib/db/queries/multisig'
import {
  approveMillestoneApproval,
  canUserVote,
} from '@/lib/polkadot/multisig'

/**
 * POST /api/milestones/[id]/approvals/[approvalId]/vote
 * 
 * Cast approval vote on a milestone
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
    const { signatoryAddress } = body

    if (!signatoryAddress) {
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
    const voteCheck = await canUserVote(approvalIdNum, signatoryAddress)
    if (!voteCheck.canVote) {
      return NextResponse.json(
        { error: voteCheck.reason || 'Cannot vote' },
        { status: 403 }
      )
    }

    // Cast vote
    const result = await approveMillestoneApproval(
      approvalIdNum,
      signatoryAddress
    )

    // Fetch updated approval
    const updatedApproval = await getMultisigApprovalById(approvalIdNum)

    return NextResponse.json({
      approval: updatedApproval,
      vote: result,
      thresholdMet: result.thresholdMet,
    })
  } catch (error) {
    console.error('[POST /api/milestones/[id]/approvals/[approvalId]/vote]: Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cast vote' },
      { status: 500 }
    )
  }
}

