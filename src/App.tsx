/**
 * Main application component with routing
 * ИСПРАВЛЕНО: добавлен явный импорт React + использование react-router-dom
 */
import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Collections from './pages/Collections'
import Materials from './pages/Materials'
import Products from './pages/Products'
import Journal from './pages/Journal'
import About from './pages/About'
import Dashboard from './pages/Dashboard'
import { getCurrentUser, supabase } from './lib/supabase'
import HeadManager from './components/HeadManager'
import SyncStatusBar from './components/SyncStatusBar'
import { Toaster } from 'sonner'

/**
 * Main App component with router configuration and authentication.
 * Добавлена поддержка локальной сессии "test-user" (без пароля) для разработки.
 */
export default function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Инициализация проверки
    checkUser()

    // Подписка на события auth Supabase (для реальной авторизации)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setUser(session?.user || null)
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
          }
        } catch (err) {
          console.error('Auth state change error:', err)
          setError('Ошибка аутентификации')
        } finally {
          setLoading(false)
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  /**
   * Check current user authentication status
   * Порядок проверки:
   * 1) Локальная dev-сессия 'test-user'
   * 2) Локальная supabase-сессия 'supabase-user'
   * 3) Текущая активная сессия Supabase
   */
  const checkUser = async () => {
    try {
      // 1) Локальная dev-сессия (без пароля)
      const testUserRaw = localStorage.getItem('test-user')
      if (testUserRaw) {
        try {
          const dev = JSON.parse(testUserRaw)
          if (dev?.authenticated && dev?.email && dev?.role) {
            const sessionAge = Date.now() - (dev.timestamp || 0)
            const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 дней
            if (sessionAge < maxAge) {
              setUser({ id: dev.id, email: dev.email, role: dev.role })
              setLoading(false)
              return
            }
            localStorage.removeItem('test-user')
          }
        } catch {
          localStorage.removeItem('test-user')
        }
      }

      // 2) Локальная сохранённая supabase-сессия
      const supabaseUserRaw = localStorage.getItem('supabase-user')
      if (supabaseUserRaw) {
        try {
          const userData = JSON.parse(supabaseUserRaw)
          if (userData?.authenticated && userData?.email && userData?.role) {
            const sessionAge = Date.now() - (userData.timestamp || 0)
            const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 дней
            if (sessionAge < maxAge) {
              setUser({ id: userData.id, email: userData.email, role: userData.role })
              setLoading(false)
              return
            } else {
              localStorage.removeItem('supabase-user')
            }
          }
        } catch {
          localStorage.removeItem('supabase-user')
        }
      }

      // 3) Проверка реальной активной сессии Supabase
      try {
        const currentUser = await getCurrentUser()
        if (currentUser && currentUser.email) {
          let userRole = 'manager'
          if (currentUser.email === 'sherhan1988hp@gmail.com' || currentUser.email === 'admin@wasser.com') {
            userRole = 'admin'
          }
          localStorage.setItem('supabase-user', JSON.stringify({
            id: currentUser.id,
            email: currentUser.email,
            role: userRole,
            authenticated: true,
            timestamp: Date.now()
          }))
          setUser({ id: currentUser.id, email: currentUser.email, role: userRole })
          setLoading(false)
          return
        }
      } catch (authError) {
        console.warn('Supabase auth check failed:', authError)
        // Не останавливаем загрузку на ошибке Supabase, продолжаем без авторизации
      }

      // Нет активных сессий
      setUser(null)
    } catch (error) {
      console.error('Ошибка проверки пользователя:', error)
      setError('Ошибка при проверке авторизации')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Загрузка...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-lg font-semibold mb-2">Ошибка загрузки</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => {
              setError(null)
              setLoading(true)
              checkUser()
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  // Not authenticated - show login
  if (!user) {
    return <Login onLogin={checkUser} />
  }

  // Main application with routing
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <HeadManager />
        <SyncStatusBar />
        <Toaster position="top-right" />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLogin={checkUser} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/products" element={<Products />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  )
}