'use client';

import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle, Clock } from 'lucide-react';

interface Milestone {
  id: number;
  status: string;
  title: string;
  amount?: number;
}

interface MilestoneProgressBadgeProps {
  milestones: Milestone[];
  submissionStatus: string;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export function MilestoneProgressBadge({ 
  milestones, 
  submissionStatus,
  className = "", 
  variant = 'default'
}: MilestoneProgressBadgeProps) {
  
  if (!milestones || milestones.length === 0 || submissionStatus !== 'approved') {
    return null;
  }

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const inProgressMilestones = milestones.filter(m => m.status === 'in_progress' || m.status === 'submitted').length;
  
  const progressPercentage = Math.round((completedMilestones / totalMilestones) * 100);
  
  const getBadgeColor = () => {
    if (completedMilestones === totalMilestones) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (inProgressMilestones > 0) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const getIcon = () => {
    if (completedMilestones === totalMilestones) {
      return <CheckCircle className="w-3 h-3" />;
    } else if (inProgressMilestones > 0) {
      return <Clock className="w-3 h-3" />;
    } else {
      return <Target className="w-3 h-3" />;
    }
  };

  if (variant === 'compact') {
    return (
      <Badge className={`text-xs ${getBadgeColor()} ${className}`}>
        {getIcon()}
        <span className="ml-1">{completedMilestones}/{totalMilestones}</span>
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {getIcon()}
          <span className="text-sm font-medium">
            Milestones: {completedMilestones}/{totalMilestones}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="flex-1 max-w-24 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              completedMilestones === totalMilestones ? 'bg-green-500' :
              inProgressMilestones > 0 ? 'bg-blue-500' : 'bg-orange-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <span className="text-xs text-gray-600">{progressPercentage}%</span>
      </div>
    );
  }

  // Default variant
  return (
    <Badge className={`${getBadgeColor()} ${className}`}>
      <div className="flex items-center gap-1">
        {getIcon()}
        <span>Milestones {completedMilestones}/{totalMilestones}</span>
        {inProgressMilestones > 0 && (
          <span className="text-xs opacity-75">({inProgressMilestones} active)</span>
        )}
      </div>
    </Badge>
  );
} 