/**
 * Milestone Voting Panel Component
 * 
 * Displays milestone approval status and allows committee members
 * to vote on milestone completion using multisig transactions.
 */

'use client'

import { useState } from 'react'
import { useMillestoneApprovals } from '@/lib/hooks/use-milestone-approvals'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { truncateAddress } from '@/lib/polkadot/utils'
import { formatTokenAmount } from '@/lib/polkadot/client'
import type { Milestone } from '@/lib/db/schema/milestones'
import type { Group } from '@/lib/db/schema/groups'

export interface MilestoneVotingPanelProps {
  milestone: Milestone
  committee: Group
  userAddress?: string | null
  onVoteComplete?: () => void
}

export function MilestoneVotingPanel({
  milestone,
  committee,
  userAddress,
  onVoteComplete,
}: MilestoneVotingPanelProps) {
  const [approvalPattern, setApprovalPattern] = useState<'combined' | 'separated'>(
    committee.multisigApprovalPattern || 'combined'
  )

  const {
    approval,
    loading,
    error,
    progress,
    signatoryStatuses,
    userHasVoted,
    userCanVote,
    userIsNextVoter,
    userIsFinalVoter,
    initiateApproval,
    castVote,
    executePayment,
    isInitiated,
    isComplete,
  } = useMillestoneApprovals(milestone.id, committee.id, userAddress)

  /**
   * Handle initiate approval
   */
  const handleInitiate = async () => {
    if (!userAddress) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive',
      })
      return
    }

    try {
      await initiateApproval({
        milestoneId: milestone.id,
        committeeId: committee.id,
        recipientAddress: milestone.beneficiaryWalletAddress || '',
        payoutAmount: milestone.amount,
        approvalPattern,
      })

      toast({
        title: 'Approval Initiated',
        description: 'Milestone approval process started. Your vote has been recorded.',
      })

      onVoteComplete?.()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to initiate approval',
        variant: 'destructive',
      })
    }
  }

  /**
   * Handle cast vote
   */
  const handleVote = async () => {
    try {
      if (userIsFinalVoter) {
        await executePayment()
        toast({
          title: 'Payment Executed',
          description: 'Final vote cast and payment executed successfully!',
        })
      } else {
        await castVote()
        toast({
          title: 'Vote Recorded',
          description: 'Your approval vote has been recorded on-chain.',
        })
      }

      onVoteComplete?.()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to cast vote',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="p-6 space-y-4">
      {/* Milestone Header */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold">
          Milestone {milestone.orderNumber}: {milestone.title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
        <div className="mt-2 flex items-center gap-4">
          <span className="text-lg font-bold">
            {formatTokenAmount(BigInt(milestone.amount))}
          </span>
          <Badge variant={isComplete ? 'default' : 'secondary'}>
            {isComplete ? 'Paid' : milestone.status}
          </Badge>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Not Initiated State */}
      {!isInitiated && (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Initiate Milestone Approval</h4>
            <p className="text-sm text-gray-600 mb-4">
              Start the approval process for this milestone payment. Your vote will be automatically recorded.
            </p>
          </div>

          {/* Approval Pattern Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Approval Pattern</label>
            <div className="space-y-2">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="combined"
                  checked={approvalPattern === 'combined'}
                  onChange={(e) => setApprovalPattern(e.target.value as 'combined')}
                  className="mt-1"
                />
                <div>
                  <strong className="text-sm">Combined Approval & Payment</strong>
                  <p className="text-xs text-gray-600">
                    Payment executes automatically when threshold is reached. Faster, atomic transaction.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="separated"
                  checked={approvalPattern === 'separated'}
                  onChange={(e) => setApprovalPattern(e.target.value as 'separated')}
                  className="mt-1"
                />
                <div>
                  <strong className="text-sm">Separated Approval then Payment</strong>
                  <p className="text-xs text-gray-600">
                    Approval recorded first, payment requires separate authorization. More control.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <Button
            onClick={handleInitiate}
            disabled={loading || !userAddress}
            className="w-full"
          >
            {loading ? 'Initiating...' : 'Initiate Approval & Cast First Vote'}
          </Button>

          {/* Committee Info */}
          <div className="text-xs text-gray-600 space-y-1 pt-2 border-t">
            <p>Multisig: {committee.multisigAddress ? truncateAddress(committee.multisigAddress) : 'Not configured'}</p>
            <p>Threshold: {committee.multisigThreshold} of {(committee.multisigSignatories as string[] ?? []).length} signatures required</p>
          </div>
        </div>
      )}

      {/* Voting in Progress */}
      {isInitiated && !isComplete && (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Approval Progress</span>
              <span className="text-gray-600">
                {progress?.approveVotes} / {progress?.threshold} votes
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress?.progressPercentage ?? 0}%` }}
              />
            </div>
          </div>

          {/* Signatory Status List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Committee Votes</h4>
            <div className="space-y-2">
              {signatoryStatuses.map((status) => (
                <div
                  key={status.address}
                  className="flex items-center justify-between text-sm p-2 rounded bg-gray-50"
                >
                  <span className="font-mono text-xs">
                    {truncateAddress(status.address)}
                    {status.address === userAddress && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        You
                      </Badge>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {status.hasVoted ? (
                      <>
                        <span className="text-green-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Voted
                        </span>
                        {status.isInitiator && (
                          <Badge variant="secondary" className="text-xs">
                            Initiator
                          </Badge>
                        )}
                        {status.isFinalApprover && (
                          <Badge variant="default" className="text-xs">
                            Executed
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Action Required */}
          {userIsNextVoter && userCanVote && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4 space-y-3">
              <div>
                <p className="font-semibold text-blue-900">Your vote is needed!</p>
                <p className="text-sm text-blue-800 mt-1">
                  {progress?.votesNeeded === 1 ? (
                    <>
                      You are the final voter. Your approval will execute the payment immediately.
                    </>
                  ) : (
                    <>
                      {progress?.votesNeeded} more vote{progress?.votesNeeded !== 1 ? 's' : ''} needed to reach threshold.
                    </>
                  )}
                </p>
              </div>
              <Button
                onClick={handleVote}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Processing...' : userIsFinalVoter ? 'Cast Final Vote & Execute Payment' : 'Cast Approval Vote'}
              </Button>
            </div>
          )}

          {/* Already Voted */}
          {userHasVoted && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-green-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                You have voted on this milestone
              </p>
            </div>
          )}

          {/* Approval Pattern Info */}
          <div className="text-xs text-gray-500 border-t pt-3">
            <p>
              <strong>Pattern:</strong> {approval?.approvalPattern === 'combined' ? 'Combined' : 'Separated'}
            </p>
            {approval?.approvalPattern === 'combined' && (
              <p className="text-blue-600 mt-1">
                ℹ️ Payment will execute automatically when threshold is reached
              </p>
            )}
          </div>
        </div>
      )}

      {/* Completed State */}
      {isComplete && (
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-300 rounded p-4">
            <p className="font-semibold text-green-800 flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Milestone Approved & Payment Executed
            </p>
            {approval?.executionTxHash && (
              <a
                href={`https://paseo.subscan.io/extrinsic/${approval.executionTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm underline mt-2 inline-block"
              >
                View transaction on explorer →
              </a>
            )}
          </div>

          {/* Final vote summary */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>Final vote count: {progress?.approveVotes} approvals</p>
            <p>Threshold: {progress?.threshold} required</p>
            <p>Block: {approval?.executionBlockNumber}</p>
          </div>
        </div>
      )}
    </Card>
  )
}

