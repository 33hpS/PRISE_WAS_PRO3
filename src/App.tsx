/**
 * Main application component with routing (react-router core only).
 * Uses MemoryRouter because HashRouter is not available in the core package.
 * Initial route is derived from location.hash to preserve hash-based deep links in preview.
 * Additionally: we sync MemoryRouter with window.location.hash after mount
 * by listening to `hashchange` and forcing MemoryRouter remount with a keyed state.
 */
import { MemoryRouter, Route, Routes } from 'react-router'
import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Collections from './pages/Collections'
import Materials from './pages/Materials'
import Products from './pages/Products'
import Journal from './pages/Journal'
import About from './pages/About'
import { getCurrentUser, supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import HeadManager from './components/HeadManager'
import SyncStatusBar from './components/SyncStatusBar'
import { Toaster } from 'sonner'

/**
 * Main App component with router configuration and authentication.
 * Добавлена поддержка локальной сессии "test-user" (без пароля) для разработки.
 * Дополнительно: синхронизация MemoryRouter с изменениями hash (hashchange).
 */
export default function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)

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
            // Просрочено — очистим
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
      } catch {
        // ignore
      }

      // Нет активных сессий
      setUser(null)
    } catch (error) {
      console.error('Ошибка проверки пользователя:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    )
  }

  /**
   * Derive initial entry for MemoryRouter from hash (e.g., "#/login" -> "/login")
   * and keep it in sync with window.location.hash after mount.
   * MemoryRouter не читает hash после инициализации, поэтому мы храним путь в состоянии
   * и принудительно перемонтируем роутер через key.
   */
  const getHashPath = () =>
    typeof window !== 'undefined' && window.location?.hash
      ? window.location.hash.slice(1) || '/'
      : '/'

  const [hashPath, setHashPath] = useState<string>(getHashPath())

  useEffect(() => {
    /** Handle hash changes and update state */
    const onHashChange = () => setHashPath(getHashPath())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <>
      {/* Глобальное управление head (title, lang, favicon) */}
      <HeadManager />

      {/* Глобальный Toaster для единых уведомлений */}
      <Toaster richColors position="top-right" />

      {/* MemoryRouter синхронизирован с hash через key + state */}
      <MemoryRouter key={hashPath} initialEntries={[hashPath]}>
        {/* Индикатор синхронизации видим только во время sync */}
        <SyncStatusBar />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/collections" element={user ? <Collections /> : <Login />} />
          <Route path="/materials" element={user ? <Materials /> : <Login />} />
          <Route path="/products" element={user ? <Products /> : <Login />} />
          <Route path="/journal" element={user ? <Journal /> : <Login />} />
          <Route path="/about" element={user ? <About /> : <Login />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Login />} />
          <Route path="/" element={user ? <Home /> : <Login />} />
        </Routes>
      </MemoryRouter>
    </>
  )
}
