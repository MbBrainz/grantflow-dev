/**
 * Milestone Approvals API Routes
 * 
 * GET - Get approval status for a milestone
 * POST - Initiate approval for a milestone
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/next-auth'
import { 
  getMultisigApprovalByMilestoneId,
  getCommitteeMultisigConfig,
} from '@/lib/db/queries/multisig'
import {
  initiateMillestoneApproval,
} from '@/lib/polkadot/multisig'

/**
 * GET /api/milestones/[id]/approvals
 * 
 * Get approval status for a milestone
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const milestoneId = parseInt(id, 10)

  if (isNaN(milestoneId)) {
    return NextResponse.json(
      { error: 'Invalid milestone ID' },
      { status: 400 }
    )
  }

  try {
    const approval = await getMultisigApprovalByMilestoneId(milestoneId)

    if (!approval) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ approval })
  } catch (error) {
    console.error('[GET /api/milestones/[id]/approvals]: Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approval' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/milestones/[id]/approvals
 * 
 * Initiate approval for a milestone
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const milestoneId = parseInt(id, 10)

  if (isNaN(milestoneId)) {
    return NextResponse.json(
      { error: 'Invalid milestone ID' },
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
    const {
      committeeId,
      recipientAddress,
      payoutAmount,
      approvalPattern,
      initiatorAddress,
    } = body

    // Validate input
    if (!committeeId || !recipientAddress || !payoutAmount || !approvalPattern || !initiatorAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get committee config
    const config = await getCommitteeMultisigConfig(committeeId)
    if (!config) {
      return NextResponse.json(
        { error: 'Committee not found' },
        { status: 404 }
      )
    }

    // Verify initiator is a signatory
    const signatories = config.multisigSignatories as string[] ?? []
    if (!signatories.includes(initiatorAddress)) {
      return NextResponse.json(
        { error: 'Not authorized as signatory' },
        { status: 403 }
      )
    }

    // Initiate approval
    const result = await initiateMillestoneApproval(
      milestoneId,
      committeeId,
      recipientAddress,
      BigInt(payoutAmount),
      initiatorAddress,
      approvalPattern
    )

    // Fetch updated approval
    const approval = await getMultisigApprovalByMilestoneId(milestoneId)

    return NextResponse.json({
      approval,
      result,
    })
  } catch (error) {
    console.error('[POST /api/milestones/[id]/approvals]: Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate approval' },
      { status: 500 }
    )
  }
}

