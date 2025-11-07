/**
 * Custom hook for managing multisig approval workflow
 * Shared between milestone-review-dialog and milestone-voting-panel
 */

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useApi, useSigner, useSwitchChain } from '@luno-kit/react'
import { getMilestoneApprovalStatus } from '@/app/(dashboard)/dashboard/submissions/multisig-actions'
import { chains } from '@/lib/polkadot/chains'
import { useToast } from './use-toast'

interface MultisigApprovalData {
  id: number
  callHash: string
  callData?: string
  timepoint: { height: number; index: number } | null
  initiatorAddress: string
  approvalWorkflow: string
  createdAt: Date
}

interface MultisigApprovalHookResult {
  // Connection state
  isConnected: boolean
  address: string | undefined
  signer: ReturnType<typeof useSigner>['data']
  client: ReturnType<typeof useApi>['api']

  // Approval state
  existingApproval: MultisigApprovalData | null
  isLoadingApproval: boolean
  approvalError: string | null

  // Vote counts
  voteCount: {
    total: number
    approvals: number
    rejections: number
    threshold: number
    thresholdMet: boolean
  } | null

  // Methods
  checkExistingApproval: () => Promise<void>
  hasUserVoted: (userAddress: string) => boolean
}

export function useMultisigApproval(
  milestoneId: number,
  multisigNetwork?: string
): MultisigApprovalHookResult {
  const { account, address } = useAccount()
  const { data: signer } = useSigner()
  const { api: client } = useApi()
  const { switchChainAsync, currentChainId, currentChain } = useSwitchChain()
  const { toast } = useToast()

  const [existingApproval, setExistingApproval] =
    useState<MultisigApprovalData | null>(null)
  const [isLoadingApproval, setIsLoadingApproval] = useState(false)
  const [approvalError, setApprovalError] = useState<string | null>(null)
  const [voteCount, setVoteCount] = useState<{
    total: number
    approvals: number
    rejections: number
    threshold: number
    thresholdMet: boolean
  } | null>(null)
  const [signatories, setSignatories] = useState<
    { address: string; signatureType: string }[]
  >([])

  // Handle chain switching
  useEffect(() => {
    if (!multisigNetwork) return

    const networkChain = chains[multisigNetwork]
    if (!networkChain) return

    if (currentChainId !== networkChain.genesisHash) {
      const fromChain = currentChain?.name ?? 'current chain'
      const toChain = networkChain.name
      const logText = `Switching chain from ${fromChain} to ${toChain}`
      console.log(`[useMultisigApproval]: ${logText}`)

      toast({
        title: 'Switching chain',
        description: logText,
      })

      switchChainAsync({ chainId: networkChain.genesisHash }).catch(error => {
        console.error('[useMultisigApproval]: Failed to switch chain', error)
        toast({
          title: 'Failed to switch chain',
          description:
            error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChainId, multisigNetwork])

  const checkExistingApproval = useCallback(async () => {
    setIsLoadingApproval(true)
    setApprovalError(null)

    try {
      const approvalStatus = await getMilestoneApprovalStatus(milestoneId)

      if (approvalStatus.status === 'active' && approvalStatus.approval) {
        setExistingApproval({
          ...approvalStatus.approval,
          callData:
            (approvalStatus.approval as { callData?: string }).callData ?? '',
        })
        setVoteCount(approvalStatus.votes ?? null)
        setSignatories(approvalStatus.signatories ?? [])
        console.log('[useMultisigApproval]: Found existing approval', {
          approvalId: approvalStatus.approval.id,
          votes: approvalStatus.votes,
        })
      } else if (approvalStatus.status === 'error') {
        setApprovalError(approvalStatus.error ?? 'Unknown error')
        setExistingApproval(null)
        setVoteCount(null)
      } else {
        setExistingApproval(null)
        setVoteCount(null)
        setSignatories([])
        console.log('[useMultisigApproval]: No existing approval found')
      }
    } catch (error) {
      console.error(
        '[useMultisigApproval]: Failed to check existing approval',
        error
      )
      setApprovalError(
        error instanceof Error ? error.message : 'Failed to check approval'
      )
      setExistingApproval(null)
      setVoteCount(null)
    } finally {
      setIsLoadingApproval(false)
    }
  }, [milestoneId])

  const hasUserVoted = useCallback(
    (userAddress: string) => {
      const normalized = userAddress.trim()
      return signatories.some(sig => sig.address.trim() === normalized)
    },
    [signatories]
  )

  const isConnected = !!account && !!address && !!client

  return {
    isConnected,
    address,
    signer,
    client,
    existingApproval,
    isLoadingApproval,
    approvalError,
    voteCount,
    checkExistingApproval,
    hasUserVoted,
  }
}
