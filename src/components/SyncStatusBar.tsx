/**
 * @file SyncStatusBar.tsx
 * @description Глобальная полоса статуса/прогресса. Появляется, когда syncing === true.
 * Доступность: aria-live="polite". Хороший контраст и клавиатурная доступность.
 */

import { Loader2 } from 'lucide-react'
import { useSyncStore } from '../store/sync-store'

/**
 * SyncStatusBar — фиксированная верхняя панель с сообщением и прогресс-линией.
 * - Если progress === null — показываем "неопределённую" анимированную полосу (pulse).
 * - Если есть число 0–100 — показываем детерминированный прогресс.
 */
export default function SyncStatusBar() {
  const { syncing, message, progress } = useSyncStore()

  if (!syncing) return null

  const determinate = typeof progress === 'number' && isFinite(progress)

  return (
    <div
      role='status'
      aria-live='polite'
      className='sticky top-0 z-50 w-full bg-sky-600 text-white shadow'
    >
      <div className='container mx-auto px-4 py-1.5 flex items-center gap-2 text-sm'>
        <Loader2 className='h-4 w-4 animate-spin' aria-hidden />
        <span className='font-medium'>{message || 'Выполняется...'}</span>
      </div>

      {/* Прогресс-линия */}
      <div className='w-full h-1 bg-sky-900/40'>
        {determinate ? (
          <div
            className='h-1 bg-white transition-[width] duration-200 ease-out'
            style={{ width: `${Math.max(0, Math.min(100, progress!))}%` }}
          />
        ) : (
          <div className='h-1 w-1/3 bg-white/80 animate-pulse' />
        )}
      </div>
    </div>
  )
}
