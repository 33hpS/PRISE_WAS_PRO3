/**
 * @file sync-store.ts
 * @description Глобальный Zustand-store для статуса операций (синхронизация/импорт) и прогресса.
 * API: syncing, message, startTime, progress, startSync, setMessage, setProgress, stopSync, getElapsedMs.
 */

import { create } from 'zustand'

/** Состояние и методы стора длительных операций */
interface SyncState {
  /** Идёт ли операция */
  syncing: boolean
  /** Сообщение статуса (например, "Импорт материалов...") */
  message: string | null
  /** Время старта (ms since epoch) для вычисления длительности */
  startTime: number | null
  /** Прогресс (0–100) или null для неопределённого индикатора */
  progress: number | null

  /** Запуск операции */
  startSync: (msg: string, initialProgress?: number | null) => void
  /** Обновить сообщение */
  setMessage: (msg: string) => void
  /** Установить прогресс (0–100) или null для indeterminate */
  setProgress: (value: number | null) => void
  /** Остановить операцию */
  stopSync: () => void
  /** Текущая длительность в миллисекундах (0, если не идёт) */
  getElapsedMs: () => number
}

/**
 * useSyncStore — единый стор для статуса операции и прогресса.
 */
export const useSyncStore = create<SyncState>((set, get) => ({
  syncing: false,
  message: null,
  startTime: null,
  progress: null,

  startSync: (msg: string, initialProgress: number | null = null) => {
    set({
      syncing: true,
      message: msg,
      startTime: Date.now(),
      progress: initialProgress,
    })
  },

  setMessage: (msg: string) => {
    set({ message: msg })
  },

  setProgress: (value: number | null) => {
    // Нормируем в диапазон [0, 100] или null для indeterminate
    const v =
      value === null
        ? null
        : Math.max(0, Math.min(100, Number.isFinite(value) ? (value as number) : 0))
    set({ progress: v })
  },

  stopSync: () => {
    set({
      syncing: false,
      message: null,
      startTime: null,
      progress: null,
    })
  },

  getElapsedMs: () => {
    const s = get()
    if (!s.syncing || !s.startTime) return 0
    return Math.max(0, Date.now() - s.startTime)
  },
}))
