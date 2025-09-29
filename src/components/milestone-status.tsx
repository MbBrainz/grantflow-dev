'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MilestoneCompletionForm } from './milestone-completion-form'

interface Milestone {
  id: number
  title: string
  description?: string
  amount?: number
  status: string
  dueDate?: string
  submittedAt?: string
  reviewedAt?: string
  deliverables?: string
  githubRepoUrl?: string
  githubPrUrl?: string
  githubCommitHash?: string
}

interface Payout {
  id: number
  amount: number
  transactionHash?: string
  blockExplorerUrl?: string
  status: string
  processedAt?: string
  walletFrom?: string
  walletTo?: string
  triggeredByUser?: {
    id: number
    name: string
    email: string
  }
}

interface MilestoneStatusProps {
  milestone: Milestone
  payouts?: Payout[]
  committeeId: number
  isCommitteeMember?: boolean
  onStatusChange?: () => void
}

export function MilestoneStatus({
  milestone,
  payouts = [],
  committeeId,
  isCommitteeMember = false,
  onStatusChange,
}: MilestoneStatusProps) {
  const [showCompletionForm, setShowCompletionForm] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAmount = (amount?: number) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (date?: string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  const handleCompletionSuccess = () => {
    setShowCompletionForm(false)
    onStatusChange?.()
  }

  const isCompleted = milestone.status === 'completed'
  const hasPayout = payouts.length > 0
  const latestPayout = hasPayout ? payouts[0] : null

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Milestone Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{milestone.title}</h3>
            {milestone.description && (
              <p className="mt-1 text-sm text-gray-600">
                {milestone.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(milestone.status)}>
              {milestone.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {milestone.amount && (
              <Badge variant="outline">{formatAmount(milestone.amount)}</Badge>
            )}
          </div>
        </div>

        {/* Milestone Details */}
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div>
            <span className="font-medium">Due Date:</span>
            <p className="text-gray-600">{formatDate(milestone.dueDate)}</p>
          </div>
          <div>
            <span className="font-medium">Submitted:</span>
            <p className="text-gray-600">{formatDate(milestone.submittedAt)}</p>
          </div>
          <div>
            <span className="font-medium">Reviewed:</span>
            <p className="text-gray-600">{formatDate(milestone.reviewedAt)}</p>
          </div>
        </div>

        {/* GitHub Links */}
        {(milestone.githubRepoUrl ||
          milestone.githubPrUrl ||
          milestone.githubCommitHash) && (
          <div className="rounded-lg bg-gray-50 p-3">
            <h4 className="mb-2 text-sm font-medium">Deliverables</h4>
            <div className="space-y-1 text-sm">
              {milestone.githubRepoUrl && (
                <div>
                  <span className="font-medium">Repository:</span>{' '}
                  <a
                    href={milestone.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {milestone.githubRepoUrl}
                  </a>
                </div>
              )}
              {milestone.githubPrUrl && (
                <div>
                  <span className="font-medium">Pull Request:</span>{' '}
                  <a
                    href={milestone.githubPrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {milestone.githubPrUrl}
                  </a>
                </div>
              )}
              {milestone.githubCommitHash && (
                <div>
                  <span className="font-medium">Commit:</span>{' '}
                  <code className="rounded bg-white px-1 text-xs">
                    {milestone.githubCommitHash.substring(0, 8)}
                  </code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payout Information */}
        {hasPayout && (
          <div className="rounded-lg bg-green-50 p-3">
            <h4 className="mb-2 text-sm font-medium text-green-800">
              Payment Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <span className="font-medium">Amount Paid:</span>
                  <p className="text-green-700">
                    {formatAmount(latestPayout?.amount)}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Processed:</span>
                  <p className="text-green-700">
                    {formatDate(latestPayout?.processedAt)}
                  </p>
                </div>
              </div>

              {latestPayout?.transactionHash && (
                <div>
                  <span className="font-medium">Transaction Hash:</span>
                  <p className="mt-1 rounded bg-white p-1 font-mono text-xs">
                    {latestPayout.transactionHash}
                  </p>
                </div>
              )}

              {latestPayout?.blockExplorerUrl && (
                <div>
                  <span className="font-medium">Block Explorer:</span>{' '}
                  <a
                    href={latestPayout.blockExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Transaction
                  </a>
                </div>
              )}

              {latestPayout?.triggeredByUser && (
                <div>
                  <span className="font-medium">Completed by:</span>
                  <p className="text-green-700">
                    {latestPayout.triggeredByUser.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isCommitteeMember && !isCompleted && !showCompletionForm && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setShowCompletionForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Milestone
            </Button>
          </div>
        )}

        {/* Completion Form */}
        {showCompletionForm && (
          <div className="border-t pt-4">
            <MilestoneCompletionForm
              milestoneId={milestone.id}
              committeeId={committeeId}
              milestoneTitle={milestone.title}
              milestoneAmount={milestone.amount}
              onSuccess={handleCompletionSuccess}
              onCancel={() => setShowCompletionForm(false)}
            />
          </div>
        )}

        {/* Multiple Payouts */}
        {payouts.length > 1 && (
          <div className="border-t pt-4">
            <h4 className="mb-2 text-sm font-medium">Payment History</h4>
            <div className="space-y-2">
              {payouts.slice(1).map((payout, index) => (
                <div key={payout.id} className="rounded bg-gray-50 p-2 text-sm">
                  <div className="flex justify-between">
                    <span>{formatAmount(payout.amount)}</span>
                    <span className="text-gray-500">
                      {formatDate(payout.processedAt)}
                    </span>
                  </div>
                  {payout.blockExplorerUrl && (
                    <a
                      href={payout.blockExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View Transaction
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
