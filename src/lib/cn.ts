/**
 * @file cn.ts
 * @description Утилита объединения CSS классов: условная сборка (clsx) + корректный merge Tailwind (tailwind-merge).
 * Экспортирует именованную функцию `cn` и default-экспорт для удобства.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn — безопасное объединение классов с учетом конфликтов Tailwind.
 * @param inputs Список классов/условных значений
 * @returns Строка классов после нормализации и merge конфликтов
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs))
}

export default cn
