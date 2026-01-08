'use client'

import { useState } from 'react'
import {
  completeMilestone,
  validateTransactionHash,
} from '@/app/(dashboard)/dashboard/submissions/milestone-actions'
import AsyncButton from '@/components/ui/async-button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Milestone } from '@/lib/db/schema'
import { useToast } from '@/lib/hooks/use-toast'

interface MilestoneCompletionFormProps {
  milestone: Pick<Milestone, 'id' | 'title' | 'amount'>
  committeeId: number
  onSuccess?: () => void
  onCancel?: () => void
}

export function MilestoneCompletionForm({
  milestone,
  committeeId,
  onSuccess,
  onCancel,
}: MilestoneCompletionFormProps) {
  const [formData, setFormData] = useState({
    transactionHash: '',
    blockExplorerUrl: '',
    amount: milestone.amount ?? 0,
    walletFrom: '',
    walletTo: '',
  })
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = async () => {
    const errors: Record<string, string> = {}

    if (!formData.transactionHash.trim()) {
      errors.transactionHash = 'Transaction hash is required'
    }

    if (!formData.blockExplorerUrl.trim()) {
      errors.blockExplorerUrl = 'Block explorer URL is required'
    } else {
      try {
        new URL(formData.blockExplorerUrl)
      } catch {
        errors.blockExplorerUrl = 'Must be a valid URL'
      }
    }

    if (formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0'
    }

    // Validate transaction hash against explorer URL
    if (formData.transactionHash && formData.blockExplorerUrl) {
      const validation = await validateTransactionHash(
        formData.transactionHash,
        formData.blockExplorerUrl
      )
      if (!validation.valid) {
        errors.transactionHash = validation.error ?? 'Invalid transaction hash'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!(await validateForm())) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the form errors before submitting.',
        variant: 'destructive',
      })
      throw new Error('Please fix the form errors before submitting.')
    }

    try {
      // Call the action with typed data object
      const result = await completeMilestone({
        milestoneId: milestone.id,
        committeeId,
        transactionHash: formData.transactionHash,
        blockExplorerUrl: formData.blockExplorerUrl,
        amount: formData.amount,
        walletFrom: formData.walletFrom || undefined,
        walletTo: formData.walletTo || undefined,
      })

      if ('error' in result && result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
        throw new Error(result.error)
      }

      if ('success' in result && result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'default',
        })
        onSuccess?.()
      }
    } catch (error) {
      console.error('[MilestoneCompletionForm]: Error submitting form', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      throw error // Re-throw for AsyncButton
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Complete Milestone</h3>
          <p className="mt-1 text-sm text-gray-600">
            Mark "{milestone.title}" as completed by providing the multisig
            transaction details.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="transactionHash">Transaction Hash *</Label>
            <Input
              id="transactionHash"
              type="text"
              placeholder="0x1234567890abcdef..."
              value={formData.transactionHash}
              onChange={e =>
                handleInputChange('transactionHash', e.target.value)
              }
              className={
                validationErrors.transactionHash ? 'border-red-500' : ''
              }
            />
            {validationErrors.transactionHash && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors.transactionHash}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="blockExplorerUrl">Block Explorer URL *</Label>
            <Input
              id="blockExplorerUrl"
              type="url"
              placeholder="https://etherscan.io/tx/0x1234..."
              value={formData.blockExplorerUrl}
              onChange={e =>
                handleInputChange('blockExplorerUrl', e.target.value)
              }
              className={
                validationErrors.blockExplorerUrl ? 'border-red-500' : ''
              }
            />
            {validationErrors.blockExplorerUrl && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors.blockExplorerUrl}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Link to the transaction on a block explorer (e.g., Etherscan,
              Polygonscan)
            </p>
          </div>

          <div>
            <Label htmlFor="amount">Payment Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={e =>
                handleInputChange('amount', parseFloat(e.target.value) ?? 0)
              }
              className={validationErrors.amount ? 'border-red-500' : ''}
            />
            {validationErrors.amount && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors.amount}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="walletFrom">From Wallet (Optional)</Label>
              <Input
                id="walletFrom"
                type="text"
                placeholder="Committee wallet address"
                value={formData.walletFrom}
                onChange={e => handleInputChange('walletFrom', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="walletTo">To Wallet (Optional)</Label>
              <Input
                id="walletTo"
                type="text"
                placeholder="Grantee wallet address"
                value={formData.walletTo}
                onChange={e => handleInputChange('walletTo', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <AsyncButton
              onClick={handleSubmit}
              className="flex-1"
              loadingContent="Processing..."
            >
              Complete Milestone
            </AsyncButton>

            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="rounded bg-gray-50 p-3 text-xs text-gray-500">
          <strong>Note:</strong> Only committee members can complete milestones.
          The transaction hash must be from a successful multisig payment to the
          grantee.
        </div>
      </div>
    </Card>
  )
}
