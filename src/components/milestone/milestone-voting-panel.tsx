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
import { useAccount, useApi, useSigner, useSwitchChain } from '@luno-kit/react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { initiateMultisigApproval } from '@/lib/polkadot/multisig'
import type { MultisigConfig } from '@/lib/db/schema/jsonTypes/GroupSettings'

interface MilestoneVotingPanelProps {
  multisigConfig: MultisigConfig
  isCommitteeMember: boolean
  userWalletAddress: string
  milestoneId: number
}

export function MilestoneVotingPanel({
  multisigConfig,
  isCommitteeMember,
  userWalletAddress, // eslint-disable-line @typescript-eslint/no-unused-vars
  milestoneId,
}: MilestoneVotingPanelProps) {
  const { account, address } = useAccount()
  const { data: signer } = useSigner()
  const { api: client } = useApi()
  const { toast } = useToast()
  const { switchChain, currentChainId } = useSwitchChain()

  useEffect(() => {
    if (currentChainId !== multisigConfig.network) {
      switchChain({ chainId: multisigConfig.network })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multisigConfig.network, currentChainId])

  // Derive connection state
  const isConnected = !!account && !!address
  const selectedSigner = signer

  const [isInitiating, setIsInitiating] = useState(false)
  const _approvalStatus = null // TODO: Implement approval status fetching
  const _isLoadingStatus = true // TODO: Load actual status

  // Load approval status on mount
  // TODO: Implement this with a server action to fetch current status
  // useEffect(() => {
  //   loadApprovalStatus()
  // }, [milestoneId])

  const handleInitiateApproval = async () => {
    if (!account || !address || !selectedSigner || !client) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your Polkadot wallet to initiate approval',
        variant: 'destructive',
      })
      return
    }

    if (!isCommitteeMember) {
      toast({
        title: 'You are not a committee member',
        description:
          'Please contact the administrator to be added to the committee',
        variant: 'destructive',
      })
      return
    }

    setIsInitiating(true)
    try {
      const result = await initiateMultisigApproval({
        client,
        multisigConfig,
        milestoneId,
        initiatorAddress: address,
        signer: selectedSigner,
        useBatch: true,
        payoutAmount: 0n,
      })
      console.log(
        '[handleInitiateApproval]: multisig initiation result:',
        JSON.stringify(result, null, 2)
      )

      // debug logger that this isn't implemented yet
      console.log('[handleInitiateApproval]: Not yet implemented')

      toast({
        title: 'Not yet implemented',
        description:
          'Polkadot API integration is pending. See implementation TODOs.',
        variant: 'destructive',
      })
    } catch (error: unknown) {
      console.error(
        '[milestone-voting-panel]: Failed to initiate approval',
        error
      )
      toast({
        title: 'Error',
        description: 'Failed to initiate approval. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsInitiating(false)
    }
  }

  if (!isCommitteeMember) {
    return null
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multisig Approval</CardTitle>
          <CardDescription>
            Connect your Polkadot wallet to participate in multisig approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Please connect your Polkadot wallet using the wallet selector in the
            header.
          </p>
        </CardContent>
      </Card>
    )
  }

  // TODO: Implement approval status loading and display
  // For now, show a simplified interface
  return (
    <Card>
      <CardHeader>
        <CardTitle>Multisig Approval</CardTitle>
        <CardDescription>
          On-chain multisig approval for milestone payment (Coming Soon)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-muted-foreground mb-4 text-sm">
            The Polkadot multisig integration is ready for implementation. Once
            the Polkadot API is fully configured, you&apos;ll be able to:
          </p>
          <ul className="text-muted-foreground mx-auto max-w-md space-y-1 text-left text-xs">
            <li>• Initiate multisig approval for milestone payments</li>
            <li>• Vote to approve or reject payments</li>
            <li>• Execute payments once threshold is met</li>
            <li>• View real-time voting status on-chain</li>
          </ul>
        </div>

        <Button
          onClick={handleInitiateApproval}
          disabled={isInitiating}
          className="w-full"
          variant="outline"
        >
          {isInitiating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Initiate Approval (Demo)
        </Button>
      </CardContent>
    </Card>
  )
}
