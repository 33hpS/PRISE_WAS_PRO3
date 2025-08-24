/**
 * @file RecentActivity.tsx
 * @description Виджет недавней активности из локального журнала изменений.
 */
import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

/** Событие аудита */
interface AuditEvent {
  id: string
  at: number
  action: string
  entity: string
  entityId?: string
  details?: any
  version?: string
}

/**
 * RecentActivity — последние события
 */
export default function RecentActivity({ limit = 5 }: { limit?: number }): JSX.Element {
  const events = useMemo<AuditEvent[]>(() => {
    try {
      const raw = localStorage.getItem('wasser_change_log')
      const list = raw ? (JSON.parse(raw) as AuditEvent[]) : []
      return list.slice(0, limit)
    } catch {
      return []
    }
  }, [limit])

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Недавняя активность</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-sm text-gray-500">События отсутствуют</div>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-900">
                  <span className="font-semibold">{e.action}</span> • {e.entity} {e.entityId ? `(${e.entityId})` : ''}
                </div>
                <div className="text-xs text-gray-500">{new Date(e.at).toLocaleString('ru-RU')}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
