/**
 * @file contexts/AuthContext.tsx
 * @description Функциональный контекст аутентификации для WASSER
 * 
 * Особенности:
 * - Типобезопасная архитектура с TypeScript
 * - Интеграция с Supabase Auth
 * - React.memo и useMemo для оптимизации
 * - Полное управление состоянием пользователя
 */

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useMemo, 
  useCallback,
  ReactNode 
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// ===========================
// 🎯 ТИПОБЕЗОПАСНЫЕ ИНТЕРФЕЙСЫ
// ===========================

export interface AuthUser extends User {
  readonly isAdmin?: boolean
  readonly role?: 'admin' | 'manager' | 'viewer'
  readonly permissions?: readonly string[]
}

export interface AuthState {
  readonly user: AuthUser | null
  readonly session: Session | null
  readonly isLoading: boolean
  readonly isAuthenticated: boolean
  readonly error: string | null
}

export interface AuthContextValue extends AuthState {
  // Методы аутентификации
  readonly signIn: (email: string, password: string) => Promise<{ error: any }>
  readonly signUp: (email: string, password: string) => Promise<{ error: any }>
  readonly signOut: () => Promise<void>
  readonly clearError: () => void
  
  // Проверки разрешений
  readonly isAdmin: boolean
  readonly hasPermission: (permission: string) => boolean
}

// ===========================
// 🏗️ КОНТЕКСТ И ПРОВАЙДЕР
// ===========================

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  readonly children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = React.memo(({ children }) => {
  // Основное состояние
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // ===========================
  // 🔐 ПРОВЕРКА АДМИНСКИХ ПРАВ
  // ===========================
  
  const isAdmin = useMemo(() => {
    if (!user?.email) return false
    
    const adminEmails = [
      process.env.VITE_ADMIN_EMAIL_1,
      process.env.VITE_ADMIN_EMAIL_2,
      process.env.VITE_ADMIN_EMAIL_3,
      'admin@wasser.ru',  // Fallback email
    ].filter(Boolean)
    
    return adminEmails.includes(user.email)
  }, [user?.email])

  // ===========================
  // 📱 МЕТОДЫ АУТЕНТИФИКАЦИИ
  // ===========================

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setError(error.message)
        return { error }
      }
      
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка входа'
      setError(errorMessage)
      return { error: err }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) {
        setError(error.message)
        return { error }
      }
      
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка регистрации'
      setError(errorMessage)
      return { error: err }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } catch (err) {
      console.error('Ошибка выхода:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // ===========================
  // 🛡️ ПРОВЕРКА РАЗРЕШЕНИЙ
  // ===========================

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false
    if (isAdmin) return true // Админы имеют все права
    
    // В продакшене здесь будет проверка через API
    const userPermissions = user.permissions || []
    return userPermissions.includes(permission)
  }, [user, isAdmin])

  // ===========================
  // 🔄 ИНИЦИАЛИЗАЦИЯ И ПОДПИСКИ
  // ===========================

  useEffect(() => {
    let mounted = true

    // Получение текущей сессии
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (mounted) {
          if (error) {
            console.error('Ошибка получения сессии:', error)
            setError(error.message)
          } else {
            setSession(session)
            setUser(session?.user as AuthUser || null)
          }
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error('Ошибка инициализации auth:', err)
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Подписка на изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user as AuthUser || null)
        setIsLoading(false)

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  // ===========================
  // 💾 МЕМОИЗИРОВАННОЕ ЗНАЧЕНИЕ КОНТЕКСТА
  // ===========================

  const contextValue = useMemo<AuthContextValue>(() => ({
    // Состояние
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    error,
    
    // Методы
    signIn,
    signUp,
    signOut,
    clearError,
    
    // Разрешения
    isAdmin,
    hasPermission,
  }), [
    user,
    session,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
    isAdmin,
    hasPermission,
  ])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
})

AuthProvider.displayName = 'AuthProvider'

// ===========================
// 🪝 КАСТОМНЫЙ ХУК
// ===========================

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext должен использоваться внутри AuthProvider')
  }
  return context
}

// ===========================
// 🛡️ HOC ДЛЯ ЗАЩИЩЕННЫХ МАРШРУТОВ
// ===========================

interface RequireAuthProps {
  readonly children: ReactNode
  readonly fallback?: ReactNode
  readonly requireAdmin?: boolean
}

export const RequireAuth: React.FC<RequireAuthProps> = React.memo(({
  children,
  fallback,
  requireAdmin = false
}) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuthContext()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || <div>Требуется авторизация</div>
  }

  if (requireAdmin && !isAdmin) {
    return <div>Нет прав доступа</div>
  }

  return <>{children}</>
})

RequireAuth.displayName = 'RequireAuth'

export default AuthContext
