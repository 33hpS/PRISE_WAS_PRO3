/**
 * @file TabNav.tsx
 * @description Доступная вкладочная навигация для Dashboard: клавиатура, ARIA-атрибуты, видимость элементов.
 */

import React, { useMemo, useRef, useCallback } from 'react'
import { cn } from '../../lib/utils'

/** Описание вкладки */
export interface TabItem {
  /** Уникальный ключ вкладки */
  key: string
  /** Метка вкладки */
  label: string
  /** Иконка слева (опционально) */
  icon?: React.ReactNode
  /** Видимость вкладки (если false — скрыть) */
  visible?: boolean
}

/** Пропсы TabNav */
interface TabNavProps {
  /** Список вкладок */
  items: TabItem[]
  /** Активный ключ */
  value: string
  /** Обработчик переключения */
  onChange: (key: string) => void
  /** Доп. классы */
  className?: string
}

/**
 * TabNav — доступная вкладочная навигация:
 * - Управление клавиатурой: Left/Right/Home/End.
 * - ARIA: tablist, tab, aria-selected, aria-controls.
 * - Скрывает вкладки с visible=false.
 */
export default function TabNav({ items, value, onChange, className }: TabNavProps): JSX.Element {
  const visibleItems = useMemo(() => items.filter((i) => i.visible !== false), [items])
  const refs = useRef<HTMLButtonElement[]>([])

  /** Фокусировать вкладку по индексу */
  const focusIndex = useCallback((idx: number) => {
    const btn = refs.current[idx]
    if (btn) btn.focus()
  }, [])

  /** Найти индекс активной вкладки среди видимых */
  const activeIndex = useMemo(() => {
    return Math.max(0, visibleItems.findIndex((i) => i.key === value))
  }, [visibleItems, value])

  /** Клавиатурная навигация */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()

    const last = visibleItems.length - 1

    if (e.key === 'Home') {
      focusIndex(0)
      return
    }
    if (e.key === 'End') {
      focusIndex(last)
      return
    }
    if (e.key === 'ArrowLeft') {
      focusIndex(activeIndex === 0 ? last : activeIndex - 1)
      return
    }
    if (e.key === 'ArrowRight') {
      focusIndex(activeIndex === last ? 0 : activeIndex + 1)
      return
    }
  }

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div
        className="inline-flex gap-1 p-1 bg-white border border-gray-200 rounded-lg shadow-sm"
        role="tablist"
        aria-label="Навигация по разделам панели"
        onKeyDown={onKeyDown}
      >
        {visibleItems.map((item, idx) => {
          const selected = item.key === value
          return (
            <button
              key={item.key}
              ref={(el) => {
                if (el) refs.current[idx] = el
              }}
              role="tab"
              aria-selected={selected}
              aria-controls={`tabpanel-${item.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.key)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                selected
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-transparent text-gray-700 hover:bg-gray-50 border-transparent',
              )}
            >
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Утилита cn: объединяет className. Если в проекте уже есть — эту функцию можно не использовать.
 * Оставлена для локальной автономности компонента.
 */
// Локальный дубль, если централизованной нет.
declare const window: any
function hasGlobalCn(): boolean {
  try {
    return typeof (window as any)?.__app_cn__ === 'function'
  } catch {
    return false
  }
}

// Попытка получить cn из глобала, иначе простой fallback
function cn(...classes: Array<string | undefined | false | null>): string {
  if (hasGlobalCn()) return (window as any).__app_cn__(...classes)
  return classes.filter(Boolean).join(' ')
}
