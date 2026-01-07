'use client'

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  GitBranch,
  Pause,
  Send,
  Target,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Milestone, Submission } from '@/lib/db/schema'

interface MilestoneStatusOverviewProps {
  submission: Pick<Submission, 'id' | 'title' | 'status' | 'submitterId'> & {
    milestones: Pick<
      Milestone,
      | 'id'
      | 'title'
      | 'description'
      | 'status'
      | 'amount'
      | 'dueDate'
      | 'deliverables'
      | 'githubRepoUrl'
      | 'submittedAt'
      | 'reviewedAt'
      | 'createdAt'
    >[]
  }
  currentUserId?: number | null
  onSubmitMilestone?: (milestoneId: number) => void
  className?: string
}

function getMilestoneStatusInfo(milestone: Pick<Milestone, 'status'>) {
  switch (milestone.status) {
    case 'pending':
      return {
        icon: <Pause className="h-4 w-4" />,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        bgColor: 'bg-gray-50',
        description: 'Waiting to start',
        actionRequired: false,
      }
    case 'rejected':
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'bg-red-100 text-red-800 border-red-200',
        bgColor: 'bg-red-50',
        description:
          'Submission rejected - please review feedback and resubmit',
        actionRequired: true,
      }
    case 'in-review':
      return {
        icon: <FileText className="h-4 w-4" />,
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        bgColor: 'bg-purple-50',
        description: 'Submitted for review',
        actionRequired: true,
      }
    case 'completed':
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'bg-green-100 text-green-800 border-green-200',
        bgColor: 'bg-green-50',
        description: 'Completed & approved',
        actionRequired: false,
      }
    default:
      return {
        icon: <Target className="h-4 w-4" />,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        bgColor: 'bg-gray-50',
        description: 'Unknown status',
        actionRequired: false,
      }
  }
}

function getCurrentActiveStep(
  milestones: Pick<
    Milestone,
    | 'id'
    | 'title'
    | 'description'
    | 'status'
    | 'amount'
    | 'dueDate'
    | 'deliverables'
    | 'githubRepoUrl'
    | 'submittedAt'
    | 'reviewedAt'
    | 'createdAt'
  >[]
) {
  // Find the first non-completed milestone
  // Include rejected milestones as they need action (resubmission)
  const activeMilestone = milestones.find(m => m.status !== 'completed')

  if (activeMilestone) {
    const statusInfo = getMilestoneStatusInfo(activeMilestone)
    return {
      milestone: activeMilestone,
      ...statusInfo,
    }
  }

  // All milestones completed
  const completedCount = milestones.filter(m => m.status === 'completed').length
  if (completedCount === milestones.length && milestones.length > 0) {
    return {
      milestone: null,
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800 border-green-200',
      bgColor: 'bg-green-50',
      description: 'All milestones completed!',
      actionRequired: false,
    }
  }

  return null
}

export function MilestoneStatusOverview({
  submission,
  currentUserId = null,
  onSubmitMilestone,
  className = '',
}: MilestoneStatusOverviewProps) {
  const milestones = submission.milestones ?? []
  const isGrantee = currentUserId && submission.submitterId === currentUserId

  if (milestones.length === 0) {
    return (
      <Card className={`border-l-4 border-l-gray-400 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">Project Status</CardTitle>
          </div>
          <CardDescription>
            No milestones defined for this submission.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalMilestones = milestones.length
  const completedMilestones = milestones.filter(
    m => m.status === 'completed'
  ).length
  const activeMilestones = milestones.filter(
    m => m.status === 'changes-requested' || m.status === 'in-review'
  ).length

  const progressPercentage = Math.round(
    (completedMilestones / totalMilestones) * 100
  )
  const activeStep = getCurrentActiveStep(milestones)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Active Step Hero */}
      {activeStep && (
        <Card
          className={`border-l-4 ${
            activeStep.actionRequired
              ? 'border-l-orange-500'
              : 'border-l-blue-500'
          } ${activeStep.bgColor}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-white p-2 shadow-sm">
                    {activeStep.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {activeStep.milestone
                        ? `Milestone: ${activeStep.milestone.title}`
                        : 'All Milestones Complete'}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {activeStep.description}
                    </CardDescription>
                  </div>
                </div>

                {/* Current milestone details */}
                {activeStep.milestone && (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {activeStep.milestone.amount && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">
                          ${activeStep.milestone.amount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {activeStep.milestone.dueDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>
                          Due{' '}
                          {new Date(
                            activeStep.milestone.dueDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {activeStep.milestone.githubRepoUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <GitBranch className="h-4 w-4 text-purple-600" />
                        <a
                          href={activeStep.milestone.githubRepoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline"
                        >
                          View Repository
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Badge
                className={`${activeStep.color} ${activeStep.actionRequired ? 'animate-pulse' : ''}`}
              >
                {activeStep.actionRequired ? 'Action Required' : 'In Progress'}
              </Badge>
            </div>
          </CardHeader>

          {/* Submit for Review Button - Show for grantee on approved submissions with pending/rejected milestones */}
          {isGrantee &&
            submission.status === 'approved' &&
            activeStep.milestone &&
            (activeStep.milestone.status === 'pending' ||
              activeStep.milestone.status === 'rejected') &&
            onSubmitMilestone && (
              <CardContent className="space-y-3 pt-0">
                {activeStep.milestone.status === 'pending' && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-sm text-blue-700">
                      This milestone is ready to be submitted. Click the button
                      below to select commits and provide a deliverables
                      description.
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => onSubmitMilestone(activeStep.milestone.id)}
                  className="flex w-full items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {activeStep.milestone.status === 'rejected'
                    ? 'Resubmit Milestone'
                    : 'Submit Milestone for Review'}
                </Button>
              </CardContent>
            )}
        </Card>
      )}

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Milestone Progress</CardTitle>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                {completedMilestones}/{totalMilestones} completed
              </span>
              <span className="font-semibold text-blue-600">
                {progressPercentage}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3">
            {milestones.map((milestone, index) => {
              const statusInfo = getMilestoneStatusInfo(milestone)
              return (
                <div
                  key={milestone.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${statusInfo.bgColor}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="w-8 text-sm font-medium text-gray-600">
                      {index + 1}.
                    </span>
                    {statusInfo.icon}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {milestone.title}
                      </div>
                      {milestone.description && (
                        <div className="truncate text-xs text-gray-600">
                          {milestone.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {milestone.amount && (
                      <span className="text-xs text-gray-600">
                        ${milestone.amount.toLocaleString()}
                      </span>
                    )}
                    <Badge className={`text-xs ${statusInfo.color}`}>
                      {milestone.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {completedMilestones}
              </div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {activeMilestones}
              </div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-600">
                {totalMilestones - completedMilestones - activeMilestones}
              </div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
