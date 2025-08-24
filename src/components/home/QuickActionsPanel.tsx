// src/components/home/QuickActionsPanel.tsx
import React from 'react'
import { Button } from '../ui/button'

export interface QuickActionItem {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  // Optional Tailwind classes to colorize action
  accentClass?: string
}

interface QuickActionsPanelProps {
  items: QuickActionItem[]
  // md grid columns: 2 or 4 by default
  mdCols?: 2 | 3 | 4
}

export default function QuickActionsPanel({ items, mdCols = 2 }: QuickActionsPanelProps) {
  // NOTE: No hooks inside. Pure presentational component.
  const gridCols = mdCols === 4 ? 'grid-cols-1 md:grid-cols-4' :
                   mdCols === 3 ? 'grid-cols-1 md:grid-cols-3' :
                   'grid-cols-1 md:grid-cols-2'

  return (
    <div className={`grid gap-4 ${gridCols}`}>
      {items.map((item, idx) => (
        <Button
          key={`${item.label}-${idx}`}
          onClick={item.onClick}
          variant="outline"
          className={`bg-transparent h-24 flex flex-col gap-2 ${item.accentClass || ''}`}
        >
          {item.icon ? item.icon : null}
          <span>{item.label}</span>
        </Button>
      ))}
    </div>
  )
}
