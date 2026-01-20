'use client'

import {
  useAccount,
  useApi,
  useConnect,
  useConnectors,
  useSigner,
  useSwitchChain,
} from '@luno-kit/react'
import { u8aToHex } from 'dedot/utils'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileCode,
  GitBranch,
  Info,
  Target,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  getSubmissionDetails,
  submitReview,
} from '@/app/(dashboard)/dashboard/submissions/actions'
import {
  castMultisigVote,
  getMilestoneApprovalStatus,
  initiateMultisigApproval,
} from '@/app/(dashboard)/dashboard/submissions/multisig-actions'
import { Badge } from '@/components/ui/badge'
import { BlockchainErrorAlert } from '@/components/ui/blockchain-error-alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InfoBox } from '@/components/ui/info-box'
import { Label } from '@/components/ui/label'
import { MetadataGrid } from '@/components/ui/metadata-grid'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Milestone } from '@/lib/db/schema'
import type { GroupSettings } from '@/lib/db/schema/jsonTypes/GroupSettings'
import {
  getErrorSummary,
  isRetryableError,
  type ParsedBlockchainError,
  parseBlockchainError,
} from '@/lib/errors/blockchain-errors'
import { useToast } from '@/lib/hooks/use-toast'
import { chains } from '@/lib/polkadot/chains'
import {
  approveOrExecuteMultisigCall,
  initiateMultisigApproval as initiatePolkadotApproval,
  willHitQuorum,
} from '@/lib/polkadot/multisig'
import {
  type ConversionResultWithRemark,
  convertUsdToTokensWithRemark,
  getTokenSymbol,
} from '@/lib/polkadot/price-feed'

interface MilestoneReviewDialogProps {
  milestone: Pick<
    Milestone,
    | 'id'
    | 'title'
    | 'description'
    | 'status'
    | 'amount'
    | 'dueDate'
    | 'deliverables'
    | 'requirements'
    | 'githubRepoUrl'
    | 'githubPrUrl'
    | 'githubCommitHash'
    | 'codeAnalysis'
    | 'submittedAt'
  >
  submissionId: number
  milestoneNumber: number
  committeeId: number
  committeeSettings?: GroupSettings | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReviewSubmitted: () => void
}

export function MilestoneReviewDialog({
  milestone,
  submissionId,
  milestoneNumber,
  committeeId: _committeeId, // Reserved for multisig signing when polkadot-api is configured
  committeeSettings,
  open,
  onOpenChange,
  onReviewSubmitted,
}: MilestoneReviewDialogProps) {
  const [selectedVote, setSelectedVote] = useState<
    'approve' | 'reject' | 'abstain' | null
  >(null)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSigningMultisig, setIsSigningMultisig] = useState(false)
  const [existingApproval, setExistingApproval] = useState<{
    id: number
    callHash: string
    callData: string
    timepoint: { height: number; index: number } | null
    initiatorAddress: string
    approvalWorkflow: string
    createdAt: Date
    // Price conversion info (for transparency to subsequent signatories)
    priceUsd?: string | null
    priceDate?: Date | null
    priceSource?: string | null
    tokenSymbol?: string | null
    tokenAmount?: string | null
  } | null>(null)
  const [isLoadingApproval, setIsLoadingApproval] = useState(false)
  const [priceConversion, setPriceConversion] =
    useState<ConversionResultWithRemark | null>(null)
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  const [blockchainError, setBlockchainError] =
    useState<ParsedBlockchainError | null>(null)
  const multisigConfig = committeeSettings?.multisig
  const { toast } = useToast()

  // LunoKit hooks for wallet connection
  const { account, address } = useAccount()
  const { currentChainId } = useSwitchChain()
  useEffect(() => {
    const networkChain = multisigConfig?.network
      ? chains[multisigConfig.network]
      : null
    if (currentChainId !== networkChain?.genesisHash && networkChain) {
      const toChain = networkChain.name
      const logText = ` Please switch your network to ${toChain} to continue`
      console.log(`[MilestoneReviewDialog]: ${logText}`)

      // toast({title: 'Network Change Required',description: logText,})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChainId])
  const { connect } = useConnect()
  const connectors = useConnectors()
  const { data: signer } = useSigner()
  const { api: client } = useApi()

  // Derive connection state
  const isConnected = !!account && !!address && !!client
  const selectedSigner = signer

  // Check if merged workflow is enabled
  const isMergedWorkflow = multisigConfig?.approvalWorkflow === 'merged'

  const deliverables = Array.isArray(milestone.deliverables)
    ? milestone.deliverables
    : []

  const requirements = Array.isArray(milestone.requirements)
    ? milestone.requirements
    : []

  const checkExistingApproval = useCallback(async () => {
    setIsLoadingApproval(true)
    try {
      const approvalStatus = await getMilestoneApprovalStatus(milestone.id)
      if (approvalStatus.status === 'active' && approvalStatus.approval) {
        const approval = approvalStatus.approval as {
          callData?: string
          priceUsd?: string | null
          priceDate?: Date | null
          priceSource?: string | null
          tokenSymbol?: string | null
          tokenAmount?: string | null
        }
        setExistingApproval({
          ...approvalStatus.approval,
          callData: approval.callData ?? '',
          priceUsd: approval.priceUsd,
          priceDate: approval.priceDate,
          priceSource: approval.priceSource,
          tokenSymbol: approval.tokenSymbol,
          tokenAmount: approval.tokenAmount,
        })
        console.log(
          '[MilestoneReviewDialog]: Found existing approval',
          approvalStatus
        )
      } else {
        setExistingApproval(null)
        console.log('[MilestoneReviewDialog]: No existing approval found')
      }
    } catch (error) {
      console.error(
        '[MilestoneReviewDialog]: Failed to check existing approval',
        error
      )
      setExistingApproval(null)
    } finally {
      setIsLoadingApproval(false)
    }
  }, [milestone.id])

  // Check for existing approval when dialog opens, and clear errors
  useEffect(() => {
    if (open) {
      // Clear any previous blockchain error when dialog opens
      setBlockchainError(null)
      if (isMergedWorkflow) {
        void checkExistingApproval()
      }
    }
  }, [open, isMergedWorkflow, checkExistingApproval])

  // Fetch price conversion when dialog opens (for merged workflow)
  // If an existing approval exists, use the stored price info for consistency
  useEffect(() => {
    async function fetchPriceConversion() {
      if (!open || !isMergedWorkflow || !multisigConfig) return

      setIsLoadingPrice(true)
      try {
        const network = multisigConfig.network ?? 'paseo'

        // If existing approval has price info, use that for consistency
        if (
          existingApproval?.priceUsd &&
          existingApproval?.priceDate &&
          existingApproval?.priceSource
        ) {
          // Reconstruct price conversion from stored approval data
          const storedPriceDate = new Date(existingApproval.priceDate)
          const storedConversion: ConversionResultWithRemark = {
            amountUsd: milestone.amount ?? 0,
            amountTokens: parseFloat(existingApproval.tokenAmount ?? '0'),
            amountPlanck: BigInt(0), // Not needed for display
            price: {
              symbol: existingApproval.tokenSymbol ?? 'PAS',
              priceUsd: parseFloat(existingApproval.priceUsd),
              timestamp: storedPriceDate,
              source: existingApproval.priceSource as
                | 'mock'
                | 'coingecko'
                | 'chainlink'
                | 'subscan',
            },
            decimals: 10,
            remarkInfo: {
              priceUsd: existingApproval.priceUsd,
              priceDate: storedPriceDate.toISOString(),
              priceDateFormatted: `${storedPriceDate.toISOString().replace('T', ' ').slice(0, 19)} UTC`,
              priceSource: existingApproval.priceSource,
              remarkString: '', // Not needed for display
            },
          }
          setPriceConversion(storedConversion)
          console.log(
            '[MilestoneReviewDialog]: Using stored price conversion from approval',
            {
              priceUsd: existingApproval.priceUsd,
              priceDate: existingApproval.priceDate,
              priceSource: existingApproval.priceSource,
              tokenAmount: existingApproval.tokenAmount,
            }
          )
          return
        }

        // No existing approval or no stored price info - fetch fresh price
        const conversion = await convertUsdToTokensWithRemark(
          milestone.amount ?? 0,
          network,
          milestone.id,
          milestone.title
        )
        setPriceConversion(conversion)
        console.log('[MilestoneReviewDialog]: Price conversion fetched', {
          amountUsd: conversion.amountUsd,
          amountTokens: conversion.amountTokens,
          priceUsd: conversion.price.priceUsd,
          priceDate: conversion.remarkInfo.priceDateFormatted,
          priceSource: conversion.remarkInfo.priceSource,
        })
      } catch (error) {
        console.error(
          '[MilestoneReviewDialog]: Failed to fetch price conversion',
          error
        )
      } finally {
        setIsLoadingPrice(false)
      }
    }

    void fetchPriceConversion()
  }, [
    open,
    isMergedWorkflow,
    multisigConfig,
    milestone.amount,
    milestone.id,
    milestone.title,
    existingApproval,
  ])

  const handleMultisigApproval = async () => {
    if (!account || !address || !multisigConfig) {
      console.error(
        '[MilestoneReviewDialog]: Missing account or multisig config'
      )
      throw new Error('Missing account or multisig configuration')
    }

    setIsSigningMultisig(true)
    // Clear any previous error when starting a new attempt
    setBlockchainError(null)

    try {
      if (existingApproval) {
        // There's an existing approval - this is a subsequent vote
        await handleSubsequentApproval()
      } else {
        // No existing approval - this is the initial approval
        await handleInitialApproval()
      }
    } catch (error) {
      console.error('[MilestoneReviewDialog]: Multisig approval failed', error)

      // Parse the error into a structured format with context
      const network = multisigConfig.network ?? 'paseo'
      const parsedError = parseBlockchainError(error, {
        network,
        parentBountyId: multisigConfig.parentBountyId,
        accountAddress: address,
        threshold: multisigConfig.threshold,
      })

      // Store the parsed error for detailed display
      setBlockchainError(parsedError)

      // Show a brief toast notification with summary
      toast({
        title: parsedError.title,
        description: getErrorSummary(parsedError),
        variant: 'destructive',
      })

      throw error // Re-throw to be caught by handleSubmit
    } finally {
      setIsSigningMultisig(false)
    }
  }

  const handleInitialApproval = async () => {
    console.log('[MilestoneReviewDialog]: Handling initial approval')

    if (!account || !address || !multisigConfig || !selectedSigner || !client) {
      throw new Error('Missing account, multisig configuration, or signer')
    }

    toast({
      title: 'Initiating Multisig Transaction',
      description: 'Creating new multisig transaction for milestone approval.',
    })

    try {
      // Get submission details for beneficiary address
      const submissionResult = await getSubmissionDetails(submissionId)
      if (submissionResult.error || !submissionResult.success) {
        throw new Error(
          submissionResult.error ?? 'Failed to get submission details'
        )
      }
      if (!submissionResult.submission?.walletAddress) {
        throw new Error('Submission beneficiary address not found')
      }
      const beneficiaryAddress = submissionResult.submission.walletAddress

      // Use the pre-fetched price conversion (with remark info)
      // This ensures the price displayed to the user matches the on-chain remark
      const network = multisigConfig.network ?? 'paseo'
      const conversion =
        priceConversion ??
        (await convertUsdToTokensWithRemark(
          milestone.amount ?? 0,
          network,
          milestone.id,
          milestone.title
        ))

      console.log('[MilestoneReviewDialog]: USD to token conversion', {
        amountUsd: milestone.amount,
        amountTokens: conversion.amountTokens,
        amountPlanck: conversion.amountPlanck.toString(),
        priceUsd: conversion.price.priceUsd,
        priceDate: conversion.remarkInfo.priceDateFormatted,
        priceSource: conversion.remarkInfo.priceSource,
        network,
      })

      // Create Polkadot multisig transaction with price info remark
      const polkadotResult = await initiatePolkadotApproval({
        client,
        multisigConfig,
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        payoutAmount: conversion.amountPlanck,
        beneficiaryAddress,
        initiatorAddress: address,
        signer: selectedSigner,
        network,
        priceInfo: conversion.remarkInfo, // Include price info for on-chain remark
      })

      // Record the approval in database (with bounty tracking and price info)
      console.log('[MilestoneReviewDialog]: Recording approval in database', {
        milestoneId: milestone.id,
        timepoint: polkadotResult.timepoint,
        approvalWorkflow: 'merged',
        txHash: polkadotResult.txHash,
        initiatorWalletAddress: address,
        callHash: polkadotResult.callHash,
        callDataHex: u8aToHex(polkadotResult.callData),
        predictedChildBountyId: polkadotResult.predictedChildBountyId,
        parentBountyId: multisigConfig.parentBountyId,
        priceInfo: conversion.remarkInfo,
      })
      await initiateMultisigApproval({
        milestoneId: milestone.id,
        timepoint: polkadotResult.timepoint,
        approvalWorkflow: 'merged',
        txHash: polkadotResult.txHash,
        initiatorWalletAddress: address,
        callHash: polkadotResult.callHash,
        callDataHex: u8aToHex(polkadotResult.callData),
        // Child bounty tracking
        predictedChildBountyId: polkadotResult.predictedChildBountyId,
        parentBountyId: multisigConfig.parentBountyId,
        // Price conversion info (for transparency to other signatories)
        priceUsd: conversion.remarkInfo.priceUsd,
        priceDate: conversion.remarkInfo.priceDate,
        priceSource: conversion.remarkInfo.priceSource,
        tokenSymbol: getTokenSymbol(network),
        tokenAmount: conversion.amountTokens.toString(),
      })

      toast({
        title: 'Initial Approval Created',
        description: `Multisig transaction initiated. Transaction hash: ${polkadotResult.txHash.slice(0, 10)}...`,
      })
    } catch (error) {
      console.error(
        '[MilestoneReviewDialog]: Failed to create initial approval',
        error
      )
      throw error
    }
  }

  const handleSubsequentApproval = async () => {
    console.log('[MilestoneReviewDialog]: Handling subsequent approval')

    if (
      !account ||
      !address ||
      !multisigConfig ||
      !existingApproval ||
      !selectedSigner ||
      !client
    ) {
      throw new Error(
        'Missing account, multisig config, existing approval, or signer'
      )
    }

    // Validate timepoint exists
    if (
      !existingApproval.timepoint ||
      existingApproval.timepoint.height === 0 ||
      existingApproval.timepoint.index === 0
    ) {
      toast({
        title: 'Invalid Timepoint',
        description:
          'The multisig timepoint is missing or invalid. The initiator may need to retry the initial approval.',
        variant: 'destructive',
      })
      throw new Error(
        'Invalid or missing timepoint for existing multisig approval'
      )
    }

    try {
      // Get submission details for beneficiary address (needed for potential execution)
      const submissionResult = await getSubmissionDetails(submissionId)
      if (submissionResult.error || !submissionResult.success) {
        throw new Error(
          submissionResult.error ?? 'Failed to get submission details'
        )
      }
      if (!submissionResult.submission?.walletAddress) {
        throw new Error('Submission beneficiary address not found')
      }
      const beneficiaryAddress = submissionResult.submission.walletAddress

      // Use the pre-fetched price conversion (should match the initial approval's price)
      // Note: For subsequent approvals, ideally we'd retrieve the original price from DB
      // For now, we use the current price conversion (will be stored in DB later)
      const network = multisigConfig.network ?? 'paseo'
      const conversion =
        priceConversion ??
        (await convertUsdToTokensWithRemark(
          milestone.amount ?? 0,
          network,
          milestone.id,
          milestone.title
        ))

      console.log(
        '[MilestoneReviewDialog]: USD to token conversion (subsequent)',
        {
          amountUsd: milestone.amount,
          amountTokens: conversion.amountTokens,
          amountPlanck: conversion.amountPlanck.toString(),
          priceUsd: conversion.price.priceUsd,
          priceDate: conversion.remarkInfo.priceDateFormatted,
          priceSource: conversion.remarkInfo.priceSource,
          network,
        }
      )

      // Get current approval count to check if this vote will hit quorum
      const approvalStatus = await getMilestoneApprovalStatus(milestone.id)
      const currentApprovals =
        approvalStatus.status === 'active'
          ? (approvalStatus.votes?.approvals ?? 0)
          : 0

      // Check if this vote will hit quorum (for display purposes)
      const willExecute = willHitQuorum(
        currentApprovals,
        multisigConfig.threshold
      )

      toast({
        title: willExecute
          ? 'Executing Final Approval'
          : 'Adding Your Approval',
        description: willExecute
          ? 'Threshold will be met! Executing the multisig transaction.'
          : 'Adding your signature to the existing multisig transaction.',
      })

      // Use approveOrExecuteMultisigCall which handles quorum detection automatically
      // If quorum is hit, it will execute atomically (approval + execution in one tx)
      const polkadotResult = await approveOrExecuteMultisigCall({
        client,
        currentApprovals,
        callDataHex: existingApproval.callData,
        callHash: existingApproval.callHash,
        timepoint: existingApproval.timepoint,
        threshold: multisigConfig.threshold,
        allSignatories: multisigConfig.signatories.map(s => s.address),
        approverAddress: address,
        signer: selectedSigner,
        beneficiaryAddress,
        payoutAmount: conversion.amountPlanck,
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        multisigConfig,
        network,
        priceInfo: conversion.remarkInfo, // Pass price info for call reconstruction
      })

      // Record the vote in database (with execution info if it was executed)
      await castMultisigVote({
        approvalId: existingApproval.id,
        signatoryAddress: address,
        signatureType: 'signed',
        txHash: polkadotResult.txHash,
        wasExecuted: polkadotResult.wasExecuted,
        executionBlockNumber: polkadotResult.blockNumber,
        // childBountyId would be extracted from chain events if using childBounty workflow
      })

      if (polkadotResult.wasExecuted) {
        toast({
          title: 'Transaction Executed Successfully!',
          description: `Payment completed. Execution hash: ${polkadotResult.txHash.slice(0, 10)}...`,
        })
      } else {
        toast({
          title: 'Approval Added',
          description: `Your signature has been added. Transaction hash: ${polkadotResult.txHash.slice(0, 10)}...`,
        })
      }
    } catch (error) {
      console.error('[MilestoneReviewDialog]: Failed to add approval', error)
      throw error
    }
  }

  // NOTE: handleFinalApproval is no longer needed as a separate function
  // The quorum detection and execution is now handled automatically in
  // approveOrExecuteMultisigCall - when the vote hits quorum, it combines
  // approval + execution in one atomic transaction

  const handleSubmit = async () => {
    if (!selectedVote) {
      toast({
        title: 'Vote Required',
        description: 'Please select your vote before submitting.',
        variant: 'destructive',
      })
      return
    }

    // For merged workflow with approve vote, check wallet connection first
    if (isMergedWorkflow && selectedVote === 'approve' && !isConnected) {
      toast({
        title: 'Wallet Connection Required',
        description:
          'For on-chain payment approval, please connect your Polkadot wallet first.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // For merged workflow + approve vote, handle multisig transaction FIRST
      if (
        isMergedWorkflow &&
        selectedVote === 'approve' &&
        multisigConfig &&
        account
      ) {
        try {
          await handleMultisigApproval()

          toast({
            title: 'Blockchain Transaction Successful',
            description:
              'Your on-chain approval has been recorded. Now recording your review vote.',
          })
        } catch (multisigError) {
          // Multisig failed - error already parsed and displayed via handleMultisigApproval
          // The blockchainError state is already set with detailed information
          console.error(
            '[MilestoneReviewDialog]: Multisig transaction failed',
            multisigError
          )

          // Don't submit review - keep dialog open for retry
          // The BlockchainErrorAlert will show detailed error information
          return
        }
      }

      // Now submit the review (after blockchain transaction succeeds or if no multisig needed)
      const reviewData = {
        submissionId,
        milestoneId: milestone.id,
        vote: selectedVote,
        feedback: feedback.trim() || undefined,
      }

      const result = await submitReview(reviewData)

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      // Success - both blockchain (if needed) and off-chain vote recorded
      toast({
        title: 'Review Submitted',
        description: `Your ${selectedVote} vote has been recorded for this milestone.`,
      })

      // Success - close dialog and refresh
      onReviewSubmitted()
      onOpenChange(false)
      setSelectedVote(null)
      setFeedback('')
    } catch (error) {
      console.error('[MilestoneReviewDialog]: Error submitting review', error)
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
      setIsSigningMultisig(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
        <div className="p-6">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">
                  Review Milestone {milestoneNumber}
                </h2>
                <p className="mt-1 text-sm text-gray-600">{milestone.title}</p>
              </div>
              <Badge
                variant="outline"
                className={
                  milestone.status === 'in-review'
                    ? 'border-purple-300 bg-purple-50 text-purple-700'
                    : 'border-blue-300 bg-blue-50 text-blue-700'
                }
              >
                {milestone.status.replace('-', ' ')}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Merged Workflow Banner */}
            {isMergedWorkflow && multisigConfig && (
              <InfoBox
                icon={<Wallet className="h-5 w-5" />}
                title="On-Chain Approval Workflow"
                variant="info"
              >
                <p className="mb-3">
                  This committee uses merged workflow. When you approve this
                  milestone, you&apos;ll be prompted to sign a blockchain
                  transaction with your Polkadot wallet.
                </p>
                {!isConnected && (
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Connect your wallet:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {connectors.length > 0 ? (
                        connectors.map(connector => (
                          <Button
                            key={connector.id}
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              connect({ connectorId: connector.id })
                            }
                            className="border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
                          >
                            <Wallet className="mr-2 h-3 w-3" />
                            {connector.name}
                          </Button>
                        ))
                      ) : (
                        <p className="text-sm text-blue-600">
                          No Polkadot wallet extensions detected. Please install
                          Polkadot.js, Talisman, or SubWallet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {isConnected && address && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-700">
                      Connected:{' '}
                      <code className="rounded bg-blue-100 px-1 py-0.5 text-xs">
                        {address.slice(0, 8)}...
                        {address.slice(-6)}
                      </code>
                    </span>
                  </div>
                )}
              </InfoBox>
            )}

            <MetadataGrid
              items={[
                {
                  icon: <DollarSign className="h-4 w-4 text-gray-500" />,
                  label: 'Funding Amount',
                  value: `$${(milestone.amount ?? 0).toLocaleString()}`,
                },
                {
                  icon: <Calendar className="h-4 w-4 text-gray-500" />,
                  label: 'Due Date',
                  value: milestone.dueDate
                    ? new Date(milestone.dueDate).toLocaleDateString()
                    : 'Not specified',
                },
                milestone.submittedAt && {
                  icon: <Clock className="h-4 w-4 text-gray-500" />,
                  label: 'Submitted At',
                  value: new Date(milestone.submittedAt).toLocaleString(),
                },
              ].filter(Boolean)}
              columns={milestone.submittedAt ? 3 : 2}
            />

            {/* Price Conversion Info for Merged Workflow */}
            {isMergedWorkflow && multisigConfig && (
              <InfoBox
                icon={<DollarSign className="h-4 w-4" />}
                title="Payout Conversion Details"
                variant="info"
              >
                {isLoadingPrice ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 animate-spin" />
                    Loading price conversion...
                  </div>
                ) : priceConversion ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-medium text-gray-500">
                          USD Amount
                        </p>
                        <p className="font-medium text-gray-900">
                          ${priceConversion.amountUsd.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">
                          Token Amount
                        </p>
                        <p className="font-medium text-gray-900">
                          {priceConversion.amountTokens.toLocaleString(
                            undefined,
                            { maximumFractionDigits: 4 }
                          )}{' '}
                          {getTokenSymbol(multisigConfig.network ?? 'paseo')}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                      <p className="mb-2 text-xs font-medium text-blue-800">
                        Conversion Rate Used
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-blue-600">Price</p>
                          <p className="font-mono font-medium text-blue-900">
                            ${priceConversion.remarkInfo.priceUsd} USD
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-600">Date</p>
                          <p className="font-mono font-medium text-blue-900">
                            {priceConversion.remarkInfo.priceDateFormatted}
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-600">Source</p>
                          <p className="font-mono font-medium text-blue-900">
                            {priceConversion.remarkInfo.priceSource}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {existingApproval
                        ? 'This conversion rate was recorded when the initial transaction was created.'
                        : 'This conversion rate will be recorded on-chain when the transaction is created, ensuring transparency for all signatories.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Unable to load price conversion. Please try again.
                  </p>
                )}
              </InfoBox>
            )}

            <InfoBox
              icon={<FileCode className="h-4 w-4" />}
              title="Description"
            >
              <p className="whitespace-pre-wrap text-gray-700">
                {milestone.description}
              </p>
            </InfoBox>

            {requirements.length > 0 && (
              <InfoBox
                icon={<CheckCircle className="h-4 w-4" />}
                title="Acceptance Criteria"
              >
                <ul className="space-y-2">
                  {requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span className="text-sm">{req}</span>
                    </li>
                  ))}
                </ul>
              </InfoBox>
            )}

            {deliverables.length > 0 && (
              <InfoBox
                icon={<GitBranch className="h-4 w-4" />}
                title="Submitted Deliverables"
              >
                <div className="space-y-3">
                  {deliverables.map((deliverable, index) => (
                    <Card key={index} className="p-4">
                      <p className="mb-2 text-sm font-medium">
                        {deliverable.description}
                      </p>
                      {deliverable.commits &&
                        deliverable.commits.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-gray-500">
                              Commits:
                            </p>
                            {deliverable.commits.map((commit, commitIndex) => (
                              <a
                                key={commitIndex}
                                href={commit.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                              >
                                <code className="rounded bg-gray-100 px-1 py-0.5">
                                  {commit.shortSha}
                                </code>
                              </a>
                            ))}
                          </div>
                        )}
                      {deliverable.submittedAt && (
                        <p className="mt-2 text-xs text-gray-500">
                          Submitted:{' '}
                          {new Date(deliverable.submittedAt).toLocaleString()}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </InfoBox>
            )}

            {(milestone.githubRepoUrl ??
              milestone.githubPrUrl ??
              milestone.githubCommitHash) && (
              <InfoBox
                icon={<GitBranch className="h-4 w-4" />}
                title="Code Repository"
              >
                <div className="space-y-2">
                  {milestone.githubRepoUrl && (
                    <div>
                      <p className="text-xs text-gray-500">Repository:</p>
                      <a
                        href={milestone.githubRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {milestone.githubRepoUrl}
                      </a>
                    </div>
                  )}
                  {milestone.githubPrUrl && (
                    <div>
                      <p className="text-xs text-gray-500">Pull Request:</p>
                      <a
                        href={milestone.githubPrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {milestone.githubPrUrl}
                      </a>
                    </div>
                  )}
                  {milestone.githubCommitHash && (
                    <div>
                      <p className="text-xs text-gray-500">Commit Hash:</p>
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                        {milestone.githubCommitHash}
                      </code>
                    </div>
                  )}
                </div>
              </InfoBox>
            )}

            {milestone.codeAnalysis && (
              <InfoBox
                icon={<AlertCircle className="h-4 w-4" />}
                title="AI Code Analysis"
                variant="info"
              >
                <p className="whitespace-pre-wrap text-gray-700">
                  {milestone.codeAnalysis}
                </p>
              </InfoBox>
            )}

            <div className="border-t pt-6">
              {/* Blockchain Error Display */}
              {blockchainError && (
                <div className="mb-6">
                  <BlockchainErrorAlert
                    error={blockchainError}
                    onRetry={
                      isRetryableError(blockchainError)
                        ? () => {
                            setBlockchainError(null)
                            void handleSubmit()
                          }
                        : undefined
                    }
                    onDismiss={() => setBlockchainError(null)}
                    showTechnicalDetails={true}
                  />
                </div>
              )}

              {/* Compact Multisig Status for Merged Workflow */}
              {isMergedWorkflow && multisigConfig && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  {isLoadingApproval ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Checking multisig status...
                      </span>
                    </>
                  ) : existingApproval ? (
                    <>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                        <Users className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          Active transaction
                        </span>
                        <span className="mx-2 text-gray-400">·</span>
                        <span className="text-sm text-gray-600">
                          {multisigConfig.threshold} of{' '}
                          {multisigConfig.signatories.length} signatures needed
                        </span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Info className="h-3.5 w-3.5 text-gray-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-xs">
                            Call Hash: {existingApproval.callHash.slice(0, 16)}
                            ...
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          Ready to initiate
                        </span>
                        <span className="mx-2 text-gray-400">·</span>
                        <span className="text-sm text-gray-600">
                          {multisigConfig.threshold} of{' '}
                          {multisigConfig.signatories.length} signatures needed
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <h3 className="mb-4 text-lg font-semibold">Cast Your Vote</h3>

              <div className="space-y-4">
                <div>
                  <Label className="mb-3 block text-sm font-medium">
                    Your Decision
                  </Label>
                  <RadioGroup
                    value={selectedVote ?? ''}
                    onValueChange={value =>
                      setSelectedVote(value as 'approve' | 'reject' | 'abstain')
                    }
                    className="grid grid-cols-1 gap-3 md:grid-cols-3"
                  >
                    <label
                      htmlFor="approve"
                      className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all hover:bg-green-50 ${
                        selectedVote === 'approve'
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <RadioGroupItem
                        value="approve"
                        id="approve"
                        className="sr-only"
                      />
                      <CheckCircle
                        className={`h-8 w-8 ${selectedVote === 'approve' ? 'text-green-600' : 'text-gray-400'}`}
                      />
                      <div>
                        <p
                          className={`font-semibold ${selectedVote === 'approve' ? 'text-green-900' : 'text-gray-700'}`}
                        >
                          Approve
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Meets requirements
                        </p>
                      </div>
                    </label>

                    <label
                      htmlFor="reject"
                      className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all hover:bg-red-50 ${
                        selectedVote === 'reject'
                          ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <RadioGroupItem
                        value="reject"
                        id="reject"
                        className="sr-only"
                      />
                      <XCircle
                        className={`h-8 w-8 ${selectedVote === 'reject' ? 'text-red-600' : 'text-gray-400'}`}
                      />
                      <div>
                        <p
                          className={`font-semibold ${selectedVote === 'reject' ? 'text-red-900' : 'text-gray-700'}`}
                        >
                          Reject
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Needs changes
                        </p>
                      </div>
                    </label>

                    <label
                      htmlFor="abstain"
                      className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all hover:bg-yellow-50 ${
                        selectedVote === 'abstain'
                          ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <RadioGroupItem
                        value="abstain"
                        id="abstain"
                        className="sr-only"
                      />
                      <Clock
                        className={`h-8 w-8 ${selectedVote === 'abstain' ? 'text-yellow-600' : 'text-gray-400'}`}
                      />
                      <div>
                        <p
                          className={`font-semibold ${selectedVote === 'abstain' ? 'text-yellow-900' : 'text-gray-700'}`}
                        >
                          Abstain
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          No decision
                        </p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="feedback" className="mb-2 block text-sm">
                    Feedback (Optional)
                  </Label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Provide detailed feedback on the milestone deliverables..."
                    className="min-h-[120px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Your feedback will be shared with the grantee and other
                    reviewers.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting || isSigningMultisig}
                  >
                    Cancel
                  </Button>
                  {/* TODO: Add link to documentation when available - e.g., href="/docs/multisig-approvals" */}
                  {selectedVote === 'approve' &&
                  isMergedWorkflow &&
                  multisigConfig &&
                  isConnected ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting || isSigningMultisig}
                        >
                          {isSigningMultisig
                            ? 'Signing Transaction...'
                            : isSubmitting
                              ? 'Submitting...'
                              : 'Sign & Submit'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-sm p-3"
                        sideOffset={8}
                      >
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">
                            {existingApproval
                              ? 'Add Your Signature'
                              : 'Create Multisig Transaction'}
                          </p>
                          <p className="text-xs text-gray-300">
                            {existingApproval
                              ? 'Your wallet will sign the existing transaction. Once the threshold is reached, payment executes automatically.'
                              : 'Your wallet will create a new child bounty transaction on-chain. Other signatories can then add their approvals.'}
                          </p>
                          <div className="mt-2 border-t border-gray-600 pt-2">
                            <p className="text-xs text-gray-400">
                              Requires {multisigConfig.threshold} of{' '}
                              {multisigConfig.signatories.length} signatures •
                              Gas fees apply
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={
                        !selectedVote || isSubmitting || isSigningMultisig
                      }
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
