'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
} from 'lucide-react'
import { submitReview } from '@/app/(dashboard)/dashboard/submissions/actions'
import { useToast } from '@/lib/hooks/use-toast'
import { usePolkadot } from '@/components/providers/polkadot-provider'
import type { Milestone } from '@/lib/db/schema'
import type { GroupSettings } from '@/lib/db/schema/jsonTypes/GroupSettings'

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
  const { toast } = useToast()
  const { selectedAccount, isConnected, connectWallet, availableExtensions } =
    usePolkadot()

  // Check if merged workflow is enabled
  const multisigConfig = committeeSettings?.multisig
  const isMergedWorkflow = multisigConfig?.approvalWorkflow === 'merged'

  const deliverables = Array.isArray(milestone.deliverables)
    ? milestone.deliverables
    : []

  const requirements = Array.isArray(milestone.requirements)
    ? milestone.requirements
    : []

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

      // Success - off-chain vote recorded
      toast({
        title: 'Review Submitted',
        description: `Your ${selectedVote} vote has been recorded for this milestone.`,
      })

      // For merged workflow + approve vote, now sign the multisig transaction
      if (
        isMergedWorkflow &&
        selectedVote === 'approve' &&
        multisigConfig &&
        selectedAccount
      ) {
        setIsSigningMultisig(true)
        toast({
          title: 'Blockchain Signature Required',
          description:
            'Please sign the transaction in your wallet to complete the on-chain approval.',
        })

        // TODO: Call multisig signing action here when polkadot-api is fully configured
        // For now, just show a message
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate delay

        toast({
          title: 'Multisig Integration Pending',
          description:
            'Your vote is recorded. Blockchain signing will be available once polkadot-api is configured.',
        })

        setIsSigningMultisig(false)
      }

      // Close dialog and refresh
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
              <Card className="border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Wallet className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">
                      On-Chain Approval Workflow
                    </p>
                    <p className="mt-1 text-sm text-blue-700">
                      This committee uses merged workflow. When you approve this
                      milestone, you&apos;ll be prompted to sign a blockchain
                      transaction with your Polkadot wallet.
                    </p>
                    {!isConnected && (
                      <div className="mt-3">
                        <p className="mb-2 text-sm font-medium text-blue-800">
                          Connect your wallet:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {availableExtensions.length > 0 ? (
                            availableExtensions.map(ext => (
                              <Button
                                key={ext.name}
                                size="sm"
                                variant="outline"
                                onClick={() => connectWallet(ext.name)}
                                className="border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
                              >
                                <Wallet className="mr-2 h-3 w-3" />
                                {ext.name}
                              </Button>
                            ))
                          ) : (
                            <p className="text-sm text-blue-600">
                              No Polkadot wallet extensions detected. Please
                              install Polkadot.js, Talisman, or SubWallet.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {isConnected && selectedAccount && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-700">
                          Connected:{' '}
                          <code className="rounded bg-blue-100 px-1 py-0.5 text-xs">
                            {selectedAccount.address.slice(0, 8)}...
                            {selectedAccount.address.slice(-6)}
                          </code>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Funding Amount</p>
                    <p className="font-semibold">
                      ${(milestone.amount ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-semibold">
                      {milestone.dueDate
                        ? new Date(milestone.dueDate).toLocaleDateString()
                        : 'Not specified'}
                    </p>
                  </div>
                </div>
                {milestone.submittedAt && (
                  <div className="col-span-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Submitted At</p>
                      <p className="font-semibold">
                        {new Date(milestone.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <FileCode className="h-4 w-4" />
                Description
              </h3>
              <Card className="p-4">
                <p className="text-sm whitespace-pre-wrap text-gray-700">
                  {milestone.description}
                </p>
              </Card>
            </div>

            {requirements.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <CheckCircle className="h-4 w-4" />
                  Acceptance Criteria
                </h3>
                <Card className="p-4">
                  <ul className="space-y-2">
                    {requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                        <span className="text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}

            {deliverables.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <GitBranch className="h-4 w-4" />
                  Submitted Deliverables
                </h3>
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
              </div>
            )}

            {(milestone.githubRepoUrl ??
              milestone.githubPrUrl ??
              milestone.githubCommitHash) && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <GitBranch className="h-4 w-4" />
                  Code Repository
                </h3>
                <Card className="p-4">
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
                </Card>
              </div>
            )}

            {milestone.codeAnalysis && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  AI Code Analysis
                </h3>
                <Card className="border-purple-200 bg-purple-50/50 p-4">
                  <p className="text-sm whitespace-pre-wrap text-gray-700">
                    {milestone.codeAnalysis}
                  </p>
                </Card>
              </div>
            )}

            <div className="border-t pt-6">
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
                          <div>
                            <p className="font-medium text-green-900">
                              Approve
                            </p>
                            <p className="text-xs text-green-700">
                              Milestone meets all requirements
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
