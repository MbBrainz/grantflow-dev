import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

export interface MetadataItem {
  icon: ReactNode
  label?: string
  value: ReactNode
}

interface ActionableCardProps {
  title: string
  description?: string
  subtitle?: string
  status?: string
  statusBadge?: ReactNode
  metadata?: MetadataItem[]
  badges?: ReactNode[]
  actionButton?: {
    label: string
    href?: string
    onClick?: () => void
    variant?: 'default' | 'outline'
    icon?: ReactNode
  }
  urgency?: 'normal' | 'urgent' | 'critical'
  className?: string
  children?: ReactNode
}

export function ActionableCard({
  title,
  description,
  subtitle,
  status,
  statusBadge,
  metadata,
  badges,
  actionButton,
  urgency = 'normal',
  className,
  children,
}: ActionableCardProps) {
  const urgencyStyles = {
    normal: 'border-gray-200',
    urgent: 'border-l-4 border-l-orange-500 bg-orange-50',
    critical: 'border-l-4 border-l-red-500 bg-red-50',
  }

  const actionContent = actionButton && (
    <div className="flex gap-2">
      {actionButton.href ? (
        <Link href={actionButton.href}>
          <Button
            variant={actionButton.variant ?? 'default'}
            size="sm"
            className="flex items-center gap-2"
          >
            {actionButton.label}
            {actionButton.icon}
          </Button>
        </Link>
      ) : (
        <Button
          variant={actionButton.variant ?? 'default'}
          size="sm"
          onClick={actionButton.onClick}
          className="flex items-center gap-2"
        >
          {actionButton.label}
          {actionButton.icon}
        </Button>
      )}
    </div>
  )

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        urgencyStyles[urgency],
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            {(subtitle ?? description) && (
              <CardDescription>
                {subtitle}
                {description && (
                  <span className="line-clamp-2">{description}</span>
                )}
              </CardDescription>
            )}
            {badges && badges.length > 0 && (
              <div className="flex flex-wrap gap-1">{badges}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {statusBadge}
            {status && <StatusBadge status={status} />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {children}
          {metadata && metadata.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {metadata.map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                  {item.icon}
                  {item.label && <span>{item.label}:</span>}
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          {actionContent && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex-1" />
              {actionContent}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
