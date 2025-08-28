/**
 * @file types/dashboard.ts
 * @description Типы для дашборда с функциональным подходом
 */

import type { ReactNode } from 'react'

// ===========================
// 🎯 DASHBOARD ТИПЫ
// ===========================

export type DashboardTab = 
  | 'overview'
  | 'generator'
  | 'materials'
  | 'products'
  | 'collections'
  | 'reports'
  | 'settings'

export interface UserWithRole {
  readonly id: string
  readonly email: string
  readonly role: 'admin' | 'manager' | 'user'
  readonly name?: string
  readonly permissions?: readonly string[]
}

export interface DashboardStats {
  readonly materials: number
  readonly products: number
  readonly collections: number
  readonly priceLists: number
  readonly lastUpdated?: Date
}

export interface DashboardState {
  readonly activeTab: DashboardTab
  readonly stats: DashboardStats
  readonly user: UserWithRole | null
  readonly loading: boolean
  readonly error: string | null
}

export interface TabDefinition {
  readonly key: DashboardTab
  readonly label: string
  readonly icon: ReactNode
  readonly description: string
  readonly adminOnly: boolean
  readonly component: React.ComponentType
}

export interface PerformanceMetrics {
  readonly loadTime: number
  readonly renderTime: number
  readonly lastUpdate: Date
}
