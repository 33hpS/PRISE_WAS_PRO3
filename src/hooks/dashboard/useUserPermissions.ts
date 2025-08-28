/**
 * @file hooks/useUserPermissions.ts  
 * @description Хук управления правами пользователей с диагностикой
 */

import { useMemo, useCallback } from 'react'
import { UserWithRole, UserRole } from '../../types/dashboard/types'
import { PERMISSIONS_CONFIG, hasTabAccess, getAvailableTabs, isAdminUser } from '../../config/dashboard/permissions'
import { DashboardStorage } from '../../services/dashboard/storage'

// ===========================
//🔒 ТИП ДИАГНОСТИКИ ПРАВ
//===========================

interface PermissionsDiagnostics {
  readonly userRole: UserRole | null
  readonly userEmail: string | null
  readonly isAdminByEmail: boolean
  readonly isAdminByRole: boolean
  readonly testUser: any
  readonly supabaseUser: any
  readonly availableTabsCount: number
  readonly adminTabsCount: number
  readonly timestamp: Date
}

interface UserPermissionsResult {
  readonly isAdmin: boolean
  readonly availableTabs: readonly string[]
  readonly diagnostics: PermissionsDiagnostics
  readonly hasPermission: (feature: string) => boolean
  readonly canAccessTab: (tab: string) => boolean
}

// ===========================
//🎣 ХУК ПРАВ ПОЛЬЗОВАТЕЛЯ
//===========================

export const useUserPermissions = (user: UserWithRole | null): UserPermissionsResult => {
  // Мемоизированная диагностика прав
  const diagnostics = useMemo<PermissionsDiagnostics>(() => {
    const testUser = DashboardStorage.getTestUser()
    const supabaseUser = DashboardStorage.getSupabaseUser()
    
    return {
      userRole: user?.role || null,
      userEmail: user?.email || null,
      isAdminByEmail: user?.email ? isAdminUser(user.email) : false,
      isAdminByRole: user?.role === 'admin',
      testUser,
      supabaseUser,
      availableTabsCount: user ? getAvailableTabs(user.role, user.email).length : 0,
      adminTabsCount: Object.values(PERMISSIONS_CONFIG.tabPermissions).filter(p => p.adminOnly).length,
      timestamp: new Date()
    }
  }, [user])

  // Определение административных прав
  const isAdmin = useMemo(() => {
    if (!user) return false

    // 1. Проверка роли админа
    if (user.role === 'admin') {
      console.log('✅ Admin права по роли:', user.role)
      return true
    }

    // 2. Проверка по email
    if (user.email && isAdminUser(user.email)) {
      console.log('✅ Admin права по email:', user.email)
      return true
    }

    // 3. Проверка через localStorage (test-user)
    const testUser = DashboardStorage.getTestUser()
    if (testUser?.role === 'admin') {
      console.log('✅ Admin права через test-user:', testUser)
      return true
    }

    // 4. Проверка через localStorage (supabase-user)
    const supabaseUser = DashboardStorage.getSupabaseUser()
    if (supabaseUser?.role === 'admin') {
      console.log('✅ Admin права через supabase-user:', supabaseUser)
      return true
    }

    console.log('❌ Нет admin прав:', diagnostics)
    return false
  }, [user, diagnostics])

  // Доступные вкладки
  const availableTabs = useMemo(() => {
    if (!user) return []
    return getAvailableTabs(user.role, user.email)
  }, [user])

  // Проверка доступа к функциям
  const hasPermission = useCallback((feature: string): boolean => {
    if (!user) return false
    if (isAdmin) return true
    
    // Проверка специфичных разрешений пользователя
    return user.permissions?.includes(feature) || false
  }, [user, isAdmin])

  // Проверка доступа к вкладке
  const canAccessTab = useCallback((tab: string): boolean => {
    if (!user) return false
    return hasTabAccess(tab as any, user.role, user.email)
  }, [user])

  // Логирование для разработки
  if (process.env.NODE_ENV === 'development') {
    console.group('🔒 User Permissions Diagnostics')
    console.log('User:', user)
    console.log('Is Admin:', isAdmin)
    console.log('Available Tabs:', availableTabs.length)
    console.log('Diagnostics:', diagnostics)
    console.groupEnd()
  }

  return {
    isAdmin,
    availableTabs,
    diagnostics,
    hasPermission,
    canAccessTab
  }
}

// ===========================
//🎣 ХУК ФИЛЬТРАЦИИ ВКЛАДОК
//===========================

export const useDashboardTabs = (isAdmin: boolean) => {
  return useMemo(() => {
    // Здесь будет импорт TAB_DEFINITIONS из основного файла
    // const availableTabs = TAB_DEFINITIONS.filter(tab => !tab.adminOnly || isAdmin)
    
    console.log('🔍 Фильтрация вкладок:', {
      isAdmin,
      // totalTabs: TAB_DEFINITIONS.length,
      // availableTabs: availableTabs.length,
    })

    // Возвращаем отфильтрованные вкладки
    return [] // Заглушка, будет заменена при интеграции
  }, [isAdmin])
}

// ===========================
//🎣 ХУК АВТОРИЗАЦИИ
//===========================

export const useAuth = () => {
  const logout = useCallback(async () => {
    try {
      // Очистка всех данных аутентификации
      DashboardStorage.clearAuthData()
      DashboardStorage.clearDashboardData()

      // Выход из Supabase
      const { supabase } = await import('../../lib/supabase')
      await supabase.auth.signOut()

      // Перенаправление на login
      window.location.href = '/login'
    } catch (error) {
      console.error('Ошибка при выходе:', error)
      // Принудительный переход даже при ошибке
      window.location.href = '/login'
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return data.user
    } catch (error) {
      console.error('Ошибка входа:', error)
      throw error
    }
  }, [])

  return { login, logout }
}

