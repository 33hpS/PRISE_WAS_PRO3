/**
 * @file types/dashboard/types.ts
 * @description Типобезопасная система типов для дашборда мебельной фабрики WASSER
 */

import React from 'react'

// ===========================
// 🎯 ОСНОВНЫЕ ТИПЫ ДАШБОРДА
// ===========================

/** Допустимые вкладки дашборда */
export type DashboardTab =
  | 'overview'
  | 'generator'
  | 'labels'
  | 'upload'
  | 'materials'
  | 'products'
  | 'collections'
  | 'types'
  | 'paint'
  | 'markup'
  | 'sinks'
  | 'sets'
  | 'history'
  | 'users'

/** Роли пользователей */
export type UserRole = 'admin' | 'manager' | 'user'

/** Пользователь с ролью */
export interface UserWithRole {
  readonly id: string
  readonly email: string
  readonly role: UserRole
  readonly name?: string
  readonly permissions?: readonly string[]
}

/** Статистика дашборда */
export interface DashboardStats {
  readonly materials: number
  readonly products: number
  readonly collections: number
  readonly priceLists: number
  readonly lastUpdated?: Date
}

/** Состояние дашборда */
export interface DashboardState {
  readonly activeTab: DashboardTab
  readonly stats: DashboardStats
  readonly statsLoading: boolean
  readonly user: UserWithRole | null
  readonly loading: boolean
  readonly error: string | null
}

/** Определение вкладки с типобезопасностью */
export interface TabDefinition {
  readonly key: DashboardTab
  readonly label: string
  readonly icon: React.ReactNode
  readonly description: string
  readonly adminOnly: boolean
  readonly requiredPermissions?: readonly string[]
  readonly component: React.ComponentType
}

/** Метрики производительности */
export interface PerformanceMetrics {
  readonly loadTime: number
  readonly tabSwitchTime: number
  readonly lastUpdate: Date
  readonly memoryUsage?: number
}

// ===========================
// 🏭 МЕБЕЛЬНАЯ ФАБРИКА ТИПЫ
// ===========================

/** Материалы для мебели */
export interface FurnitureMaterial {
  readonly id: string
  readonly name: string
  readonly price: number
  readonly unit: string
  readonly category: 'wood' | 'metal' | 'fabric' | 'hardware' | 'finish' | 'glass'
  readonly consumptionCoeff: number
  readonly isActive: boolean
  readonly supplier?: string
}

/** Коллекции мебели */
export interface FurnitureCollection {
  readonly id: string
  readonly name: string
  readonly multiplier: number
  readonly description: string
  readonly isActive: boolean
  readonly style: 'классик' | 'модерн' | 'лофт' | 'прованс' | 'скандинавский'
}

/** Изделие мебели */
export interface FurnitureProduct {
  readonly id: string
  readonly article: string
  readonly name: string
  readonly collection: string
  readonly basePrice: number
  readonly category: 'столы' | 'стулья' | 'шкафы' | 'кровати' | 'комоды' | 'другое'
  readonly materials: readonly string[]
  readonly dimensions: {
    readonly width: number
    readonly height: number
    readonly depth: number
  }
  readonly isActive: boolean
  readonly description?: string
}
