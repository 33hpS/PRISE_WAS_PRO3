/**
 * @file hooks/useLocalStorage.ts
 * @description Типобезопасный хук для localStorage с функциональным подходом
 */

import { useState, useCallback, useEffect } from 'react'

type UseLocalStorageReturn<T> = readonly [
  T,
  (value: T | ((prev: T) => T)) => void,
  () => void
]

/**
 * Типобезопасный хук для работы с localStorage
 * Функциональный подход с мемоизацией и обработкой ошибок
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> => {
  // Инициализация значения с обработкой ошибок
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Ошибка чтения localStorage ключа "${key}":`, error)
      return initialValue
    }
  })

  // Мемоизированная функция установки значения
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        
        // Асинхронная запись для производительности
        requestIdleCallback(() => {
          try {
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
          } catch (error) {
            console.error(`Ошибка записи localStorage ключа "${key}":`, error)
          }
        })
      } catch (error) {
        console.error(`Ошибка обработки значения для ключа "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  // Функция очистки
  const clearValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Ошибка удаления localStorage ключа "${key}":`, error)
    }
  }, [key, initialValue])

  // Синхронизация с изменениями в других вкладках
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn('Ошибка синхронизации localStorage:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue, clearValue] as const
}
