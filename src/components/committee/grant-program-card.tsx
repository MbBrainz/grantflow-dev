'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Edit2,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Target,
  Layers,
} from 'lucide-react'

interface ProgramFinancials {
  programId: number
  totalBudget: number
  allocated: number
  spent: number
  remaining: number
  available: number
}

interface GrantProgram {
  id: number
  name: string
  description: string | null
  fundingAmount: number | null
  minGrantSize: number | null
  maxGrantSize: number | null
  minMilestoneSize: number | null
  maxMilestoneSize: number | null
  isActive: boolean
}

type CardVariant = 'full' | 'compact' | 'selection'

interface GrantProgramCardProps {
  program: GrantProgram
  financials?: ProgramFinancials | null
  variant?: CardVariant
  isEditing?: boolean
  showAdminActions?: boolean
  onClick?: () => void
  editState?: {
    name: string
    description: string
    fundingAmount: string
    minGrantSize: string
    maxGrantSize: string
    minMilestoneSize: string
    maxMilestoneSize: string
    onNameChange: (value: string) => void
    onDescriptionChange: (value: string) => void
    onFundingAmountChange: (value: string) => void
    onMinGrantSizeChange: (value: string) => void
    onMaxGrantSizeChange: (value: string) => void
    onMinMilestoneSizeChange: (value: string) => void
    onMaxMilestoneSizeChange: (value: string) => void
  }
  onEdit?: () => void
  onSave?: () => void
  onCancel?: () => void
  onToggleStatus?: () => void
  focusAreas?: string[]
  committee?: {
    name: string
    logoUrl?: string | null
  }
}

export function GrantProgramCard({
  program,
  financials,
  variant = 'full',
  isEditing = false,
  showAdminActions = false,
  onClick,
  editState,
  onEdit,
  onSave,
  onCancel,
  onToggleStatus,
  focusAreas,
  committee,
}: GrantProgramCardProps) {
  const hasFinancials =
    financials &&
    (financials.totalBudget > 0 ||
      financials.allocated > 0 ||
      financials.spent > 0)

  if (isEditing && editState) {
    return (
      <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <div>
          <Label htmlFor={`edit-name-${program.id}`}>Program Name</Label>
          <Input
            id={`edit-name-${program.id}`}
            value={editState.name}
            onChange={e => editState.onNameChange(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`edit-desc-${program.id}`}>Description</Label>
          <Textarea
            id={`edit-desc-${program.id}`}
            value={editState.description}
            onChange={e => editState.onDescriptionChange(e.target.value)}
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor={`edit-funding-${program.id}`}>
            Total Program Budget (USD)
          </Label>
          <Input
            id={`edit-funding-${program.id}`}
            type="number"
            min="0"
            step="1000"
            value={editState.fundingAmount}
            onChange={e => editState.onFundingAmountChange(e.target.value)}
            placeholder="100000"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`edit-min-grant-${program.id}`}>
              Min Grant per Submission (USD)
            </Label>
            <Input
              id={`edit-min-grant-${program.id}`}
              type="number"
              min="0"
              step="100"
              value={editState.minGrantSize}
              onChange={e => editState.onMinGrantSizeChange(e.target.value)}
              placeholder="1000"
            />
          </div>
          <div>
            <Label htmlFor={`edit-max-grant-${program.id}`}>
              Max Grant per Submission (USD)
            </Label>
            <Input
              id={`edit-max-grant-${program.id}`}
              type="number"
              min="0"
              step="100"
              value={editState.maxGrantSize}
              onChange={e => editState.onMaxGrantSizeChange(e.target.value)}
              placeholder="10000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`edit-min-milestone-${program.id}`}>
              Min per Milestone (USD)
            </Label>
            <Input
              id={`edit-min-milestone-${program.id}`}
              type="number"
              min="0"
              step="100"
              value={editState.minMilestoneSize}
              onChange={e => editState.onMinMilestoneSizeChange(e.target.value)}
              placeholder="500"
            />
          </div>
          <div>
            <Label htmlFor={`edit-max-milestone-${program.id}`}>
              Max per Milestone (USD)
            </Label>
            <Input
              id={`edit-max-milestone-${program.id}`}
              type="number"
              min="0"
              step="100"
              value={editState.maxMilestoneSize}
              onChange={e => editState.onMaxMilestoneSizeChange(e.target.value)}
              placeholder="5000"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onSave} size="sm">
            Save
          </Button>
          <Button onClick={onCancel} variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // Selection variant - for choosing a program
  if (variant === 'selection') {
    return (
      <button
        onClick={onClick}
        className="group relative w-full rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {program.name}
              </h3>
              {committee && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  by {committee.name}
                </p>
              )}
            </div>
            <Badge variant={program.isActive ? 'default' : 'secondary'}>
              {program.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {program.description && (
            <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
              {program.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {program.fundingAmount && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              >
                <DollarSign className="mr-1 h-3 w-3" />$
                {(program.fundingAmount / 1000).toFixed(0)}k available
              </Badge>
            )}
            {(program.minGrantSize !== null ||
              program.maxGrantSize !== null) && (
              <Badge variant="outline" className="text-xs">
                <Target className="mr-1 h-3 w-3" />
                {program.minGrantSize && program.maxGrantSize
                  ? `$${(program.minGrantSize / 1000).toFixed(0)}k-$${(program.maxGrantSize / 1000).toFixed(0)}k per grant`
                  : program.minGrantSize
                    ? `Min $${(program.minGrantSize / 1000).toFixed(0)}k`
                    : `Max $${(program.maxGrantSize! / 1000).toFixed(0)}k`}
              </Badge>
            )}
            {focusAreas?.slice(0, 3).map((area, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {area}
              </Badge>
            ))}
            {focusAreas && focusAreas.length > 3 && (
              <span className="text-xs text-gray-500">
                +{focusAreas.length - 3} more
              </span>
            )}
          </div>
        </div>
      </button>
    )
  }

  // Compact variant - for lists
  if (variant === 'compact') {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{program.name}</h3>
              <Badge
                variant={program.isActive ? 'default' : 'secondary'}
                className="text-xs"
              >
                {program.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {program.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {program.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm">
              {hasFinancials && financials && (
                <>
                  <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      ${financials.totalBudget.toLocaleString()}
                    </span>
                    <span className="text-gray-500">budget</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">
                      ${financials.allocated.toLocaleString()}
                    </span>
                    <span className="text-gray-500">allocated</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {showAdminActions && (
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleStatus}
                className={
                  program.isActive
                    ? 'text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                    : 'text-green-600 hover:bg-green-50 hover:text-green-700'
                }
              >
                {program.isActive ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Full variant - detailed view
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {program.name}
              </h2>
              <Badge variant={program.isActive ? 'default' : 'secondary'}>
                {program.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {program.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {program.description}
              </p>
            )}
          </div>

          {showAdminActions && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleStatus}
                className={`flex items-center gap-2 ${
                  program.isActive
                    ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                    : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                {program.isActive ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Grant Constraints */}
      {(program.minGrantSize !== null ||
        program.maxGrantSize !== null ||
        program.minMilestoneSize !== null ||
        program.maxMilestoneSize !== null) && (
        <div className="border-b border-gray-200 bg-blue-50/50 px-6 py-4 dark:border-gray-700 dark:bg-blue-900/10">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold tracking-wide text-blue-900 uppercase dark:text-blue-300">
              Grant Limits
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(program.minGrantSize !== null ||
              program.maxGrantSize !== null) && (
              <div className="flex items-start gap-3 rounded-lg bg-white p-3 dark:bg-gray-800/50">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Per Submission
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {program.minGrantSize !== null &&
                    program.maxGrantSize !== null
                      ? `$${program.minGrantSize.toLocaleString()} - $${program.maxGrantSize.toLocaleString()}`
                      : program.minGrantSize !== null
                        ? `Min $${program.minGrantSize.toLocaleString()}`
                        : `Max $${program.maxGrantSize!.toLocaleString()}`}
                  </p>
                </div>
              </div>
            )}
            {(program.minMilestoneSize !== null ||
              program.maxMilestoneSize !== null) && (
              <div className="flex items-start gap-3 rounded-lg bg-white p-3 dark:bg-gray-800/50">
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                  <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Per Milestone
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {program.minMilestoneSize !== null &&
                    program.maxMilestoneSize !== null
                      ? `$${program.minMilestoneSize.toLocaleString()} - $${program.maxMilestoneSize.toLocaleString()}`
                      : program.minMilestoneSize !== null
                        ? `Min $${program.minMilestoneSize.toLocaleString()}`
                        : `Max $${program.maxMilestoneSize!.toLocaleString()}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Financial Metrics */}
      {hasFinancials && financials && (
        <div className="px-6 py-5">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <div className="rounded-lg bg-gray-100 p-1.5 dark:bg-gray-700">
                  <DollarSign className="h-4 w-4" />
                </div>
                <span>Total Budget</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${financials.totalBudget.toLocaleString()}
              </p>
              {financials.totalBudget > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ${financials.remaining.toLocaleString()} remaining
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/30">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Allocated</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${financials.allocated.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {financials.totalBudget > 0
                  ? `${((financials.allocated / financials.totalBudget) * 100).toFixed(1)}% of budget`
                  : 'Approved grants'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <div className="rounded-lg bg-green-100 p-1.5 dark:bg-green-900/30">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span>Paid Out</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${financials.spent.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {financials.allocated > 0
                  ? `${((financials.spent / financials.allocated) * 100).toFixed(1)}% disbursed`
                  : 'Completed milestones'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
