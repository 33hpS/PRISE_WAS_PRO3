/**
 * @file types/dashboard/types.ts
 * @description Типобезопасные определения для дашборда WASSER
 * Функциональная архитектура с полной типизацией
 */

export type DashboardTab = 
  | 'overview' 
  | 'generator' 
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

export type UserRole = 'admin' | 'manager' | 'viewer'
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface DashboardStats {
  readonly materials: number
  readonly products: number
  readonly collections: number
  readonly priceLists: number
  readonly lastUpdated: string
}

export interface TabDefinition {
  readonly key: DashboardTab
  readonly label: string
  readonly icon: React.ReactNode
  readonly description: string
  readonly adminOnly: boolean
  readonly component: React.ComponentType
}

export interface DashboardUser {
  readonly id: string
  readonly email: string
  readonly role: UserRole
  readonly isActive: boolean
}

export interface DashboardState {
  readonly activeTab: DashboardTab
  readonly stats: DashboardStats | null
  readonly user: DashboardUser | null
  readonly loading: LoadingState
  readonly error: string | null
}

export interface DashboardContextValue {
  readonly state: DashboardState
  readonly isAdmin: boolean
  readonly setActiveTab: (tab: DashboardTab) => void
  readonly refreshStats: () => Promise<void>
  readonly clearError: () => void
}
