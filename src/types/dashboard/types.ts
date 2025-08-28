/**
 * @file types/dashboard/types.ts
 * @description Типобезопасная система типов для дашборда мебельной фабрики WASSER
 */

import type { ReactNode, ComponentType } from 'react'

// ===========================
// 🎯 ОСНОВНЫЕ ТИПЫ ДАШБОРДА
// ===========================

/** Допустимые вкладки дашборда мебельной фабрики */
export type DashboardTab =
  | 'overview'      // Обзор и статистика
  | 'generator'     // Генератор прайс-листов
  | 'upload'        // Загрузка данных из файлов
  | 'materials'     // Управление материалами
  | 'products'      // Управление продукцией
  | 'collections'   // Мебельные коллекции
  | 'types'         // Типы продукции
  | 'paint'         // Рецепты окраски
  | 'markup'        // Правила наценки
  | 'sinks'         // Управление мойками
  | 'sets'          // Готовые наборы мебели
  | 'history'       // История изменений
  | 'users'         // Управление пользователями

/** Определение вкладки с типизацией */
export interface TabDefinition {
  readonly key: DashboardTab
  readonly label: string
  readonly icon: ReactNode
  readonly description: string
  readonly adminOnly: boolean
  readonly component: ComponentType
  readonly badge?: string
  readonly disabled?: boolean
}

/** Статистика мебельной фабрики */
export interface FurnitureFactoryStats {
  readonly materials: number
  readonly products: number
  readonly collections: number
  readonly activeOrders: number
  readonly totalRevenue: number
  readonly pendingPriceLists: number
  readonly lastUpdated: Date
}

/** Состояние дашборда */
export interface DashboardState {
  readonly activeTab: DashboardTab
  readonly stats: FurnitureFactoryStats
  readonly statsLoading: boolean
  readonly user: UserWithRole | null
  readonly loading: boolean
  readonly error: string | null
  readonly notifications: DashboardNotification[]
}

/** Права доступа пользователей */
export type UserRole = 'admin' | 'manager' | 'user'

/** Пользователь с ролью */
export interface UserWithRole {
  readonly id: string
  readonly email: string
  readonly role: UserRole
  readonly name?: string
  readonly avatar?: string
  readonly lastLogin?: Date
}

/** Уведомления дашборда */
export interface DashboardNotification {
  readonly id: string
  readonly type: 'info' | 'warning' | 'error' | 'success'
  readonly title: string
  readonly message: string
  readonly timestamp: Date
  readonly read: boolean
  readonly actionLabel?: string
  readonly actionUrl?: string
}

/** Конфигурация дашборда */
export interface DashboardConfig {
  readonly theme: 'light' | 'dark' | 'system'
  readonly compactMode: boolean
  readonly showDiagnostics: boolean
  readonly autoRefresh: boolean
  readonly refreshInterval: number
}

/** Контекст дашборда */
export interface DashboardContextValue {
  readonly state: DashboardState
  readonly config: DashboardConfig
  readonly actions: DashboardActions
  readonly permissions: UserPermissions
}

/** Действия дашборда */
export interface DashboardActions {
  readonly setActiveTab: (tab: DashboardTab) => void
  readonly refreshStats: () => Promise<void>
  readonly loadUser: () => Promise<void>
  readonly addNotification: (notification: Omit<DashboardNotification, 'id' | 'timestamp'>) => void
  readonly markNotificationRead: (id: string) => void
  readonly updateConfig: (config: Partial<DashboardConfig>) => void
}

/** Права пользователя */
export interface UserPermissions {
  readonly canViewTab: (tab: DashboardTab) => boolean
  readonly canManageUsers: boolean
  readonly canExportData: boolean
  readonly canImportData: boolean
  readonly canModifyPrices: boolean
  readonly canAccessAdminFeatures: boolean
  readonly isAdmin: boolean
  readonly isManager: boolean
}

/** Метрики производительности */
export interface PerformanceMetrics {
  readonly loadTime: number
  readonly renderTime: number
  readonly tabSwitchTime: number
  readonly lastUpdate: Date
  readonly memoryUsage?: number
}

/** Настройки локального хранилища */
export interface DashboardStorage {
  readonly activeTab?: DashboardTab
  readonly config?: Partial<DashboardConfig>
  readonly readNotifications?: string[]
  readonly dismissedTips?: string[]
}

// ===========================
// 🎨 ТИПЫ КОМПОНЕНТОВ
// ===========================

/** Пропсы основного дашборда */
export interface DashboardProps {
  readonly initialTab?: DashboardTab
  readonly showHeader?: boolean
  readonly compactMode?: boolean
}

/** Пропсы шапки дашборда */
export interface DashboardHeaderProps {
  readonly user: UserWithRole
  readonly notifications: DashboardNotification[]
  readonly onNotificationClick: (id: string) => void
  readonly onLogout: () => void
}

/** Пропсы навигации по вкладкам */
export interface DashboardTabsProps {
  readonly tabs: readonly TabDefinition[]
  readonly activeTab: DashboardTab
  readonly onTabChange: (tab: DashboardTab) => void
  readonly permissions: UserPermissions
}

/** Пропсы контента дашборда */
export interface DashboardContentProps {
  readonly activeTab: DashboardTab
  readonly tabDefinition: TabDefinition
  readonly loading?: boolean
  readonly error?: string | null
}

/** Пропсы статистических карточек */
export interface StatCardProps {
  readonly title: string
  readonly value: string | number
  readonly description?: string
  readonly icon?: ReactNode
  readonly trend?: {
    readonly value: number
    readonly label: string
    readonly direction: 'up' | 'down' | 'neutral'
  }
  readonly loading?: boolean
}

// ===========================
// 🔐 ТИПЫ БЕЗОПАСНОСТИ
// ===========================

/** Результат проверки прав доступа */
export interface PermissionCheckResult {
  readonly allowed: boolean
  readonly reason?: string
  readonly requiredRole?: UserRole
}

/** Конфигурация защищенного маршрута */
export interface RouteGuardConfig {
  readonly requiredRole: UserRole
  readonly redirectTo?: string
  readonly fallbackComponent?: ComponentType
}

// ===========================
// 🎯 УТИЛИТАРНЫЕ ТИПЫ
// ===========================

/** Omit helper для создания типов без определенных полей */
export type DashboardTabWithoutComponent = Omit<TabDefinition, 'component'>

/** Pick helper для извлечения определенных полей */
export type DashboardUserInfo = Pick<UserWithRole, 'email' | 'role' | 'name'>

/** Partial helper для опциональных конфигураций */
export type PartialDashboardConfig = Partial<DashboardConfig>

/** Функция валидации вкладки */
export type TabValidator = (tab: DashboardTab, user: UserWithRole) => PermissionCheckResult

/** Функция рендеринга иконки */
export type IconRenderer = (props: { className?: string }) => ReactNode

/** Обработчик событий дашборда */
export type DashboardEventHandler<T = void> = (data?: T) => void | Promise<void>

// ===========================
// 🔄 СОСТОЯНИЕ И СОБЫТИЯ
// ===========================

/** События дашборда */
export interface DashboardEvents {
  readonly tabChanged: DashboardEventHandler<DashboardTab>
  readonly statsRefreshed: DashboardEventHandler<FurnitureFactoryStats>
  readonly userLoaded: DashboardEventHandler<UserWithRole>
  readonly errorOccurred: DashboardEventHandler<string>
  readonly notificationAdded: DashboardEventHandler<DashboardNotification>
}

/** Состояние загрузки */
export interface LoadingState {
  readonly [key: string]: boolean
}

/** Состояние ошибок */
export interface ErrorState {
  readonly [key: string]: string | null
}