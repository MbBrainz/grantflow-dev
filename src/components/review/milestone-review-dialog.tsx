'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { MetadataGrid } from '@/components/ui/metadata-grid'
import { InfoBox } from '@/components/ui/info-box'
import { MultisigFlowExplanation } from '@/components/milestone/multisig-flow-explanation'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  GitBranch,
  FileCode,
  Calendar,
  Target,
  AlertCircle,
  X,
  Wallet,
  Info,
} from 'lucide-react'
import { submitReview } from '@/app/(dashboard)/dashboard/submissions/actions'
import { useToast } from '@/lib/hooks/use-toast'
import {
  useAccount,
  useApi,
  useConnect,
  useConnectors,
  useSigner,
  useSwitchChain,
} from '@luno-kit/react'
import type { Milestone } from '@/lib/db/schema'
import type { GroupSettings } from '@/lib/db/schema/jsonTypes/GroupSettings'
import {
  initiateMultisigApproval,
  castMultisigVote,
  finalizeMultisigApproval,
  getMilestoneApprovalStatus,
} from '@/app/(dashboard)/dashboard/submissions/multisig-actions'
import { getSubmissionDetails } from '@/app/(dashboard)/dashboard/submissions/actions'
import {
  initiateMultisigApproval as initiatePolkadotApproval,
  approveMultisigCall,
  finalizeMultisigCall,
} from '@/lib/polkadot/multisig'
import { chains } from '@/lib/polkadot/chains'
import { u8aToHex } from 'dedot/utils'

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
  } | null>(null)
  const [isLoadingApproval, setIsLoadingApproval] = useState(false)
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
        setExistingApproval({
          ...approvalStatus.approval,
          callData:
            (approvalStatus.approval as { callData?: string }).callData ?? '',
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

  // Check for existing approval when dialog opens
  useEffect(() => {
    if (open) {
      if (isMergedWorkflow) {
        void checkExistingApproval()
      }
    }
  }, [open, isMergedWorkflow, checkExistingApproval])

  const handleMultisigApproval = async () => {
    if (!account || !address || !multisigConfig) {
      console.error(
        '[MilestoneReviewDialog]: Missing account or multisig config'
      )
      throw new Error('Missing account or multisig configuration')
    }

    setIsSigningMultisig(true)

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

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      const isWasmError =
        errorMessage.includes('wasm trap') ||
        errorMessage.includes('unreachable')

      toast({
        title: isWasmError ? 'Blockchain Transaction Failed' : 'Multisig Error',
        description: isWasmError
          ? 'Transaction validation failed. Please ensure your account has Paseo testnet tokens from https://faucet.polkadot.io/paseo'
          : errorMessage.length > 200
            ? `${errorMessage.substring(0, 200)}...`
            : errorMessage,
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
      // Create Polkadot multisig transaction
      const polkadotResult = await initiatePolkadotApproval({
        client,
        multisigConfig,
        milestoneId: milestone.id,
        payoutAmount: BigInt(milestone.amount ?? 0),
        initiatorAddress: address,
        signer: selectedSigner,
        useBatch: true,
        network: multisigConfig.network ?? 'paseo', // Use network from config
      })

      // Record the approval in database
      console.log('[MilestoneReviewDialog]: Recording approval in database', {
        milestoneId: milestone.id,
        timepoint: polkadotResult.timepoint,
        approvalWorkflow: 'merged',
        txHash: polkadotResult.txHash,
        initiatorWalletAddress: address,
        callHash: polkadotResult.callHash,
        callDataHex: u8aToHex(polkadotResult.callData),
      })
      await initiateMultisigApproval({
        milestoneId: milestone.id,
        timepoint: polkadotResult.timepoint,
        approvalWorkflow: 'merged',
        txHash: polkadotResult.txHash,
        initiatorWalletAddress: address,
        callHash: polkadotResult.callHash,
        callDataHex: u8aToHex(polkadotResult.callData),
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

    toast({
      title: 'Adding Your Approval',
      description:
        'Adding your signature to the existing multisig transaction.',
    })

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
      // Approve the existing multisig call on Polkadot
      const polkadotResult = await approveMultisigCall({
        client,
        callHash: existingApproval.callHash,
        timepoint: existingApproval.timepoint,
        threshold: multisigConfig.threshold,
        allSignatories: multisigConfig.signatories,
        approverAddress: address,
        signer: selectedSigner,
        network: multisigConfig.network ?? 'paseo', // Use network from config
      })

      // Record the vote in database
      await castMultisigVote({
        approvalId: existingApproval.id,
        signatoryAddress: address,
        signatureType: 'signed',
        txHash: polkadotResult.txHash,
      })

      toast({
        title: 'Approval Added',
        description: `Your signature has been added. Transaction hash: ${polkadotResult.txHash.slice(0, 10)}...`,
      })

      // Check if threshold is met and we need to finalize
      if (polkadotResult.thresholdMet) {
        await handleFinalApproval()
      }
    } catch (error) {
      console.error('[MilestoneReviewDialog]: Failed to add approval', error)
      throw error
    }
  }

  const handleFinalApproval = async () => {
    console.log(
      '[MilestoneReviewDialog]: Handling final approval - executing transaction'
    )

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

    toast({
      title: 'Executing Final Transaction',
      description: 'Threshold met! Executing the multisig transaction.',
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

      // Execute the final multisig transaction
      const polkadotResult = await finalizeMultisigCall({
        client,
        callData: new Uint8Array(
          JSON.parse(existingApproval.callData) as number[]
        ),
        threshold: multisigConfig.threshold,
        allSignatories: multisigConfig.signatories,
        executorAddress: address,
        signer: selectedSigner,
        beneficiaryAddress,
        payoutAmount: BigInt(milestone.amount ?? 0),
        milestoneId: milestone.id,
        useBatch: true,
        network: multisigConfig.network ?? 'paseo', // Use network from config
      })

      // Finalize the approval in database
      await finalizeMultisigApproval({
        approvalId: existingApproval.id,
        signatoryAddress: address,
        executionTxHash: polkadotResult.txHash,
        executionBlockNumber: polkadotResult.blockNumber,
      })

      toast({
        title: 'Transaction Executed Successfully!',
        description: `Payment completed. Execution hash: ${polkadotResult.txHash.slice(0, 10)}...`,
      })
    } catch (error) {
      console.error(
        '[MilestoneReviewDialog]: Failed to execute final approval',
        error
      )
      throw error
    }
  }

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
          // Multisig failed - don't proceed with review submission
          console.error(
            '[MilestoneReviewDialog]: Multisig transaction failed',
            multisigError
          )

          toast({
            title: 'Blockchain Transaction Failed',
            description: 'The blockchain transaction failed. Please try again.',
            variant: 'destructive',
          })

          // Don't submit review - keep dialog open for retry
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
              {/* Multisig Flow Explanation for Merged Workflow */}
              {isMergedWorkflow &&
                multisigConfig &&
                isConnected &&
                !isLoadingApproval && (
                  <div className="mb-6">
                    <MultisigFlowExplanation
                      currentStep={
                        existingApproval
                          ? selectedVote === 'approve'
                            ? 'approve'
                            : null
                          : selectedVote === 'approve'
                            ? 'initiate'
                            : null
                      }
                      threshold={multisigConfig.threshold}
                      currentApprovals={0} // Would need to fetch this if available
                      totalSignatories={multisigConfig.signatories.length}
                    />
                  </div>
                )}

              {/* Existing Approval Status */}
              {isMergedWorkflow && (
                <div className="mb-6">
                  {isLoadingApproval ? (
                    <Card className="border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <p className="text-sm text-gray-600">
                          Checking for existing multisig approvals...
                        </p>
                      </div>
                    </Card>
                  ) : existingApproval ? (
                    <Card className="border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium text-blue-900">
                            Existing Multisig Transaction Found
                          </p>
                          <p className="mt-1 text-sm text-blue-700">
                            There&apos;s already an active multisig transaction
                            for this milestone. If you approve, your signature
                            will be added to the existing transaction.
                          </p>
                          <div className="mt-2 text-xs text-blue-600">
                            Call Hash: {existingApproval?.callHash ?? 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="border-green-200 bg-green-50 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <p className="font-medium text-green-900">
                            Ready to Create New Multisig Transaction
                          </p>
                          <p className="mt-1 text-sm text-green-700">
                            No existing approval found. If you approve, a new
                            multisig transaction will be created on the
                            blockchain.
                          </p>
                        </div>
                      </div>
                    </Card>
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
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 rounded-lg border border-green-200 bg-green-50 p-3 hover:bg-green-100">
                        <RadioGroupItem value="approve" id="approve" />
                        <Label
                          htmlFor="approve"
                          className="flex flex-1 cursor-pointer items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-green-900">
                                Approve
                              </p>
                              {isMergedWorkflow && multisigConfig && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-green-600" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <div className="space-y-1">
                                      <p className="font-semibold">
                                        On-Chain Approval Required
                                      </p>
                                      <p className="text-xs">
                                        Approving will create or add to a
                                        multisig transaction on the blockchain.
                                        This requires {multisigConfig.threshold}{' '}
                                        of {multisigConfig.signatories.length}{' '}
                                        signatures before payment can be
                                        executed.
                                      </p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <p className="text-xs text-green-700">
                              Milestone meets all requirements
                              {isMergedWorkflow &&
                                multisigConfig &&
                                isConnected &&
                                (existingApproval
                                  ? '. Your signature will be added to the existing transaction.'
                                  : '. This will create a new multisig transaction.')}
                            </p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 rounded-lg border border-red-200 bg-red-50 p-3 hover:bg-red-100">
                        <RadioGroupItem value="reject" id="reject" />
                        <Label
                          htmlFor="reject"
                          className="flex flex-1 cursor-pointer items-center gap-2"
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                          <div>
                            <p className="font-medium text-red-900">Reject</p>
                            <p className="text-xs text-red-700">
                              Milestone needs significant changes
                            </p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 hover:bg-yellow-100">
                        <RadioGroupItem value="abstain" id="abstain" />
                        <Label
                          htmlFor="abstain"
                          className="flex flex-1 cursor-pointer items-center gap-2"
                        >
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <div>
                            <p className="font-medium text-yellow-900">
                              Abstain
                            </p>
                            <p className="text-xs text-yellow-700">
                              Cannot make a decision at this time
                            </p>
                          </div>
                        </Label>
                      </div>
                    </div>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={
                          !selectedVote || isSubmitting || isSigningMultisig
                        }
                      >
                        {isSigningMultisig
                          ? 'Signing Transaction...'
                          : isSubmitting
                            ? 'Submitting Review...'
                            : 'Submit Review'}
                      </Button>
                    </TooltipTrigger>
                    {isMergedWorkflow &&
                      selectedVote === 'approve' &&
                      multisigConfig && (
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold">What Happens Next</p>
                            <p className="text-xs">
                              {existingApproval
                                ? 'Your signature will be added to the existing multisig transaction (multisig.approve_as_multi), then your review vote will be recorded.'
                                : 'A new multisig transaction will be created (multisig.as_multi_threshold_1), then your review vote will be recorded.'}
                            </p>
                            <p className="mt-2 text-xs font-medium">
                              Requires {multisigConfig.threshold} signatures to
                              execute payment
                            </p>
                          </div>
                        </TooltipContent>
                      )}
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
