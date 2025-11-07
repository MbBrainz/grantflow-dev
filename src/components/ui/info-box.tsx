import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface InfoBoxProps {
  icon: ReactNode
  title: string
  children: ReactNode
  variant?: 'default' | 'info' | 'warning' | 'success' | 'error'
  className?: string
}

export function InfoBox({
  icon,
  title,
  children,
  variant = 'default',
  className,
}: InfoBoxProps) {
  const variants = {
    default: 'border-gray-200 bg-white',
    info: 'border-blue-200 bg-blue-50',
    warning: 'border-orange-200 bg-orange-50',
    success: 'border-green-200 bg-green-50',
    error: 'border-red-200 bg-red-50',
  }

  const iconColors = {
    default: 'text-gray-600',
    info: 'text-blue-600',
    warning: 'text-orange-600',
    success: 'text-green-600',
    error: 'text-red-600',
  }

  return (
    <Card className={cn('p-4', variants[variant], className)}>
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0', iconColors[variant])}>{icon}</div>
        <div className="flex-1">
          <h3 className="mb-2 font-semibold">{title}</h3>
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </Card>
  )
}
