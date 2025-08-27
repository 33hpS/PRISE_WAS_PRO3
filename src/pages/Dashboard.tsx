/**
 * @file Dashboard.tsx
 * @description Панель управления WASSER - функциональная архитектура с типобезопасностью
 * 
 * Особенности:
 * - Мемоизированные компоненты и вычисления
 * - Строгая типизация всех интерфейсов
 * - Правильная фильтрация вкладок по ролям
 * - Оптимизированное управление состоянием
 * - Диагностика и логирование
 * - Поддержка всех модулей включая рецепты окраски
 */

import React, { 
  useEffect, 
  useState, 
  useMemo, 
  useCallback, 
  memo, 
  Suspense 
} from 'react'
import { useNavigate } from 'react-router'
import { 
  Package, 
  Settings, 
  Upload, 
  FileText, 
  Database, 
  Users, 
  Eye, 
  LogOut, 
  Gauge, 
  PaintBucket, 
  Percent, 
  Waves, 
  Boxes,
  Loader2
} from 'lucide-react'

// UI Components
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

// Core Components
import Header from '../components/Header'
import RoleGuard from '../components/RoleGuard'
import SupabaseStatus from '../components/SupabaseStatus'

// Lazy-loaded Management Components
const FileUpload = React.lazy(() => import('../components/FileUpload'))
const MaterialsManager = React.lazy(() => import('../components/MaterialsManager'))
const ProductManager = React.lazy(() => import('../components/ProductManager'))
const PriceListGenerator = React.lazy(() => import('../components/PriceListGenerator'))
const CollectionsManager = React.lazy(() => import('../components/CollectionsManager'))
const ProductTypesManager = React.lazy(() => import('../components/ProductTypesManager'))
const ProductViewTypesManager = React.lazy(() => import('../components/ProductViewTypesManager'))
const TechCardHistory = React.lazy(() => import('../components/TechCardHistory'))
const UserManagement = React.lazy(() => import('../components/UserManagement'))

// Feature Components
const PaintRecipesManager = React.lazy(() => import('../components/PaintRecipesManager'))
const MarkupRulesManager = React.lazy(() => import('../components/MarkupRulesManager'))
const SinksManager = React.lazy(() => import('../components/SinksManager'))
const SetsManager = React.lazy(() => import('../components/SetsManager'))

// Utils and Hooks
import { getCurrentUserWithRole, type UserWithRole } from '../lib/auth'
import { supabase } from '../lib/supabase'

// ===========================
// 🎯 ТИПЫ И ИНТЕРФЕЙСЫ
// ===========================

/** Допустимые вкладки дашборда */
type DashboardTab = 
  | 'overview'
  | 'generator' 
  | 'labels'
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

/** Определение вкладки с полной типизацией */
interface TabDefinition {
  readonly key: DashboardTab
  readonly label: string
  readonly icon: React.ReactNode
  readonly description: string
  readonly adminOnly: boolean
  readonly component: React.ComponentType
}

/** Статистика панели управления */
interface DashboardStats {
  readonly materials: number
  readonly products: number
  readonly collections: number
  readonly priceLists: number
}

/** Состояние компонента */
interface DashboardState {
  readonly activeTab: DashboardTab
  readonly stats: DashboardStats
  readonly statsLoading: boolean
  readonly user: UserWithRole | null
  readonly loading: boolean
  readonly error: string | null
}

/** Метрики производительности */
interface PerformanceMetrics {
  readonly loadTime: number
  readonly tabSwitchTime: number
  readonly lastUpdate: Date
}

// ===========================
// 🎨 КОНФИГУРАЦИЯ ВКЛАДОК
// ===========================

/** Конфигурация всех доступных вкладок */
const TAB_DEFINITIONS: readonly TabDefinition[] = [
  // Основные вкладки (доступны всем)
  {
    key: 'overview',
    label: 'Обзор',
    icon: <Gauge className="w-4 h-4" />,
    description: 'Общая статистика и быстрые действия',
    adminOnly: false,
    component: memo(() => <OverviewContent />)
  },
  {
    key: 'generator',
    label: 'Прайс-лист',
    icon: <FileText className="w-4 h-4" />,
    description: 'Генерация прайс-листов в PDF',
    adminOnly: false,
    component: memo(() => (
      <Suspense fallback={<ComponentLoader />}>
        <PriceListGenerator />
      </Suspense>
    ))
  },
  {
    key: 'labels',
    label: 'Этикетки',
    icon: <Package className="w-4 h-4" />,
    description: 'Генерация этикеток для продукции',
    adminOnly: false,
    component: memo(() => <div>Генератор этикеток (в разработке)</div>)
  },

  // Административные вкладки
  {
    key: 'upload',
    label: 'Загрузка',
    icon: <Upload className="w-4 h-4" />,
    description: 'Импорт данных из Excel файлов',
    adminOnly: true,
    component: memo(() => (
      <Suspense fallback={<ComponentLoader />}>
        <FileUpload />
      </Suspense>
    ))
  },
  {
    key: 'materials',
    label: 'Материалы',
    icon: <Database className="w-4 h-4" />,
    description: 'Управление базой материалов',
    adminOnly: true,
    component: memo(() => (
      <Suspense fallback={<ComponentLoader />}>
        <MaterialsManager />
      </Suspense>
    ))
  },
  {
    key: 'products',
    label: 'Продукция',
    icon: <Package className="w-4 h-4" />,
    description: 'Каталог изделий и техкарты',
    adminOnly: true,
    component: memo(() => (
      <Suspense fallback={<ComponentLoader />}>
        <ProductManager />
      </Suspense>
    ))
  },
  {
    key: 'collections',
    label: 'Коллекции',
    icon: <Settings className="w-4 h-4" />,
    description: 'Управление коллекциями мебели',
    adminOnly: true,
    component: memo(() => (
      <Suspense fallback={<ComponentLoader />}>
        <CollectionsManager />
      </Suspense>
    ))
  },
  {
    key: 'types',
    label: 'Типы',
    icon: <Settings className="w-4 h-4" />,
    description: 'Типы и виды продукции',
    adminOnly: true,
    component: memo(() => (
      <Suspense fallback={<ComponentLoader />}>
        <ProductTypesManager />
      </Suspense>
    ))
  },

  // 🎨 Специализированные модули
  {
    key: 'paint',
    label: 'Окраска',
    icon: <PaintBucket className="w-4 h-4" />,
    description: 'Рецепты окраски и покрытий',
    adminOnly: true,
    component: memo(() => (
      <Suspense fallback={<ComponentLoader />}>
        <PaintRecipesManager />
      </Suspense>
    ))
  },
  {
    key: 'markup',
    label: 'Наценка',
    icon: <Percent className="w-4 h-4" />,
    description: 'Правила ценообразования',
    adminOnly: true,
    component: memo(() => (
      <Suspense fallback={<ComponentLoader />}>
        <MarkupRulesManager />
      </Suspense>
    ))
  },
  {
    key: 'sinks',
    label: 'Раковины',
    icon: <Waves className="w-4 h-4" />,
    description: 'Каталог раковин и сантехники',
    adminOnly: true,
    component: memo(() => (
      <Suspense fallback={<ComponentLoader />}>
        <SinksManager />
      </Suspense>
    ))
  },
  {
    key: 'sets',
    label: 'Комплекты',
    icon: <Boxes className="w-4 h-4" />,
    description: 'Наборы и комплектация',
    adminOnly: true,
    component: memo(() => (
      <Suspense fallback={<ComponentLoader />}>
        <SetsManager />
      </Suspense>
    ))
  },

  // Системные вкладки
  {
    key: 'history',
    label: 'История',
    icon: <Eye className="w-4 h-4" />,
    description: 'История изменений системы',
    adminOnly: true,
    component: memo(() => (
      <Suspense fallback={<ComponentLoader />}>
        <TechCardHistory />
      </Suspense>
    ))
  },
  {
    key: 'users',
    label: 'Пользователи',
    icon: <Users className="w-4 h-4" />,
    description: 'Управление пользователями и ролями',
    adminOnly: true,
    component: memo(() => (
      <Suspense fallback={<ComponentLoader />}>
        <UserManagement />
      </Suspense>
    ))
  }
] as const

// ===========================
// 🔧 КОНСТАНТЫ И УТИЛИТЫ
// ===========================

/** Ключ localStorage для активной вкладки */
const LS_ACTIVE_TAB_KEY = 'wasser:dashboard:active-tab' as const

/** Ключи администраторских email-адресов */
const ADMIN_EMAILS = [
  'sherhan1988hp@gmail.com',
  'admin@wasser.com'
] as const

/** Начальное состояние дашборда */
const INITIAL_STATE: DashboardState = {
  activeTab: 'overview',
  stats: { materials: 0, products: 0, collections: 0, priceLists: 0 },
  statsLoading: true,
  user: null,
  loading: true,
  error: null
} as const

// ===========================
// 🎯 СЛУЖЕБНЫЕ КОМПОНЕНТЫ
// ===========================

/** Индикатор загрузки компонента */
const ComponentLoader: React.FC = memo(() => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    <span className="ml-2 text-gray-600">Загрузка...</span>
  </div>
))

/** Компонент вкладки навигации */
interface TabButtonProps {
  readonly tab: TabDefinition
  readonly isActive: boolean
  readonly onClick: (key: DashboardTab) => void
}

const TabButton: React.FC<TabButtonProps> = memo(({ tab, isActive, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(tab.key)
  }, [tab.key, onClick])

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium
        border rounded-md transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        ${isActive
          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
        }
      `}
      title={tab.description}
    >
      {tab.icon}
      <span>{tab.label}</span>
    </button>
  )
})

// ===========================
// 🎨 КОНТЕНТ КОМПОНЕНТЫ
// ===========================

/** Контент вкладки "Обзор" */
const OverviewContent: React.FC = memo(() => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Материалов в базе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">1,248</div>
            <p className="text-xs text-gray-500 mt-1">Активных позиций</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Изделий
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">342</div>
            <p className="text-xs text-gray-500 mt-1">В каталоге</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Коллекций
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">28</div>
            <p className="text-xs text-gray-500 mt-1">Активных</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Прайс-листов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">156</div>
            <p className="text-xs text-gray-500 mt-1">Сгенерировано</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🚀 Быстрые действия</CardTitle>
          <CardDescription>
            Наиболее часто используемые функции
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <FileText className="w-5 h-5 mr-3 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Создать прайс-лист</div>
                <div className="text-sm text-gray-500">PDF с актуальными ценами</div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <Upload className="w-5 h-5 mr-3 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Загрузить данные</div>
                <div className="text-sm text-gray-500">Импорт из Excel</div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <Package className="w-5 h-5 mr-3 text-purple-600" />
              <div className="text-left">
                <div className="font-medium">Новое изделие</div>
                <div className="text-sm text-gray-500">Добавить в каталог</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

// ===========================
// 🔧 ПОЛЬЗОВАТЕЛЬСКИЕ ХУКИ
// ===========================

/** Хук для определения прав пользователя */
const useUserPermissions = (user: UserWithRole | null) => {
  return useMemo(() => {
    // Диагностические логи
    const diagnostics = {
      userObject: user,
      userRole: user?.role,
      userEmail: user?.email,
    }

    // Проверка через роль в объекте пользователя
    if (user?.role === 'admin') {
      console.log('✅ Admin права через user.role:', diagnostics)
      return { isAdmin: true, diagnostics }
    }

    // Проверка через localStorage (test-user)
    try {
      const testUser = localStorage.getItem('test-user')
      if (testUser) {
        const parsed = JSON.parse(testUser)
        if (parsed?.role === 'admin' && parsed?.authenticated) {
          console.log('✅ Admin права через test-user:', parsed)
          return { isAdmin: true, diagnostics: { ...diagnostics, testUser: parsed } }
        }
      }
    } catch (error) {
      console.warn('Ошибка чтения test-user:', error)
    }

    // Проверка через localStorage (supabase-user)
    try {
      const supabaseUser = localStorage.getItem('supabase-user')
      if (supabaseUser) {
        const parsed = JSON.parse(supabaseUser)
        if (parsed?.role === 'admin') {
          console.log('✅ Admin права через supabase-user:', parsed)
          return { isAdmin: true, diagnostics: { ...diagnostics, supabaseUser: parsed } }
        }
      }
    } catch (error) {
      console.warn('Ошибка чтения supabase-user:', error)
    }

    // Проверка через известные email администраторов
    if (user?.email && ADMIN_EMAILS.includes(user.email as any)) {
      console.log('✅ Admin права по email:', user.email)
      return { isAdmin: true, diagnostics }
    }

    console.log('❌ Нет admin прав:', diagnostics)
    return { isAdmin: false, diagnostics }
  }, [user])
}

/** Хук управления состоянием вкладок */
const useDashboardTabs = (isAdmin: boolean) => {
  return useMemo(() => {
    // Фильтруем вкладки по правам доступа
    const availableTabs = TAB_DEFINITIONS.filter(tab => {
      return !tab.adminOnly || isAdmin
    })

    console.log('🔍 Доступные вкладки:', {
      isAdmin,
      totalTabs: TAB_DEFINITIONS.length,
      availableTabs: availableTabs.length,
      tabKeys: availableTabs.map(t => t.key),
      hiddenTabs: TAB_DEFINITIONS.filter(t => t.adminOnly && !isAdmin).map(t => t.key)
    })

    return availableTabs
  }, [isAdmin])
}

/** Хук для метрик производительности */
const usePerformanceMetrics = (): PerformanceMetrics => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    tabSwitchTime: 0,
    lastUpdate: new Date()
  })

  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      setMetrics(prev => ({
        ...prev,
        loadTime: endTime - startTime,
        lastUpdate: new Date()
      }))
    }
  }, [])

  return metrics
}

// ===========================
// 🎯 ОСНОВНОЙ КОМПОНЕНТ
// ===========================

/**
 * Dashboard - Главная панель управления WASSER
 * 
 * Функциональные особенности:
 * - Строгая типизация с TypeScript
 * - Мемоизация для оптимизации рендеринга  
 * - Ленивая загрузка компонентов
 * - Диагностика прав пользователя
 * - Автосохранение активной вкладки
 * - Обработка ошибок и состояний загрузки
 */
const Dashboard: React.FC = memo(() => {
  const navigate = useNavigate()
  
  // Состояние компонента
  const [state, setState] = useState<DashboardState>(INITIAL_STATE)
  
  // Производительность
  const metrics = usePerformanceMetrics()
  
  // Права пользователя с диагностикой
  const { isAdmin } = useUserPermissions(state.user)
  
  // Доступные вкладки
  const availableTabs = useDashboardTabs(isAdmin)
  
  // Активная вкладка с валидацией
  const activeTabDefinition = useMemo(() => {
    return availableTabs.find(tab => tab.key === state.activeTab) || availableTabs[0]
  }, [availableTabs, state.activeTab])

  // ===========================
  // 🔧 ОБРАБОТЧИКИ СОБЫТИЙ
  // ===========================

  /** Инициализация пользователя */
  const initializeUser = useCallback(async () => {
    try {
      const user = await getCurrentUserWithRole()
      setState(prev => ({ ...prev, user, loading: false }))
    } catch (error) {
      console.error('Ошибка инициализации пользователя:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Ошибка загрузки данных пользователя',
        loading: false 
      }))
    }
  }, [])

  /** Загрузка статистики */
  const loadStats = useCallback(async () => {
    setState(prev => ({ ...prev, statsLoading: true }))
    
    try {
      // Симулируем загрузку статистики
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const stats: DashboardStats = {
        materials: 1248,
        products: 342, 
        collections: 28,
        priceLists: 156
      }
      
      setState(prev => ({ ...prev, stats, statsLoading: false }))
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
      setState(prev => ({ ...prev, statsLoading: false }))
    }
  }, [])

  /** Смена активной вкладки */
  const handleTabChange = useCallback((tabKey: DashboardTab) => {
    const startTime = performance.now()
    
    setState(prev => ({ ...prev, activeTab: tabKey }))
    localStorage.setItem(LS_ACTIVE_TAB_KEY, tabKey)
    
    // Метрики переключения вкладки
    requestAnimationFrame(() => {
      const endTime = performance.now()
      console.log(`⚡ Переключение на вкладку ${tabKey}: ${(endTime - startTime).toFixed(2)}ms`)
    })
  }, [])

  /** Выход из системы */
  const handleLogout = useCallback(async () => {
    try {
      // Очистка локального хранилища
      const keysToRemove = ['test-user', 'supabase-user', LS_ACTIVE_TAB_KEY]
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Выход из Supabase
      await supabase.auth.signOut()
      
      navigate('/login')
    } catch (error) {
      console.error('Ошибка при выходе:', error)
      // Принудительный переход даже при ошибке
      navigate('/login')
    }
  }, [navigate])

  // ===========================
  // 🎯 ЭФФЕКТЫ КОМПОНЕНТА  
  // ===========================

  /** Инициализация при монтировании */
  useEffect(() => {
    initializeUser()
    loadStats()
    
    // Восстановление активной вкладки
    const savedTab = localStorage.getItem(LS_ACTIVE_TAB_KEY) as DashboardTab
    if (savedTab && TAB_DEFINITIONS.some(tab => tab.key === savedTab)) {
      setState(prev => ({ ...prev, activeTab: savedTab }))
    }
  }, [initializeUser, loadStats])

  /** Диагностика в консоль */
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🎯 Dashboard Диагностика')
      console.log('Пользователь:', state.user)
      console.log('Админ права:', isAdmin)
      console.log('Активная вкладка:', state.activeTab)
      console.log('Доступных вкладок:', availableTabs.length)
      console.log('Метрики производительности:', metrics)
      console.groupEnd()
    }
  }, [state.user, isAdmin, state.activeTab, availableTabs.length, metrics])

  // ===========================
  // 🎨 РЕНДЕРИНГ КОМПОНЕНТА
  // ===========================

  // Экран загрузки
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Загрузка панели управления...</div>
          <div className="text-sm text-gray-400 mt-2">WASSER Furniture Factory</div>
        </div>
      </div>
    )
  }

  // Экран ошибки
  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Ошибка загрузки</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{state.error}</p>
            <Button onClick={() => window.location.reload()}>
              Перезагрузить страницу
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка приложения */}
      <Header user={state.user} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 pb-10">
        {/* Заголовок панели */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Панель управления
            </h1>
            <p className="text-gray-600">
              Управление материалами, продукцией и генерация прайс-листов
            </p>
          </div>
          
          {/* Мобильная кнопка выхода */}
          <div className="sm:hidden">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-center bg-transparent hover:bg-red-50 hover:border-red-200 hover:text-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        {/* Статус подключения Supabase */}
        <div className="mb-4">
          <SupabaseStatus compact />
        </div>

        {/* Навигация по вкладкам */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {availableTabs.map(tab => (
              <TabButton
                key={tab.key}
                tab={tab}
                isActive={tab.key === state.activeTab}
                onClick={handleTabChange}
              />
            ))}
          </div>
        </div>

        {/* Хлебные крошки */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Главная</span>
            <span className="text-gray-400">/</span>
            <span className="font-medium text-gray-900">
              {activeTabDefinition?.label || 'Неизвестная страница'}
            </span>
          </div>
        </div>

        {/* Контент активной вкладки */}
        <div className="space-y-6">
          {activeTabDefinition?.adminOnly && !isAdmin ? (
            <RoleGuard requiredRole="admin">
              <activeTabDefinition.component />
            </RoleGuard>
          ) : (
            <activeTabDefinition.component />
          )}
        </div>

        {/* Диагностическая информация (только в dev режиме) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              🔍 Диагностическая информация
            </h3>
            <div className="text-xs text-yellow-700 space-y-1">
              <div>Пользователь: {state.user?.email || 'Не загружен'}</div>
              <div>Роль: {state.user?.role || 'Не определена'}</div>
              <div>Админ права: {isAdmin ? '✅ Да' : '❌ Нет'}</div>
              <div>Активная вкладка: {state.activeTab}</div>
              <div>Доступно вкладок: {availableTabs.length} из {TAB_DEFINITIONS.length}</div>
              <div>Время загрузки: {metrics.loadTime.toFixed(2)}ms</div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
})

Dashboard.displayName = 'Dashboard'

export default Dashboard