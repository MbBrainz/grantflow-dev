'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useToast } from '@/lib/hooks/use-toast'
import {
  completeMilestone,
  validateTransactionHash,
} from '@/app/(dashboard)/dashboard/submissions/milestone-actions'

interface MilestoneCompletionFormProps {
  milestoneId: number
  committeeId: number
  milestoneTitle: string
  milestoneAmount?: number
  onSuccess?: () => void
  onCancel?: () => void
}

export function MilestoneCompletionForm({
  milestoneId,
  committeeId,
  milestoneTitle,
  milestoneAmount,
  onSuccess,
  onCancel,
}: MilestoneCompletionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    transactionHash: '',
    blockExplorerUrl: '',
    amount: milestoneAmount || 0,
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
        errors.transactionHash = validation.error || 'Invalid transaction hash'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!(await validateForm())) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the form errors before submitting.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append('milestoneId', milestoneId.toString())
      formDataObj.append('committeeId', committeeId.toString())
      formDataObj.append('transactionHash', formData.transactionHash)
      formDataObj.append('blockExplorerUrl', formData.blockExplorerUrl)
      formDataObj.append('amount', formData.amount.toString())
      if (formData.walletFrom)
        formDataObj.append('walletFrom', formData.walletFrom)
      if (formData.walletTo) formDataObj.append('walletTo', formData.walletTo)

      const result = await completeMilestone(formDataObj)

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: result.message || 'Milestone completed successfully!',
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
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Complete Milestone</h3>
          <p className="mt-1 text-sm text-gray-600">
            Mark "{milestoneTitle}" as completed by providing the multisig
            transaction details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
                handleInputChange('amount', parseFloat(e.target.value) || 0)
              }
              className={validationErrors.amount ? 'border-red-500' : ''}
              disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Processing...' : 'Complete Milestone'}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="rounded bg-gray-50 p-3 text-xs text-gray-500">
          <strong>Note:</strong> Only committee members can complete milestones.
          The transaction hash must be from a successful multisig payment to the
          grantee.
        </div>
      </div>
    </Card>
  )
}
