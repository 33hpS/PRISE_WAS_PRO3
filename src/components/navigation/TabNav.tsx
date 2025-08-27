// src/components/navigation/TabNav.tsx
import React from 'react'

export interface TabItem {
  key: string
  label: string
  active?: boolean
  onClick: () => void
}

interface TabNavProps {
  items: TabItem[]
  size?: 'sm' | 'md'
}

export default function TabNav({ items, size = 'md' }: TabNavProps) {
  // NOTE: No hooks inside. Pure presentational component.
  const base = 'inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition-colors'
  const active = 'bg-blue-50 border-blue-200 text-blue-700'
  const inactive = 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'

  const gap = size === 'sm' ? 'gap-1' : 'gap-2'

  return (
    <div className={`flex flex-wrap ${gap}`}>
      {items.map(tab => (
        <button
          key={tab.key}
          onClick={tab.onClick}
          className={`${base} ${tab.active ? active : inactive}`}
          type='button'
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
