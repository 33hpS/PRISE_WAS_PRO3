/**
 * @file Journal.tsx
 * @description Страница «Журнал» — просмотр истории изменений из локального хранилища.
 */
import React, { useMemo } from 'react'

/** Тип события журнала */
interface AuditEvent {
  id: string
  at: number
  action: string
  entity: string
  entityId?: string
  details?: any
}

/**
 * JournalPage — список событий с сортировкой по дате
 */
export default function JournalPage(): JSX.Element {
  const list = useMemo<AuditEvent[]>(() => {
    try {
      const raw = localStorage.getItem('wasser_change_log')
      const data = raw ? (JSON.parse(raw) as AuditEvent[]) : []
      return data
    } catch {
      return []
    }
  }, [])

  return (
    <div className='max-w-5xl mx-auto px-6 py-8 space-y-4'>
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>Журнал изменений</h1>
        <p className='text-gray-600 mt-1'>Последние действия в системе.</p>
      </div>

      {list.length === 0 ? (
        <div className='p-6 rounded-xl border border-dashed border-gray-300 bg-white text-gray-500'>
          События отсутствуют.
        </div>
      ) : (
        <ul className='space-y-2'>
          {list.map(e => (
            <li key={e.id} className='p-3 rounded-lg border border-gray-200 bg-white'>
              <div className='text-sm text-gray-900'>
                <span className='font-semibold'>{e.action}</span> • {e.entity}{' '}
                {e.entityId ? `(${e.entityId})` : ''}
              </div>
              <div className='text-xs text-gray-500'>{new Date(e.at).toLocaleString('ru-RU')}</div>
              {e.details && (
                <pre className='mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 overflow-auto'>
                  {JSON.stringify(e.details, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
