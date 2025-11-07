/**
 * Milestone Voting Panel Component
 *
 * Displays the current multisig approval status for a milestone and provides
 * voting controls for committee members. Shows:
 * - Current approval status and threshold
 * - List of signatories and their votes
 * - Voting buttons for eligible committee members
 * - Transaction execution button when threshold is met
 */

'use client'

import { useEffect, useState } from 'react'
import { useConnect, useConnectors } from '@luno-kit/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  CheckCircle,
  Clock,
  Wallet,
  AlertCircle,
  Loader2,
  XCircle,
} from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { useMultisigApproval } from '@/lib/hooks/use-multisig-approval'
import type { MultisigConfig } from '@/lib/db/schema/jsonTypes/GroupSettings'
import {
  initiateMultisigApproval as initiatePolkadotApproval,
  approveMultisigCall,
  finalizeMultisigCall,
} from '@/lib/polkadot/multisig'
import {
  initiateMultisigApproval,
  castMultisigVote,
  finalizeMultisigApproval,
} from '@/app/(dashboard)/dashboard/submissions/multisig-actions'
import { getSubmissionDetails } from '@/app/(dashboard)/dashboard/submissions/actions'
import { u8aToString } from 'dedot/utils'

interface MilestoneVotingPanelProps {
  multisigConfig: MultisigConfig
  isCommitteeMember: boolean
  userWalletAddress: string
  milestoneId: number
  submissionId: number
  milestoneAmount: number
}

export function MilestoneVotingPanel({
  multisigConfig,
  isCommitteeMember,
  userWalletAddress, // eslint-disable-line @typescript-eslint/no-unused-vars
  milestoneId,
  submissionId,
  milestoneAmount,
}: MilestoneVotingPanelProps) {
  const { toast } = useToast()
  const { connect } = useConnect()
  const connectors = useConnectors()

  const {
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
  } = useMultisigApproval(milestoneId, multisigConfig.network)

  const [isProcessing, setIsProcessing] = useState(false)
  const activeAddress = address?.trim()
  const hasCurrentUserApproved = activeAddress
    ? hasUserVoted(activeAddress)
    : false
  const isSignatory =
    !!activeAddress &&
    multisigConfig.signatories.some(
      signatory => signatory.trim() === activeAddress
    )
  const canExecute =
    !!activeAddress && isSignatory && !!voteCount && voteCount.thresholdMet
  const canApprove =
    !!activeAddress &&
    isSignatory &&
    !!voteCount &&
    !voteCount.thresholdMet &&
    !hasCurrentUserApproved

  // Load approval status on mount and when dialog opens
  useEffect(() => {
    void checkExistingApproval()
  }, [checkExistingApproval])

  const handleInitialApproval = async () => {
    if (!isConnected || !activeAddress || !signer || !client) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your Polkadot wallet to initiate approval',
        variant: 'destructive',
      })
      return
    }

    // Type guard to ensure client is not null
    if (!client) {
      toast({
        title: 'Client not ready',
        description: 'Blockchain client is not initialized',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    try {
      toast({
        title: 'Initiating Multisig Transaction',
        description:
          'Creating new multisig transaction for milestone approval.',
      })

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
        milestoneId,
        payoutAmount: BigInt(milestoneAmount),
        initiatorAddress: activeAddress,
        signer,
        useBatch: true,
        network: multisigConfig.network ?? 'paseo',
      })

      // Record the approval in database
      await initiateMultisigApproval({
        milestoneId,
        timepoint: polkadotResult.timepoint,
        approvalWorkflow: 'separated',
        txHash: polkadotResult.txHash,
        initiatorWalletAddress: activeAddress,
        callHash: polkadotResult.callHash,
        callDataHex: u8aToString(polkadotResult.callData),
      })

      toast({
        title: 'Initial Approval Created',
        description: `Multisig transaction initiated. Transaction hash: ${polkadotResult.txHash.slice(0, 10)}...`,
      })

      // Refresh approval status
      await checkExistingApproval()
    } catch (error) {
      console.error(
        '[MilestoneVotingPanel]: Failed to initiate approval',
        error
      )
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to initiate approval',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApproveVote = async () => {
    if (
      !isConnected ||
      !activeAddress ||
      !signer ||
      !client ||
      !existingApproval
    ) {
      toast({
        title: 'Cannot vote',
        description: 'Wallet not connected or no active approval found',
        variant: 'destructive',
      })
      return
    }

    if (!isSignatory) {
      toast({
        title: 'Not a signatory',
        description:
          'Only configured multisig signatories can approve this transaction.',
        variant: 'destructive',
      })
      return
    }

    // Type guard to ensure client is not null
    if (!client) {
      toast({
        title: 'Client not ready',
        description: 'Blockchain client is not initialized',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    try {
      toast({
        title: 'Adding Your Approval',
        description: 'Adding your signature to the multisig transaction.',
      })

      // Approve the existing multisig call on Polkadot
      const polkadotResult = await approveMultisigCall({
        client,
        callHash: existingApproval.callHash,
        timepoint: existingApproval.timepoint ?? { height: 0, index: 0 },
        threshold: multisigConfig.threshold,
        allSignatories: multisigConfig.signatories,
        approverAddress: activeAddress,
        signer,
        network: multisigConfig.network ?? 'paseo',
      })

      // Record the vote in database
      await castMultisigVote({
        approvalId: existingApproval.id,
        signatoryAddress: activeAddress,
        signatureType: 'signed',
        txHash: polkadotResult.txHash,
      })

      toast({
        title: 'Approval Added',
        description: `Your signature has been added. Transaction hash: ${polkadotResult.txHash.slice(0, 10)}...`,
      })

      // Refresh approval status
      await checkExistingApproval()

      // Check if threshold is met
      if (polkadotResult.thresholdMet) {
        toast({
          title: 'Threshold Met!',
          description:
            'Enough signatures collected. Any signatory can now execute the transaction.',
        })
      }
    } catch (error) {
      console.error('[MilestoneVotingPanel]: Failed to add approval', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to add approval',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExecute = async () => {
    if (
      !isConnected ||
      !activeAddress ||
      !signer ||
      !client ||
      !existingApproval
    ) {
      toast({
        title: 'Cannot execute',
        description: 'Wallet not connected or no active approval found',
        variant: 'destructive',
      })
      return
    }

    if (!isSignatory) {
      toast({
        title: 'Not a signatory',
        description:
          'Only configured multisig signatories can execute this transaction.',
        variant: 'destructive',
      })
      return
    }

    // Type guard to ensure client is not null
    if (!client) {
      toast({
        title: 'Client not ready',
        description: 'Blockchain client is not initialized',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    try {
      toast({
        title: 'Executing Final Transaction',
        description: 'Threshold met! Executing the multisig transaction.',
      })

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

      let callDataBytes = new Uint8Array()
      try {
        const rawCallData = existingApproval.callData?.trim()
        if (rawCallData?.startsWith('[')) {
          callDataBytes = new Uint8Array(JSON.parse(rawCallData) as number[])
        }
      } catch (parseError) {
        console.warn(
          '[MilestoneVotingPanel]: Unable to parse stored call data, falling back to regenerated call',
          parseError
        )
      }

      // Execute the final multisig transaction
      const polkadotResult = await finalizeMultisigCall({
        client,
        callData: callDataBytes,
        threshold: multisigConfig.threshold,
        allSignatories: multisigConfig.signatories,
        executorAddress: activeAddress,
        signer,
        beneficiaryAddress,
        payoutAmount: BigInt(milestoneAmount),
        milestoneId,
        useBatch: true,
        network: multisigConfig.network ?? 'paseo',
      })

      // Finalize the approval in database
      await finalizeMultisigApproval({
        approvalId: existingApproval.id,
        signatoryAddress: activeAddress,
        executionTxHash: polkadotResult.txHash,
        executionBlockNumber: polkadotResult.blockNumber,
      })

      toast({
        title: 'Transaction Executed Successfully!',
        description: `Payment completed. Execution hash: ${polkadotResult.txHash.slice(0, 10)}...`,
      })

      // Refresh approval status
      await checkExistingApproval()
    } catch (error) {
      console.error(
        '[MilestoneVotingPanel]: Failed to execute transaction',
        error
      )
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to execute transaction',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isCommitteeMember) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multisig Approval</CardTitle>
        <CardDescription>
          On-chain multisig approval for milestone payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Connection Section */}
        {!isConnected ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="flex-1">
                <p className="mb-2 text-sm font-medium text-blue-900">
                  Connect Your Wallet
                </p>
                <p className="mb-3 text-xs text-blue-700">
                  To participate in multisig voting, connect your Polkadot
                  wallet.
                </p>
                <div className="flex flex-wrap gap-2">
                  {connectors.length > 0 ? (
                    connectors.map(connector => (
                      <Button
                        key={connector.id}
                        size="sm"
                        variant="outline"
                        onClick={() => connect({ connectorId: connector.id })}
                        className="border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
                      >
                        <Wallet className="mr-2 h-3 w-3" />
                        {connector.name}
                      </Button>
                    ))
                  ) : (
                    <p className="text-xs text-blue-600">
                      No Polkadot wallet extensions detected. Please install
                      Polkadot.js, Talisman, or SubWallet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                Connected:{' '}
                <code className="rounded bg-green-100 px-1 py-0.5 text-xs">
                  {activeAddress?.slice(0, 8)}...{activeAddress?.slice(-6)}
                </code>
              </span>
            </div>
          </div>
        )}

        {/* Approval Status Section */}
        {isConnected && (
          <>
            {isLoadingApproval ? (
              <Card className="border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 animate-spin text-gray-500" />
                  <p className="text-sm text-gray-600">
                    Checking for existing approvals...
                  </p>
                </div>
              </Card>
            ) : approvalError ? (
              <Card className="border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">Error</p>
                    <p className="mt-1 text-sm text-red-700">{approvalError}</p>
                  </div>
                </div>
              </Card>
            ) : existingApproval && voteCount ? (
              <>
                {/* Existing Approval Card */}
                <Card className="border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">
                        Active Multisig Approval
                      </p>
                      <p className="mt-1 text-sm text-blue-700">
                        {voteCount.approvals} of {voteCount.threshold} required
                        signatures collected
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          variant={
                            voteCount.thresholdMet ? 'default' : 'secondary'
                          }
                        >
                          {voteCount.thresholdMet
                            ? 'Ready to Execute'
                            : 'Awaiting Signatures'}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-blue-600">
                        Call Hash: {existingApproval.callHash.slice(0, 16)}...
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                {canExecute ? (
                  <Button
                    onClick={handleExecute}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Execute Transaction
                  </Button>
                ) : canApprove ? (
                  <Button
                    onClick={handleApproveVote}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Approve Transaction
                  </Button>
                ) : (
                  <Card className="border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                      <p className="text-sm text-gray-600">
                        {isSignatory
                          ? 'You have already voted on this approval'
                          : 'The connected wallet is not a multisig signatory'}
                      </p>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <>
                {/* No Active Approval */}
                <Card className="border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">
                        Ready to Initiate Approval
                      </p>
                      <p className="mt-1 text-sm text-green-700">
                        No existing approval found. Start a new multisig
                        transaction for this milestone.
                      </p>
                    </div>
                  </div>
                </Card>

                <Button
                  onClick={handleInitialApproval}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Initiate Multisig Approval
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
