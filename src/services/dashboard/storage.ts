/**
 * @file services/storage.ts
 * @description Типобезопасный сервис для работы с localStorage
 */

import { DashboardTab, UserWithRole } from '../types/dashboard/types'

// ===========================
//🔑 КЛЮЧИ ЛОКАЛЬНОГО ХРАНИЛИЩА
//===========================

const STORAGE_KEYS = {
  ACTIVE_TAB: 'wasser:dashboard:active-tab',
  USER_PREFERENCES: 'wasser:user:preferences',
  CACHE_STATS: 'wasser:cache:stats',
  THEME: 'wasser:theme',
  TEST_USER: 'test-user',
  SUPABASE_USER: 'supabase-user'
} as const

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

// ===========================
//🏗️ ТИПОБЕЗОПАСНЫЙ СЕРВИС ХРАНИЛИЩА
//===========================

class WasserStorage {
  /**
   * Безопасное чтение из localStorage с типизацией
   */
  private static safeGet<T>(key: StorageKey): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.warn(`Ошибка чтения ${key} из localStorage:`, error)
      return null
    }
  }

  /**
   * Безопасная запись в localStorage
   */
  private static safeSet<T>(key: StorageKey, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Ошибка записи ${key} в localStorage:`, error)
    }
  }

  /**
   * Безопасное удаление из localStorage
   */
  private static safeRemove(key: StorageKey): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Ошибка удаления ${key} из localStorage:`, error)
    }
  }

  // ===========================
//🎯 МЕТОДЫ ДЛЯ ДАШБОРДА
//===========================

  /** Получить активную вкладку */
  static getActiveTab(): DashboardTab | null {
    return this.safeGet<DashboardTab>(STORAGE_KEYS.ACTIVE_TAB)
  }

  /** Сохранить активную вкладку */
  static setActiveTab(tab: DashboardTab): void {
    this.safeSet(STORAGE_KEYS.ACTIVE_TAB, tab)
  }

  /** Получить кешированную статистику */
  static getCachedStats(): any {
    return this.safeGet(STORAGE_KEYS.CACHE_STATS)
  }

  /** Сохранить статистику в кеш */
  static setCachedStats(stats: any, ttl: number = 300000): void {
    const cacheEntry = {
      data: stats,
      timestamp: Date.now(),
      ttl
    }
    this.safeSet(STORAGE_KEYS.CACHE_STATS, cacheEntry)
  }

  /** Проверить валидность кеша */
  static isCacheValid(cacheKey: StorageKey): boolean {
    const cache = this.safeGet<{timestamp: number, ttl: number}>(cacheKey)
    if (!cache) return false
    
    return (Date.now() - cache.timestamp) < cache.ttl
  }

  // ===========================
//👤 МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ  
//===========================

  /** Получить тестового пользователя */
  static getTestUser(): UserWithRole | null {
    const testUser = this.safeGet<any>(STORAGE_KEYS.TEST_USER)
    if (!testUser?.authenticated) return null
    
    // Проверка срока действия сессии (7 дней)
    const sessionAge = Date.now() - (testUser.timestamp || 0)
    const maxAge = 7 * 24 * 60 * 60 * 1000
    
    if (sessionAge > maxAge) {
      this.safeRemove(STORAGE_KEYS.TEST_USER)
      return null
    }
    
    return {
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
      name: testUser.name
    }
  }

  /** Получить пользователя Supabase */
  static getSupabaseUser(): UserWithRole | null {
    const supabaseUser = this.safeGet<any>(STORAGE_KEYS.SUPABASE_USER)
    if (!supabaseUser?.role) return null
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: supabaseUser.role,
      name: supabaseUser.name
    }
  }

  /** Сохранить пользовательские настройки */
  static setUserPreferences(preferences: Record<string, any>): void {
    this.safeSet(STORAGE_KEYS.USER_PREFERENCES, preferences)
  }

  /** Получить пользовательские настройки */
  static getUserPreferences(): Record<string, any> {
    return this.safeGet(STORAGE_KEYS.USER_PREFERENCES) || {}
  }

  // ===========================
//🧹 СЛУЖЕБНЫЕ МЕТОДЫ
//===========================

  /** Очистить все данные дашборда */
  static clearDashboardData(): void {
    const keysToRemove = [
      STORAGE_KEYS.ACTIVE_TAB,
      STORAGE_KEYS.CACHE_STATS,
      STORAGE_KEYS.USER_PREFERENCES
    ]
    
    keysToRemove.forEach(key => this.safeRemove(key))
  }

  /** Очистить данные аутентификации */
  static clearAuthData(): void {
    const authKeys = [
      STORAGE_KEYS.TEST_USER,
      STORAGE_KEYS.SUPABASE_USER
    ]
    
    authKeys.forEach(key => this.safeRemove(key))
  }

  /** Получить размер используемого хранилища */
  static getStorageSize(): number {
    let total = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    return Math.round(total / 1024) // в KB
  }

  /** Диагностика хранилища */
  static getDiagnostics(): Record<string, any> {
    return {
      storageSize: `${this.getStorageSize()} KB`,
      activeTab: this.getActiveTab(),
      cacheValid: this.isCacheValid(STORAGE_KEYS.CACHE_STATS),
      hasTestUser: !!this.getTestUser(),
      hasSupabaseUser: !!this.getSupabaseUser(),
      timestamp: new Date().toISOString()
    }
  }
}

export { WasserStorage as DashboardStorage, STORAGE_KEYS }

