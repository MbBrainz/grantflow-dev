'use client'

import { AlertTriangle, DollarSign } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface BudgetBarProps {
  totalBudget: number
  allocated: number
  spent: number
  className?: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function BudgetBar({
  totalBudget,
  allocated,
  spent,
  className,
}: BudgetBarProps) {
  // Calculate derived values
  const unpaid = Math.max(0, allocated - spent)
  const unallocated = Math.max(0, totalBudget - allocated)
  const isOverAllocated = allocated > totalBudget
  const overAllocationAmount = isOverAllocated ? allocated - totalBudget : 0

  // Calculate percentages for bar segments
  // When over-allocated, we scale everything relative to allocated amount
  const baseAmount = isOverAllocated ? allocated : totalBudget
  const paidPercent = baseAmount > 0 ? (spent / baseAmount) * 100 : 0
  const unpaidPercent = baseAmount > 0 ? (unpaid / baseAmount) * 100 : 0
  const unallocatedPercent =
    baseAmount > 0 ? (unallocated / baseAmount) * 100 : 0
  const overAllocatedPercent =
    baseAmount > 0 ? (overAllocationAmount / baseAmount) * 100 : 0

  // Empty state - no budget set
  if (totalBudget === 0 && allocated === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-400" />
            <span className="text-lg font-semibold">Budget</span>
          </div>
          <span className="text-muted-foreground text-sm">Not configured</span>
        </div>
        <div className="h-8 w-full rounded-lg bg-gray-100 dark:bg-gray-800" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="text-lg font-semibold">Budget</span>
          <span className="text-muted-foreground text-lg">
            {formatCurrency(totalBudget)}
          </span>
        </div>
        {isOverAllocated && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Over-allocated by {formatCurrency(overAllocationAmount)}
            </span>
          </div>
        )}
      </div>

      {/* Stacked Bar */}
      <div className="relative">
        <div
          className={cn(
            'flex h-10 w-full overflow-hidden rounded-lg',
            totalBudget === 0 && allocated > 0
              ? 'bg-red-100 dark:bg-red-950'
              : 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          {/* Paid segment */}
          {paidPercent > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex h-full cursor-default items-center justify-center bg-emerald-500 transition-all duration-300 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  style={{ width: `${paidPercent}%` }}
                >
                  {paidPercent > 12 && (
                    <span className="truncate px-2 text-xs font-medium text-white">
                      {formatCurrency(spent)}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">Paid: {formatCurrency(spent)}</p>
                  <p className="text-muted-foreground text-xs">
                    Money already disbursed for completed milestones
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Unpaid (committed but not paid) segment */}
          {unpaidPercent > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex h-full cursor-default items-center justify-center transition-all duration-300',
                    isOverAllocated
                      ? 'bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400'
                      : 'bg-blue-400 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400'
                  )}
                  style={{ width: `${unpaidPercent}%` }}
                >
                  {unpaidPercent > 12 && (
                    <span className="truncate px-2 text-xs font-medium text-white">
                      {formatCurrency(unpaid)}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">
                    Committed: {formatCurrency(unpaid)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Allocated to approved grants but not yet paid out
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Over-allocation indicator (red segment) */}
          {isOverAllocated && overAllocatedPercent > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex h-full cursor-default items-center justify-center bg-red-500 transition-all duration-300 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500"
                  style={{ width: `${overAllocatedPercent}%` }}
                >
                  {overAllocatedPercent > 8 && (
                    <AlertTriangle className="h-4 w-4 text-white" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold text-red-600">
                    Over-allocated: {formatCurrency(overAllocationAmount)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    This exceeds your budget. Increase the budget or reduce
                    approved grants.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Unallocated segment (empty space with subtle pattern) */}
          {unallocatedPercent > 0 && !isOverAllocated && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex h-full cursor-default items-center justify-center transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  style={{ width: `${unallocatedPercent}%` }}
                >
                  {unallocatedPercent > 12 && (
                    <span className="text-muted-foreground truncate px-2 text-xs font-medium">
                      {formatCurrency(unallocated)}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">
                    Unallocated: {formatCurrency(unallocated)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Available to allocate to new grant proposals
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Budget boundary marker for over-allocation */}
        {isOverAllocated && totalBudget > 0 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-gray-800 dark:bg-gray-200"
            style={{
              left: `${(totalBudget / allocated) * 100}%`,
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 cursor-default rounded-full bg-gray-800 dark:bg-gray-200" />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  Budget limit: {formatCurrency(totalBudget)}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Legend / Summary */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-emerald-500" />
          <span className="text-muted-foreground">Paid</span>
          <span className="font-medium">{formatCurrency(spent)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-3 w-3 rounded-sm',
              isOverAllocated ? 'bg-amber-400' : 'bg-blue-400'
            )}
          />
          <span className="text-muted-foreground">Committed</span>
          <span className="font-medium">{formatCurrency(unpaid)}</span>
        </div>
        {!isOverAllocated && (
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800" />
            <span className="text-muted-foreground">Unallocated</span>
            <span className="font-medium">{formatCurrency(unallocated)}</span>
          </div>
        )}
        {isOverAllocated && (
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-red-500" />
            <span className="text-muted-foreground">Over budget</span>
            <span className="font-medium text-red-600">
              {formatCurrency(overAllocationAmount)}
            </span>
          </div>
        )}
      </div>

      {/* Allocation summary */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-sm dark:border-gray-700">
        <div>
          <span className="text-muted-foreground">Total Allocated: </span>
          <span
            className={cn('font-semibold', isOverAllocated && 'text-red-600')}
          >
            {formatCurrency(allocated)}
          </span>
          <span className="text-muted-foreground">
            {' '}
            of {formatCurrency(totalBudget)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">
            Available for new grants:{' '}
          </span>
          <span
            className={cn(
              'font-semibold',
              unallocated > 0 ? 'text-emerald-600' : 'text-muted-foreground'
            )}
          >
            {formatCurrency(unallocated)}
          </span>
        </div>
      </div>
    </div>
  )
}
