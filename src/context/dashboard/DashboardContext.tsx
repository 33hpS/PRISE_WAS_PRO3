/**
 * @file context/dashboard/DashboardContext.tsx
 * @description Функциональный контекст дашборда с типобезопасностью
 * Современный подход с useReducer и мемоизацией
 */

import React, { createContext, useContext, useReducer, useMemo, useCallback, ReactNode } from 'react'
import type { DashboardState, DashboardTab, DashboardContextValue, DashboardStats } from '../../types/dashboard/types'

type DashboardAction =
  | { type: 'SET_ACTIVE_TAB'; payload: DashboardTab }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATS'; payload: DashboardStats }
  | { type: 'CLEAR_ERROR' }

const initialState: DashboardState = {
  activeTab: 'overview',
  stats: null,
  user: null,
  loading: 'idle',
  error: null
}

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload ? 'loading' : 'success' }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: 'error' }
    case 'SET_STATS':
      return { ...state, stats: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

interface DashboardProviderProps {
  readonly children: ReactNode
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)
  
  // Мемоизированная проверка админских прав
  const isAdmin = useMemo(() => {
    if (!state.user?.email) return false
    const adminEmails = [
      process.env.VITE_ADMIN_EMAIL_1,
      process.env.VITE_ADMIN_EMAIL_2,
      process.env.VITE_ADMIN_EMAIL_3
    ].filter(Boolean)
    return adminEmails.includes(state.user.email)
  }, [state.user?.email])

  // Мемоизированные callback функции
  const setActiveTab = useCallback((tab: DashboardTab) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })
  }, [])

  const refreshStats = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // Мокированная статистика - в продакшене замените на API
      const mockStats: DashboardStats = {
        materials: 1248,
        products: 342,
        collections: 28,
        priceLists: 156,
        lastUpdated: new Date().toISOString()
      }
      await new Promise(resolve => setTimeout(resolve, 500)) // Имитация API
      dispatch({ type: 'SET_STATS', payload: mockStats })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Ошибка загрузки' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const contextValue = useMemo<DashboardContextValue>(() => ({
    state,
    isAdmin,
    setActiveTab,
    refreshStats,
    clearError
  }), [state, isAdmin, setActiveTab, refreshStats, clearError])

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = (): DashboardContextValue => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard должен использоваться внутри DashboardProvider')
  }
  return context
}
