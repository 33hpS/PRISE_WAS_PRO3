/**
 * @file context/dashboard/DashboardContext.tsx
 * @description Контекст управления состоянием дашборда мебельной фабрики WASSER
 * 
 * Функциональная архитектура:
 * - Типобезопасное управление состоянием
 * - Мемоизированные вычисления
 * - Локальное кеширование
 * - Система прав доступа
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react'
import type { 
  DashboardState, 
  DashboardActions, 
  DashboardContextValue,
  DashboardTab,
  FurnitureFactoryStats,
  UserWithRole,
  DashboardNotification,
  DashboardConfig,
  UserPermissions
} from '../../types/dashboard/types'
import { getCurrentUserWithRole } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

// ===========================
// 🎯 НАЧАЛЬНОЕ СОСТОЯНИЕ
// ===========================

const INITIAL_STATE: DashboardState = {
  activeTab: 'overview',
  stats: {
    materials: 0,
    products: 0,
    collections: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingPriceLists: 0,
    lastUpdated: new Date()
  },
  statsLoading: true,
  user: null,
  loading: true,
  error: null,
  notifications: []
}

const INITIAL_CONFIG: DashboardConfig = {
  theme: 'light',
  compactMode: false,
  showDiagnostics: process.env.NODE_ENV === 'development',
  autoRefresh: true,
  refreshInterval: 30000 // 30 секунд
}

// ===========================
// 🔄 ДЕЙСТВИЯ РЕДУКТОРА
// ===========================

type DashboardAction =
  | { type: 'SET_ACTIVE_TAB'; payload: DashboardTab }
  | { type: 'SET_STATS'; payload: FurnitureFactoryStats }
  | { type: 'SET_STATS_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: UserWithRole | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_NOTIFICATION'; payload: DashboardNotification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }

/** Редуктор состояния дашборда с иммутабельными обновлениями */
const dashboardReducer = (state: DashboardState, action: DashboardAction): DashboardState => {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload }
      
    case 'SET_STATS':
      return { ...state, stats: action.payload, statsLoading: false }
      
    case 'SET_STATS_LOADING':
      return { ...state, statsLoading: action.payload }
      
    case 'SET_USER':
      return { ...state, user: action.payload }
      
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
      
    case 'SET_ERROR':
      return { ...state, error: action.payload }
      
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [action.payload, ...state.notifications].slice(0, 50) // Лимит 50 уведомлений
      }
      
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        )
      }
      
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] }
      
    default:
      return state
  }
}

// ===========================
// 🔐 СИСТЕМА ПРАВ ДОСТУПА
// ===========================

/** Мемоизированная функция проверки прав пользователя */
const createUserPermissions = (user: UserWithRole | null): UserPermissions => {
  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager' || isAdmin
  
  return {
    canViewTab: (tab: DashboardTab): boolean => {
      const adminOnlyTabs: DashboardTab[] = [
        'upload', 'types', 'paint', 'markup', 'sinks', 'sets', 'history', 'users'
      ]
      return !adminOnlyTabs.includes(tab) || isAdmin
    },
    canManageUsers: isAdmin,
    canExportData: isManager,
    canImportData: isAdmin,
    canModifyPrices: isManager,
    canAccessAdminFeatures: isAdmin,
    isAdmin,
    isManager
  }
}

// ===========================
// 🎯 КОНТЕКСТ И ПРОВАЙДЕР
// ===========================

const DashboardContext = createContext<DashboardContextValue | null>(null)

/** Провайдер контекста дашборда с функциональной архитектурой */
export const DashboardProvider: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, INITIAL_STATE)
  const [config, setConfig] = React.useState<DashboardConfig>(INITIAL_CONFIG)
  
  // ===========================
  // 🧮 МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ
  // ===========================
  
  /** Права пользователя с мемоизацией */
  const permissions = useMemo(() => 
    createUserPermissions(state.user), 
    [state.user]
  )
  
  /** Генератор уникальных ID для уведомлений */
  const generateNotificationId = useCallback(() => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])
  
  // ===========================
  // 🔄 ДЕЙСТВИЯ ДАШБОРДА
  // ===========================
  
  /** Смена активной вкладки с проверкой прав */
  const setActiveTab = useCallback((tab: DashboardTab) => {
    if (permissions.canViewTab(tab)) {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })
      
      // Сохранение в localStorage
      try {
        localStorage.setItem('dashboard_active_tab', tab)
      } catch (error) {
        console.warn('Не удалось сохранить активную вкладку в localStorage:', error)
      }
    } else {
      dispatch({ 
        type: 'ADD_NOTIFICATION', 
        payload: {
          id: generateNotificationId(),
          type: 'warning',
          title: 'Недостаточно прав',
          message: `У вас нет прав для доступа к разделу "${tab}"`,
          timestamp: new Date(),
          read: false
        }
      })
    }
  }, [permissions, generateNotificationId])
  
  /** Загрузка статистики мебельной фабрики */
  const refreshStats = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_STATS_LOADING', payload: true })
      
      // Параллельная загрузка данных с Supabase
      const [materialsRes, productsRes, collectionsRes] = await Promise.all([
        supabase.from('materials').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('collections').select('id', { count: 'exact', head: true })
      ])
      
      const stats: FurnitureFactoryStats = {
        materials: materialsRes.count || 0,
        products: productsRes.count || 0,
        collections: collectionsRes.count || 0,
        activeOrders: Math.floor(Math.random() * 100), // Mock данные
        totalRevenue: Math.floor(Math.random() * 2000000),
        pendingPriceLists: Math.floor(Math.random() * 15),
        lastUpdated: new Date()
      }
      
      dispatch({ type: 'SET_STATS', payload: stats })
      
      // Кеширование статистики
      try {
        localStorage.setItem('dashboard_stats', JSON.stringify(stats))
      } catch (error) {
        console.warn('Не удалось кешировать статистику:', error)
      }
      
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Ошибка загрузки статистики'
      })
    }
  }, [])
  
  /** Загрузка данных пользователя */
  const loadUser = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const user = await getCurrentUserWithRole()
      dispatch({ type: 'SET_USER', payload: user })
      dispatch({ type: 'SET_ERROR', payload: null })
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error)
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Ошибка аутентификации'
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])
  
  /** Добавление уведомления */
  const addNotification = useCallback((
    notification: Omit<DashboardNotification, 'id' | 'timestamp'>
  ) => {
    const fullNotification: DashboardNotification = {
      ...notification,
      id: generateNotificationId(),
      timestamp: new Date()
    }
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: fullNotification })
  }, [generateNotificationId])
  
  /** Отметка уведомления как прочитанного */
  const markNotificationRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id })
  }, [])
  
  /** Обновление конфигурации */
  const updateConfig = useCallback((newConfig: Partial<DashboardConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
    
    // Сохранение конфигурации
    try {
      const updatedConfig = { ...config, ...newConfig }
      localStorage.setItem('dashboard_config', JSON.stringify(updatedConfig))
    } catch (error) {
      console.warn('Не удалось сохранить конфигурацию:', error)
    }
  }, [config])
  
  // ===========================
  // 🔄 ЭФФЕКТЫ ЖИЗНЕННОГО ЦИКЛА
  // ===========================
  
  /** Инициализация дашборда */
  useEffect(() => {
    const initializeDashboard = async () => {
      // Загрузка сохраненной конфигурации
      try {
        const savedConfig = localStorage.getItem('dashboard_config')
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig)
          setConfig(prev => ({ ...prev, ...parsedConfig }))
        }
        
        const savedTab = localStorage.getItem('dashboard_active_tab') as DashboardTab
        if (savedTab) {
          dispatch({ type: 'SET_ACTIVE_TAB', payload: savedTab })
        }
        
        // Попытка загрузить кешированную статистику
        const cachedStats = localStorage.getItem('dashboard_stats')
        if (cachedStats) {
          const stats = JSON.parse(cachedStats)
          // Проверяем, что данные не старше 5 минут
          if (new Date(stats.lastUpdated).getTime() > Date.now() - 5 * 60 * 1000) {
            dispatch({ type: 'SET_STATS', payload: stats })
          }
        }
      } catch (error) {
        console.warn('Ошибка инициализации из localStorage:', error)
      }
      
      // Загрузка актуальных данных
      await Promise.all([loadUser(), refreshStats()])
    }
    
    initializeDashboard()
  }, [loadUser, refreshStats])
  
  /** Автообновление статистики */
  useEffect(() => {
    if (!config.autoRefresh) return
    
    const interval = setInterval(() => {
      refreshStats()
    }, config.refreshInterval)
    
    return () => clearInterval(interval)
  }, [config.autoRefresh, config.refreshInterval, refreshStats])
  
  // ===========================
  // 🎯 МЕМОИЗИРОВАННОЕ ЗНАЧЕНИЕ КОНТЕКСТА
  // ===========================
  
  const contextValue = useMemo<DashboardContextValue>(() => ({
    state,
    config,
    permissions,
    actions: {
      setActiveTab,
      refreshStats,
      loadUser,
      addNotification,
      markNotificationRead,
      updateConfig
    }
  }), [
    state, 
    config, 
    permissions, 
    setActiveTab, 
    refreshStats, 
    loadUser, 
    addNotification, 
    markNotificationRead, 
    updateConfig
  ])
  
  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  )
})

DashboardProvider.displayName = 'DashboardProvider'

// ===========================
// 🔧 ХУКИ ДОСТУПА К КОНТЕКСТУ
// ===========================

/** Хук доступа к контексту дашборда */
export const useDashboard = (): DashboardContextValue => {
  const context = useContext(DashboardContext)
  
  if (!context) {
    throw new Error('useDashboard должен использоваться внутри DashboardProvider')
  }
  
  return context
}

/** Хук доступа к состоянию дашборда */
export const useDashboardState = () => {
  const { state } = useDashboard()
  return state
}

/** Хук доступа к действиям дашборда */
export const useDashboardActions = () => {
  const { actions } = useDashboard()
  return actions
}

/** Хук доступа к правам пользователя */
export const useUserPermissions = () => {
  const { permissions } = useDashboard()
  return permissions
}

export default DashboardContext