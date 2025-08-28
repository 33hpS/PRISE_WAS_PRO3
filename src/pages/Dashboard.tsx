/**
 * @file pages/Dashboard.tsx
 * @description Типобезопасный дашборд WASSER с функциональной архитектурой
 * 
 * Особенности:
 * - Чистая функциональная архитектура
 * - Полная типобезопасность для мебельной фабрики
 * - Мемоизированная производительность
 * - React.memo и useMemo оптимизации
 */

import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  FileText,
  Database,
  Gauge,
  Upload,
  Home,
  LogOut,
  Loader2,
  Settings,
  BarChart3
} from 'lucide-react'

// Контексты
import { useAuthContext } from '@/contexts/AuthContext'

// UI компоненты
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Типы мебельной фабрики
import type { 
  FurnitureStats,
  FurnitureCollection,
  FurnitureCategory,
  CollectionMultiplier 
} from '@/types/furniture'

// ===========================
// 🎯 ТИПОБЕЗОПАСНЫЕ ИНТЕРФЕЙСЫ ДАШБОРДА
// ===========================

type DashboardTab = 'overview' | 'generator' | 'materials' | 'products' | 'upload' | 'analytics'

interface DashboardTabConfig {
  readonly key: DashboardTab
  readonly label: string
  readonly icon: React.ReactNode
  readonly description: string
  readonly adminOnly: boolean
  readonly component: React.ComponentType
}

// ===========================
// 🏗️ ЛЕНИВАЯ ЗАГРУЗКА КОМПОНЕНТОВ
// ===========================

const PriceListGenerator = lazy(() => 
  import('@/components/PriceListGenerator').catch(() => ({
    default: () => (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-600 mb-2">Генератор прайс-листов</h3>
          <p className="text-gray-500">Модуль в разработке</p>
        </CardContent>
      </Card>
    )
  }))
)

const MaterialsManager = lazy(() => 
  import('@/components/MaterialsManager').catch(() => ({
    default: () => (
      <Card>
        <CardContent className="p-8 text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-600 mb-2">Управление материалами</h3>
          <p className="text-gray-500">Модуль в разработке</p>
        </CardContent>
      </Card>
    )
  }))
)

const ProductManager = lazy(() => 
  import('@/components/ProductManager').catch(() => ({
    default: () => (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-600 mb-2">Управление продукцией</h3>
          <p className="text-gray-500">Модуль в разработке</p>
        </CardContent>
      </Card>
    )
  }))
)

const FileUpload = lazy(() => 
  import('@/components/FileUpload').catch(() => ({
    default: () => (
      <Card>
        <CardContent className="p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-600 mb-2">Импорт данных</h3>
          <p className="text-gray-500">Модуль в разработке</p>
        </CardContent>
      </Card>
    )
  }))
)

// ===========================
// 🧩 СЛУЖЕБНЫЕ КОМПОНЕНТЫ
// ===========================

const ComponentLoader: React.FC = React.memo(() => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    <span className="ml-2 text-gray-600">Загрузка компонента...</span>
  </div>
))

ComponentLoader.displayName = 'ComponentLoader'

// ===========================
// 🏠 ОБЗОРНЫЙ КОМПОНЕНТ С ТИПИЗАЦИЕЙ
// ===========================

const OverviewContent: React.FC = React.memo(() => {
  // Типизированная статистика мебельной фабрики
  const furnitureStats = useMemo<FurnitureStats>(() => ({
    totalItems: 342,
    itemsByCategory: {
      tables: 45,
      chairs: 78,
      cabinets: 92,
      kitchens: 34,
      wardrobes: 67,
      accessories: 26
    },
    itemsByCollection: {
      modern: 128,
      classic: 98,
      loft: 67,
      provence: 34,
      scandinavian: 15
    },
    averagePrice: 25750,
    priceRange: {
      min: 3500,
      max: 125000
    },
    lastUpdated: new Date().toISOString()
  }), [])

  // Типизированные множители коллекций
  const collectionMultipliers = useMemo<readonly CollectionMultiplier[]>(() => [
    { collection: 'classic', multiplier: 1.2, description: 'Премиум качество' },
    { collection: 'modern', multiplier: 1.1, description: 'Современный дизайн' },
    { collection: 'loft', multiplier: 1.15, description: 'Индустриальный стиль' },
    { collection: 'provence', multiplier: 1.25, description: 'Французский шарм' },
    { collection: 'scandinavian', multiplier: 1.05, description: 'Минималистичный' }
  ], [])

  // Мемоизированный расчет общей стоимости каталога
  const totalCatalogValue = useMemo(() => {
    return Object.entries(furnitureStats.itemsByCollection).reduce((total, [collection, count]) => {
      const multiplier = collectionMultipliers.find(m => m.collection === collection)?.multiplier || 1
      return total + (count * furnitureStats.averagePrice * multiplier)
    }, 0)
  }, [furnitureStats, collectionMultipliers])

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Панель управления WASSER
        </h2>
        <p className="text-gray-600">
          Система управления мебельной фабрикой - каталог, ценообразование, производство
        </p>
      </div>

      {/* Основная статистика */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего изделий</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {furnitureStats.totalItems}
            </div>
            <p className="text-xs text-muted-foreground">
              В активном каталоге
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя цена</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {furnitureStats.averagePrice.toLocaleString('ru-RU')} ₽
            </div>
            <p className="text-xs text-muted-foreground">
              По всему каталогу
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Диапазон цен</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">
              {furnitureStats.priceRange.min.toLocaleString('ru-RU')} - {furnitureStats.priceRange.max.toLocaleString('ru-RU')} ₽
            </div>
            <p className="text-xs text-muted-foreground">
              От базовой до премиум
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Стоимость каталога</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-orange-600">
              {totalCatalogValue.toLocaleString('ru-RU')} ₽
            </div>
            <p className="text-xs text-muted-foreground">
              С учетом множителей
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Статистика по категориям */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Распределение по категориям</CardTitle>
            <CardDescription>
              Количество изделий в каждой категории
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(furnitureStats.itemsByCategory).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="font-medium capitalize">
                    {category === 'tables' && 'Столы'}
                    {category === 'chairs' && 'Стулья'}
                    {category === 'cabinets' && 'Шкафы'}
                    {category === 'kitchens' && 'Кухни'}
                    {category === 'wardrobes' && 'Гардеробные'}
                    {category === 'accessories' && 'Аксессуары'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900">{count}</span>
                  <div className="w-16 h-2 bg-gray-200 rounded">
                    <div 
                      className="h-2 bg-blue-600 rounded"
                      style={{ width: `${(count / furnitureStats.totalItems) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Коллекции и множители</CardTitle>
            <CardDescription>
              Ценовые коэффициенты для разных коллекций
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {collectionMultipliers.map(({ collection, multiplier, description }) => (
              <div key={collection} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                  <div>
                    <span className="font-medium capitalize">
                      {collection === 'modern' && 'Модерн'}
                      {collection === 'classic' && 'Классик'}
                      {collection === 'loft' && 'Лофт'}
                      {collection === 'provence' && 'Прованс'}
                      {collection === 'scandinavian' && 'Скандинавский'}
                    </span>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-green-600">×{multiplier}</span>
                  <p className="text-xs text-gray-500">
                    {furnitureStats.itemsByCollection[collection]} шт
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

OverviewContent.displayName = 'OverviewContent'

// ===========================
// 🏗️ ГЛАВНЫЙ КОМПОНЕНТ DASHBOARD
// ===========================

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAdmin, signOut } = useAuthContext()
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')

  // Типизированная конфигурация вкладок
  const tabConfigs = useMemo<readonly DashboardTabConfig[]>(() => {
    const configs: DashboardTabConfig[] = [
      {
        key: 'overview',
        label: 'Обзор',
        icon: <Gauge className="w-4 h-4" />,
        description: 'Статистика мебельной фабрики',
        adminOnly: false,
        component: OverviewContent
      },
      {
        key: 'generator',
        label: 'Прайс-листы',
        icon: <FileText className="w-4 h-4" />,
        description: 'Генерация PDF прайс-листов',
        adminOnly: false,
        component: PriceListGenerator
      },
      {
        key: 'materials',
        label: 'Материалы',
        icon: <Database className="w-4 h-4" />,
        description: 'База материалов и цены',
        adminOnly: false,
        component: MaterialsManager
      },
      {
        key: 'products',
        label: 'Изделия',
        icon: <Package className="w-4 h-4" />,
        description: 'Каталог мебели',
        adminOnly: true,
        component: ProductManager
      },
      {
        key: 'upload',
        label: 'Импорт',
        icon: <Upload className="w-4 h-4" />,
        description: 'Загрузка Excel файлов',
        adminOnly: true,
        component: FileUpload
      },
      {
        key: 'analytics',
        label: 'Аналитика',
        icon: <BarChart3 className="w-4 h-4" />,
        description: 'Анализ продаж',
        adminOnly: true,
        component: () => (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-600 mb-2">Модуль аналитики</h3>
              <p className="text-gray-500">В разработке</p>
            </CardContent>
          </Card>
        )
      }
    ]

    return configs.filter(config => !config.adminOnly || isAdmin)
  }, [isAdmin])

  // Мемоизированные обработчики
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as DashboardTab)
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut()
    navigate('/')
  }, [signOut, navigate])

  // Проверка авторизации
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Требуется авторизация
            </h2>
            <p className="text-gray-600 mb-4">
              Для доступа к панели управления необходимо войти в систему
            </p>
            <Button onClick={() => navigate('/')}>
              На главную
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Шапка */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                WASSER Dashboard
              </h1>
              <p className="text-gray-600">
                Добро пожаловать, {user.email}
                {isAdmin && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    Администратор
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/')}>
                <Home className="w-4 h-4 mr-2" />
                Главная
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
          <div className="mt-4 h-px bg-gray-200" />
        </div>

        {/* Навигация и контент */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8">
            {tabConfigs.map(config => (
              <TabsTrigger 
                key={config.key} 
                value={config.key}
                className="flex items-center gap-2"
              >
                {config.icon}
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabConfigs.map(config => (
            <TabsContent key={config.key} value={config.key} className="mt-0">
              <Suspense fallback={<ComponentLoader />}>
                <config.component />
              </Suspense>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}

Dashboard.displayName = 'Dashboard'

export default React.memo(Dashboard)
