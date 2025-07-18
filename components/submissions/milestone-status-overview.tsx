'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { 
  Target, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  PlayCircle, 
  Pause,
  FileText,
  GitBranch,
  DollarSign,
  Calendar
} from 'lucide-react';

interface Milestone {
  id: number;
  title: string;
  description: string | null;
  status: string; // 'pending', 'in_progress', 'submitted', 'under_review', 'completed', 'rejected'
  amount: number | null;
  dueDate: Date | null;
  deliverables: string | null;
  githubRepoUrl: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

interface MilestoneStatusOverviewProps {
  submission: {
    id: number;
    title: string;
    status: string;
    milestones: Milestone[];
  };
  className?: string;
}

function getMilestoneStatusInfo(milestone: Milestone) {
  switch (milestone.status) {
    case 'pending':
      return {
        icon: <Pause className="w-4 h-4" />,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        bgColor: 'bg-gray-50',
        description: 'Waiting to start',
        actionRequired: false
      };
    case 'in_progress':
      return {
        icon: <PlayCircle className="w-4 h-4" />,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        bgColor: 'bg-blue-50',
        description: 'Currently building',
        actionRequired: false
      };
    case 'submitted':
      return {
        icon: <FileText className="w-4 h-4" />,
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        bgColor: 'bg-purple-50',
        description: 'Submitted for review',
        actionRequired: true
      };
    case 'under_review':
      return {
        icon: <Clock className="w-4 h-4" />,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        bgColor: 'bg-yellow-50',
        description: 'Under reviewer review',
        actionRequired: true
      };
    case 'completed':
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'bg-green-100 text-green-800 border-green-200',
        bgColor: 'bg-green-50',
        description: 'Completed & approved',
        actionRequired: false
      };
    case 'rejected':
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        color: 'bg-red-100 text-red-800 border-red-200',
        bgColor: 'bg-red-50',
        description: 'Needs revisions',
        actionRequired: true
      };
    default:
      return {
        icon: <Target className="w-4 h-4" />,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        bgColor: 'bg-gray-50',
        description: 'Unknown status',
        actionRequired: false
      };
  }
}

function getCurrentActiveStep(milestones: Milestone[]) {
  // Find the first non-completed milestone
  const activeMilestone = milestones.find(m => 
    m.status !== 'completed' && m.status !== 'rejected'
  );
  
  if (activeMilestone) {
    const statusInfo = getMilestoneStatusInfo(activeMilestone);
    return {
      milestone: activeMilestone,
      ...statusInfo
    };
  }
  
  // All milestones completed
  const completedCount = milestones.filter(m => m.status === 'completed').length;
  if (completedCount === milestones.length && milestones.length > 0) {
    return {
      milestone: null,
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-100 text-green-800 border-green-200',
      bgColor: 'bg-green-50',
      description: 'All milestones completed!',
      actionRequired: false
    };
  }
  
  return null;
}

export function MilestoneStatusOverview({ submission, className = "" }: MilestoneStatusOverviewProps) {
  const milestones = submission.milestones || [];
  
  if (milestones.length === 0) {
    return (
      <Card className={`border-l-4 border-l-gray-400 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-gray-600" />
            <CardTitle className="text-lg">Project Status</CardTitle>
          </div>
          <CardDescription>
            No milestones defined for this submission.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const activeMilestones = milestones.filter(m => 
    m.status === 'in_progress' || m.status === 'submitted' || m.status === 'under_review'
  ).length;
  
  const progressPercentage = Math.round((completedMilestones / totalMilestones) * 100);
  const activeStep = getCurrentActiveStep(milestones);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Active Step Hero */}
      {activeStep && (
        <Card className={`border-l-4 ${
          activeStep.actionRequired ? 'border-l-orange-500' : 'border-l-blue-500'
        } ${activeStep.bgColor}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-white shadow-sm">
                    {activeStep.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {activeStep.milestone ? `Milestone: ${activeStep.milestone.title}` : 'All Milestones Complete'}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {activeStep.description}
                    </CardDescription>
                  </div>
                </div>
                
                {/* Current milestone details */}
                {activeStep.milestone && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {activeStep.milestone.amount && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium">${activeStep.milestone.amount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {activeStep.milestone.dueDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>Due {new Date(activeStep.milestone.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {activeStep.milestone.githubRepoUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <GitBranch className="w-4 h-4 text-purple-600" />
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
              
              <Badge className={`${activeStep.color} ${activeStep.actionRequired ? 'animate-pulse' : ''}`}>
                {activeStep.actionRequired ? 'Action Required' : 'In Progress'}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
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
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-3">
            {milestones.map((milestone, index) => {
              const statusInfo = getMilestoneStatusInfo(milestone);
              return (
                <div 
                  key={milestone.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border ${statusInfo.bgColor}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-600 w-8">
                      {index + 1}.
                    </span>
                    {statusInfo.icon}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{milestone.title}</div>
                      {milestone.description && (
                        <div className="text-xs text-gray-600 truncate">{milestone.description}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {milestone.amount && (
                      <span className="text-xs text-gray-600">${milestone.amount.toLocaleString()}</span>
                    )}
                    <Badge className={`text-xs ${statusInfo.color}`}>
                      {milestone.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{completedMilestones}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{activeMilestones}</div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-600">{totalMilestones - completedMilestones - activeMilestones}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 