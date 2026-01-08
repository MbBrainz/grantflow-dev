'use client'

import { Building2 } from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { Committee } from '@/lib/db/schema'

interface CommitteeBadgeProps {
  committee: Pick<
    Committee,
    'id' | 'name' | 'description' | 'logoUrl' | 'focusAreas' | 'isActive'
  >
  className?: string
  showIcon?: boolean
  variant?: 'default' | 'outline' | 'compact'
}

export function CommitteeBadge({
  committee,
  className = '',
  showIcon = true,
  variant = 'default',
}: CommitteeBadgeProps) {
  if (variant === 'compact') {
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        {showIcon && <Building2 className="mr-1 h-3 w-3" />}
        {committee.name}
      </Badge>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <div className="flex-shrink-0 rounded bg-blue-100 p-1 text-blue-600">
          {committee.logoUrl ? (
            <Image
              src={committee.logoUrl}
              alt={`${committee.name} logo`}
              className="h-4 w-4 rounded object-cover"
            />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{committee.name}</span>
        <Badge
          variant={committee.isActive ? 'default' : 'outline'}
          className={`text-xs ${committee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
        >
          {committee.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    </div>
  )
}
