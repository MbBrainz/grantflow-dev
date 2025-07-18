'use client';

import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

interface Committee {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  focusAreas?: string;
  isActive: boolean;
}

interface CommitteeBadgeProps {
  committee: Committee;
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'compact';
}

export function CommitteeBadge({ 
  committee, 
  className = "", 
  showIcon = true,
  variant = 'default'
}: CommitteeBadgeProps) {
  
  if (variant === 'compact') {
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        {showIcon && <Building2 className="w-3 h-3 mr-1" />}
        {committee.name}
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <div className="p-1 rounded bg-blue-100 text-blue-600 flex-shrink-0">
          {committee.logoUrl ? (
            <img 
              src={committee.logoUrl} 
              alt={`${committee.name} logo`}
              className="w-4 h-4 rounded object-cover"
            />
          ) : (
            <Building2 className="w-4 h-4" />
          )}
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">{committee.name}</span>
        <Badge 
          variant={committee.isActive ? "default" : "outline"} 
          className={`text-xs ${committee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
        >
          {committee.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    </div>
  );
} 