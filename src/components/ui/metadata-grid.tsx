import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetadataItem {
  icon: ReactNode
  label: string
  value: ReactNode
  className?: string
}

interface MetadataGridProps {
  items: MetadataItem[]
  columns?: 2 | 3 | 4
  className?: string
}

export function MetadataGrid({
  items,
  columns = 4,
  className,
}: MetadataGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }

  return (
    <div className={cn('grid grid-cols-1 gap-4', gridCols[columns], className)}>
      {items.map((item, index) => (
        <Card key={index} className="p-3">
          <div className="mb-1 flex items-center gap-2">
            <div className="text-gray-500">{item.icon}</div>
            <span className="text-sm font-medium text-gray-500">
              {item.label}
            </span>
          </div>
          <div className={cn('text-lg font-bold', item.className)}>
            {item.value}
          </div>
        </Card>
      ))}
    </div>
  )
}
