/**
 * useMillestoneApprovals Hook
 * 
 * React hook for managing milestone approval workflows with multisig voting.
 * Handles approval state, voting status, and user interactions.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MultisigApprovalWithVotes } from '../db/schema/multisig-approvals'

export interface ApprovalProgress {
  approveVotes: number
  rejectVotes: number
  totalVotes: number
  threshold: number
  thresholdMet: boolean
  votesNeeded: number
  progressPercentage: number
}

export interface SignatoryStatus {
  address: string
  hasVoted: boolean
  isInitiator: boolean
  isFinalApprover: boolean
  votedAt?: Date
  txHash?: string
}

export interface UseMillestoneApprovalsResult {
  // State
  approval: MultisigApprovalWithVotes | null
  loading: boolean
  error: string | null
  
  // Progress
  progress: ApprovalProgress | null
  signatoryStatuses: SignatoryStatus[]
  
  // User state
  userAddress: string | null
  userHasVoted: boolean
  userCanVote: boolean
  userIsNextVoter: boolean
  userIsFinalVoter: boolean
  
  // Actions
  initiateApproval: (params: InitiateApprovalParams) => Promise<void>
  castVote: () => Promise<void>
  executePayment: () => Promise<void>
  refresh: () => Promise<void>
  
  // Status
  isInitiated: boolean
  isComplete: boolean
  canExecute: boolean
}

export interface InitiateApprovalParams {
  milestoneId: number
  committeeId: number
  recipientAddress: string
  payoutAmount: string
  approvalPattern: 'combined' | 'separated'
}

/**
 * Hook for managing milestone approvals
 */
export function useMillestoneApprovals(
  milestoneId: number,
  committeeId: number,
  userAddress?: string | null
): UseMillestoneApprovalsResult {
  const [approval, setApproval] = useState<MultisigApprovalWithVotes | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch approval data from API
   */
  const fetchApproval = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/milestones/${milestoneId}/approvals`)
      
      if (!response.ok) {
        if (response.status === 404) {
          // No approval yet
          setApproval(null)
          return
        }
        throw new Error('Failed to fetch approval')
      }

      const data = await response.json()
      setApproval(data.approval)
    } catch (err) {
      console.error('[useMillestoneApprovals]: Error fetching approval:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [milestoneId])

  /**
   * Initial fetch and setup polling
   */
  useEffect(() => {
    fetchApproval()

    // Poll for updates every 10 seconds if approval exists
    const interval = setInterval(() => {
      if (approval) {
        fetchApproval()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [fetchApproval, approval])

  /**
   * Calculate approval progress
   */
  const progress: ApprovalProgress | null = approval ? {
    approveVotes: approval.votes.filter(v => v.vote === 'approve').length,
    rejectVotes: approval.votes.filter(v => v.vote === 'reject').length,
    totalVotes: approval.votes.length,
    threshold: approval.committee.multisigThreshold ?? 0,
    thresholdMet: approval.votes.filter(v => v.vote === 'approve').length >= (approval.committee.multisigThreshold ?? 0),
    votesNeeded: Math.max(0, (approval.committee.multisigThreshold ?? 0) - approval.votes.filter(v => v.vote === 'approve').length),
    progressPercentage: ((approval.votes.filter(v => v.vote === 'approve').length) / (approval.committee.multisigThreshold ?? 1)) * 100,
  } : null

  /**
   * Get signatory statuses
   */
  const signatoryStatuses: SignatoryStatus[] = approval ? (approval.committee.multisigSignatories as string[] ?? []).map(address => {
    const vote = approval.votes.find(v => v.signatoryAddress === address)
    return {
      address,
      hasVoted: !!vote,
      isInitiator: vote?.isInitiator ?? false,
      isFinalApprover: vote?.isFinalApproval ?? false,
      votedAt: vote?.votedAt,
      txHash: vote?.txHash,
    }
  }) : []

  /**
   * User voting status
   */
  const userHasVoted = approval && userAddress
    ? approval.votes.some(v => v.signatoryAddress === userAddress)
    : false

  const userCanVote = approval && userAddress && !userHasVoted
    ? (approval.committee.multisigSignatories as string[] ?? []).includes(userAddress) && approval.status === 'pending'
    : false

  const userIsNextVoter = userCanVote

  const userIsFinalVoter = userCanVote && progress
    ? progress.votesNeeded === 1
    : false

  /**
   * Initiate approval (first signatory)
   */
  const initiateApproval = useCallback(async (params: InitiateApprovalParams) => {
    if (!userAddress) {
      throw new Error('No user address provided')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/milestones/${milestoneId}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          initiatorAddress: userAddress,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to initiate approval')
      }

      const data = await response.json()
      setApproval(data.approval)
    } catch (err) {
      console.error('[useMillestoneApprovals]: Error initiating approval:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [milestoneId, userAddress])

  /**
   * Cast vote (intermediate signatory)
   */
  const castVote = useCallback(async () => {
    if (!approval) {
      throw new Error('No approval to vote on')
    }

    if (!userAddress) {
      throw new Error('No user address provided')
    }

    if (userHasVoted) {
      throw new Error('Already voted')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/milestones/${milestoneId}/approvals/${approval.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatoryAddress: userAddress,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cast vote')
      }

      // Refresh approval data
      await fetchApproval()
    } catch (err) {
      console.error('[useMillestoneApprovals]: Error casting vote:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [approval, milestoneId, userAddress, userHasVoted, fetchApproval])

  /**
   * Execute payment (final signatory)
   */
  const executePayment = useCallback(async () => {
    if (!approval) {
      throw new Error('No approval to execute')
    }

    if (!userAddress) {
      throw new Error('No user address provided')
    }

    if (!userIsFinalVoter) {
      throw new Error('Not the final voter')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/milestones/${milestoneId}/approvals/${approval.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalSignatoryAddress: userAddress,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to execute payment')
      }

      // Refresh approval data
      await fetchApproval()
    } catch (err) {
      console.error('[useMillestoneApprovals]: Error executing payment:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [approval, milestoneId, userAddress, userIsFinalVoter, fetchApproval])

  /**
   * Status flags
   */
  const isInitiated = approval !== null
  const isComplete = approval?.status === 'executed'
  const canExecute = progress?.thresholdMet && !isComplete

  return {
    // State
    approval,
    loading,
    error,
    
    // Progress
    progress,
    signatoryStatuses,
    
    // User state
    userAddress: userAddress ?? null,
    userHasVoted,
    userCanVote,
    userIsNextVoter,
    userIsFinalVoter,
    
    // Actions
    initiateApproval,
    castVote,
    executePayment,
    refresh: fetchApproval,
    
    // Status
    isInitiated,
    isComplete,
    canExecute,
  }
}

