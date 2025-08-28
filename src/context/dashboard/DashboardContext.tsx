/**
 * @file context/dashboard/DashboardContext.tsx
 * @description Функциональный контекст дашборда с типобезопасностью и мемоизацией
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react'
import type { DashboardState, UserWithRole, DashboardTab, DashboardStats } from '../../types/dashboard/types'

// ===========================
// 🎯 ТИПЫ КОНТЕКСТА
// ===========================

interface DashboardContextValue {
  readonly state: DashboardState
  readonly isAdmin: boolean
  readonly actions: {
    readonly setLoading: (loading: boolean) => void
    readonly setUser: (user: UserWithRole | null) => void
    readonly setActiveTab: (tab: DashboardTab) => void
    readonly setStats: (stats: DashboardStats) => void
    readonly setError: (error: string | null) => void
    readonly initializeState: () => void
  }
  readonly metrics: {
    readonly data: {
      readonly loadTime: number
      readonly tabSwitchTime: number
      readonly lastUpdate: Date
    }
    readonly startTimer: () => number
    readonly endTimer: (startTime: number, operation: string) => number
  }
}

// ===========================
// 🌐 КОНТЕКСТ И ПРОВАЙДЕР
// ===========================

const DashboardContext = createContext<DashboardContextValue | null>(null)

interface DashboardProviderProps {
  readonly children: ReactNode
}

export const DashboardProvider: React.FC<DashboardProviderProps> = React.memo(({ children }) => {
  // Начальное состояние
  const [state, setState] = useState<DashboardState>(() => ({
    activeTab: 'overview',
    stats: { materials: 1248, products: 342, collections: 28, priceLists: 156 },
    statsLoading: false,
    user: null,
    loading: false,
    error: null
  }))

  // Метрики производительности
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    tabSwitchTime: 0,
    lastUpdate: new Date()
  })

  // ===========================
  // 🔧 МЕМОИЗИРОВАННЫЕ ДЕЙСТВИЯ
  // ===========================

  const actions = useMemo(() => ({
    setLoading: (loading: boolean) => {
      setState(prev => ({ ...prev, loading }))
    },
    
    setUser: (user: UserWithRole | null) => {
      setState(prev => ({ ...prev, user, loading: false }))
    },
    
    setActiveTab: (tab: DashboardTab) => {
      const startTime = performance.now()
      setState(prev => ({ ...prev, activeTab: tab }))
      
      // Сохранение в localStorage
      try {
        localStorage.setItem('wasser:dashboard:active-tab', tab)
      } catch (error) {
        console.warn('Ошибка сохранения активной вкладки:', error)
      }
      
      // Метрики переключения
      requestAnimationFrame(() => {
        const endTime = performance.now()
        const switchTime = endTime - startTime
        setMetrics(prev => ({
          ...prev,
          tabSwitchTime: switchTime,
          lastUpdate: new Date()
        }))
      })
    },
    
    setStats: (stats: DashboardStats) => {
      setState(prev => ({ ...prev, stats: { ...stats, lastUpdated: new Date() } }))
    },
    
    setError: (error: string | null) => {
      setState(prev => ({ ...prev, error, loading: false }))
    },
    
    initializeState: () => {
      // Восстановление активной вкладки
      try {
        const savedTab = localStorage.getItem('wasser:dashboard:active-tab') as DashboardTab
        if (savedTab) {
          setState(prev => ({ ...prev, activeTab: savedTab }))
        }
      } catch (error) {
        console.warn('Ошибка восстановления состояния:', error)
      }
      
      // Попытка получить пользователя из localStorage
      try {
        const testUser = localStorage.getItem('test-user')
        if (testUser) {
          const parsed = JSON.parse(testUser)
          if (parsed?.authenticated) {
            setState(prev => ({ ...prev, user: {
              id: parsed.id || 'test-user',
              email: parsed.email || 'admin@wasser.com',
              role: parsed.role || 'admin',
              name: parsed.name
            }}))
          }
        }
      } catch (error) {
        console.warn('Ошибка загрузки пользователя:', error)
      }
    }
  }), [])

  // Определение административных прав
  const isAdmin = useMemo(() => {
    if (!state.user) return false
    
    // Проверка роли
    if (state.user.role === 'admin') return true
    
    // Проверка по email
    const adminEmails = ['admin@wasser.com', 'sherhan1988hp@gmail.com']
    if (state.user.email && adminEmails.includes(state.user.email)) return true
    
    return false
  }, [state.user])

  // Метрики производительности
  const metricsActions = useMemo(() => ({
    data: metrics,
    startTimer: () => performance.now(),
    endTimer: (startTime: number, operation: string) => {
      const duration = performance.now() - startTime
      setMetrics(prev => ({
        ...prev,
        [operation === 'load' ? 'loadTime' : 'tabSwitchTime']: duration,
        lastUpdate: new Date()
      }))
      console.log(`⚡ Dashboard ${operation}: ${duration.toFixed(2)}ms`)
      return duration
    }
  }), [metrics])

  // Инициализация при монтировании
  useEffect(() => {
    const initTimer = performance.now()
    actions.initializeState()
    
    // Метрики загрузки
    requestAnimationFrame(() => {
      metricsActions.endTimer(initTimer, 'load')
    })
  }, [actions, metricsActions])

  const contextValue: DashboardContextValue = useMemo(() => ({
    state,
    isAdmin,
    actions,
    metrics: metricsActions
  }), [state, isAdmin, actions, metricsActions])

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  )
})

DashboardProvider.displayName = 'DashboardProvider'

// ===========================
// 🎣 ХУК ДЛЯ ИСПОЛЬЗОВАНИЯ КОНТЕКСТА
// ===========================

export const useDashboard = (): DashboardContextValue => {
  const context = useContext(DashboardContext)
  
  if (!context) {
    throw new Error('useDashboard должен использоваться внутри DashboardProvider')
  }
  
  return context
}
