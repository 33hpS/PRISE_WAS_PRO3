/**
 * @file QuickActionsPanel.tsx
 * @description Панель быстрых действий с акцентными карточками.
 */
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

/** Элемент быстрого действия */
export interface QuickActionItem {
  label: string
  description?: string
  icon?: React.ReactNode
  onClick?: () => void
  accentClass?: string
}

/**
 * QuickActionsPanel — сетка карточек для быстрого доступа к разделам
 */
export default function QuickActionsPanel({ items }: { items: QuickActionItem[] }): JSX.Element {
  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Быстрые действия</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={it.onClick}
              className={`text-left p-4 rounded-lg border transition hover:-translate-y-0.5 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 ${it.accentClass || 'border-gray-200 bg-gray-50 text-gray-800'}`}
              aria-label={it.label}
              title={it.label}
            >
              <div className="flex items-center gap-2">
                {it.icon}
                <div className="font-semibold">{it.label}</div>
              </div>
              {it.description && <div className="text-sm text-gray-600 mt-1">{it.description}</div>}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
