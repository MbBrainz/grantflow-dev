/**
 * Multisig Flow Explanation Component
 *
 * Provides clear visual explanation of the multisig transaction workflow:
 * 1. Initiate - First vote creates on-chain transaction
 * 2. Approve - Subsequent votes add signatures
 * 3. Execute - Final vote executes when threshold is met
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  CheckCircle,
  Circle,
  Info,
  ArrowRight,
  Wallet,
  Users,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultisigFlowExplanationProps {
  currentStep: 'initiate' | 'approve' | 'execute' | null
  threshold: number
  currentApprovals: number
  totalSignatories: number
  className?: string
}

interface StepInfo {
  id: 'initiate' | 'approve' | 'execute'
  title: string
  description: string
  blockchainAction: string
  whatHappens: string[]
  icon: React.ReactNode
}

export function MultisigFlowExplanation({
  currentStep,
  threshold,
  currentApprovals,
  totalSignatories,
  className,
}: MultisigFlowExplanationProps) {
  const [showDetails, setShowDetails] = useState(false)

  const steps: StepInfo[] = [
    {
      id: 'initiate',
      title: '1. Initiate Transaction',
      description: 'First vote creates the on-chain multisig transaction',
      blockchainAction: 'multisig.as_multi_threshold_1',
      whatHappens: [
        'Creates a new multisig transaction on the blockchain',
        'Records the transaction hash and call data',
        'Your signature is automatically included',
        'Other signatories can now add their approvals',
      ],
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      id: 'approve',
      title: '2. Add Approvals',
      description: 'Subsequent votes add signatures to the transaction',
      blockchainAction: 'multisig.approve_as_multi',
      whatHappens: [
        'Adds your signature to the existing transaction',
        'Each approval brings the transaction closer to execution',
        'Transaction remains pending until threshold is met',
        'You can only approve once per transaction',
      ],
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: 'execute',
      title: '3. Execute Transaction',
      description: 'Final step executes the payment when threshold is met',
      blockchainAction: 'multisig.as_multi',
      whatHappens: [
        'Executes the payment to the grantee wallet',
        'Requires threshold number of signatures to be collected',
        'Any signatory can execute once threshold is met',
        'Transaction is finalized and cannot be reversed',
      ],
      icon: <Zap className="h-5 w-5" />,
    },
  ]

  const getStepStatus = (stepId: string) => {
    if (!currentStep) return 'pending'
    if (stepId === 'initiate' && currentStep === 'initiate') return 'current'
    if (stepId === 'initiate' && currentStep !== 'initiate') return 'completed'
    if (stepId === 'approve' && currentStep === 'approve') return 'current'
    if (stepId === 'approve' && currentStep === 'execute') return 'completed'
    if (stepId === 'approve' && currentStep === 'initiate') return 'pending'
    if (stepId === 'execute' && currentStep === 'execute') return 'current'
    if (stepId === 'execute' && currentStep !== 'execute') return 'pending'
    return 'pending'
  }

  return (
    <>
      <Card className={cn('border-blue-200 bg-blue-50 p-4', className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                Multisig Transaction Flow
              </h3>
            </div>
            <p className="mb-4 text-sm text-blue-700">
              This milestone payment requires {threshold} of {totalSignatories}{' '}
              signatures. The transaction goes through three stages:
            </p>

            {/* Progress Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id)
                const isCurrent = status === 'current'
                const isCompleted = status === 'completed'
                const isPending = status === 'pending'

                return (
                  <div key={step.id} className="relative">
                    <div
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                        isCurrent && 'border-blue-400 bg-blue-100',
                        isCompleted && 'border-green-300 bg-green-50',
                        isPending && 'border-gray-200 bg-white'
                      )}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : isCurrent ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-600">
                            <Circle className="h-3 w-3 fill-white" />
                          </div>
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={cn(
                              'text-sm font-medium',
                              isCurrent && 'text-blue-900',
                              isCompleted && 'text-green-900',
                              isPending && 'text-gray-600'
                            )}
                          >
                            {step.title}
                          </h4>
                          {isCurrent && (
                            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                              Current Step
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            'mt-1 text-xs',
                            isCurrent && 'text-blue-700',
                            isCompleted && 'text-green-700',
                            isPending && 'text-gray-500'
                          )}
                        >
                          {step.description}
                        </p>
                        {step.id === 'approve' && currentStep === 'approve' && (
                          <div className="mt-2 rounded bg-blue-200 px-2 py-1 text-xs font-medium text-blue-900">
                            {currentApprovals} of {threshold} signatures
                            collected
                          </div>
                        )}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="absolute top-full left-6 z-10 flex h-3 w-3 items-center justify-center">
                        <ArrowRight className="h-4 w-4 rotate-90 text-gray-400" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="mt-4 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Info className="mr-2 h-4 w-4" />
              Learn More About Each Step
            </Button>
          </div>
        </div>
      </Card>

      {/* Detailed Explanation Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Understanding Multisig Transactions</DialogTitle>
            <DialogDescription>
              Learn how the multisig approval process works on the blockchain
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {steps.map(step => {
              const status = getStepStatus(step.id)
              const isCurrent = status === 'current'
              const isCompleted = status === 'completed'

              return (
                <Card
                  key={step.id}
                  className={cn(
                    'border p-4',
                    isCurrent && 'border-blue-300 bg-blue-50',
                    isCompleted && 'border-green-300 bg-green-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'rounded-lg p-2',
                        isCurrent && 'bg-blue-100 text-blue-600',
                        isCompleted && 'bg-green-100 text-green-600',
                        !isCurrent &&
                          !isCompleted &&
                          'bg-gray-100 text-gray-600'
                      )}
                    >
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2 font-semibold">{step.title}</h3>
                      <p className="mb-3 text-sm text-gray-700">
                        {step.description}
                      </p>

                      <div className="mb-3 rounded bg-gray-100 p-2">
                        <p className="text-xs font-medium text-gray-600">
                          Blockchain Action:
                        </p>
                        <code className="text-xs text-gray-800">
                          {step.blockchainAction}
                        </code>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-medium text-gray-600">
                          What happens when you click:
                        </p>
                        <ul className="space-y-1">
                          {step.whatHappens.map((item, itemIndex) => (
                            <li
                              key={itemIndex}
                              className="flex items-start gap-2 text-xs text-gray-700"
                            >
                              <span className="mt-1 text-blue-600">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}

            <Card className="border-yellow-200 bg-yellow-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-yellow-900">
                <Info className="h-4 w-4" />
                Important Notes
              </h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    Each step creates a blockchain transaction that requires gas
                    fees
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    Once a transaction is initiated, it cannot be cancelled
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    Execution requires {threshold} signatures - make sure enough
                    signatories have approved
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    Any signatory can execute the transaction once the threshold
                    is met
                  </span>
                </li>
              </ul>
            </Card>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowDetails(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Compact tooltip version for inline use
 */
export function MultisigFlowTooltip({
  threshold,
  currentApprovals,
  totalSignatories,
  children,
}: {
  threshold: number
  currentApprovals: number
  totalSignatories: number
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-2">
          <p className="font-semibold">Multisig Transaction Flow</p>
          <p className="text-xs">
            Requires {threshold} of {totalSignatories} signatures. Progress:{' '}
            {currentApprovals}/{threshold}
          </p>
          <p className="text-xs text-gray-300">
            1. Initiate → 2. Approve → 3. Execute
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
