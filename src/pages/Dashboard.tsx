/**
 * @file Dashboard.tsx
 * @description Аккуратный дашборд: вкладки без дублирования разметки, сохранение активной вкладки в LS,
 * скелетоны при загрузке метрик, чистые карточки. Использует shadcn/ui и lucide-react.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Package, Settings, Upload, FileText, Database, Users, Eye, LogOut, Gauge, PaintBucket, Percent, Waves, Boxes } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import Header from '../components/Header'
import FileUpload from '../components/FileUpload'
import MaterialsManager from '../components/MaterialsManager'
import ProductManager from '../components/ProductManager'
import PriceListGenerator from '../components/PriceListGenerator'
import CollectionsManager from '../components/CollectionsManager'
import ProductTypesManager from '../components/ProductTypesManager'
import ProductViewTypesManager from '../components/ProductViewTypesManager'
import TechCardHistory from '../components/TechCardHistory'
import UserManagement from '../components/UserManagement'
import RoleGuard from '../components/RoleGuard'
import { getCurrentUserWithRole, UserWithRole } from '../lib/auth'
import { supabase } from '../lib/supabase'
import CurrencyRates from '../components/CurrencyRates'
import MetricCard from '../components/common/MetricCard'
import TabNav, { TabItem } from '../components/navigation/TabNav'

// Новые менеджеры из макета
import PaintRecipesManager from '../components/PaintRecipesManager'
import MarkupRulesManager from '../components/MarkupRulesManager'
import SinksManager from '../components/SinksManager'
import SetsManager from '../components/SetsManager'

/** Вкладки дашборда */
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

/** Статистика Overview */
interface OverviewStats {
  materials: number
  products: number
  collections: number
  priceLists: number
}

/** Ключ localStorage для вкладки */
const LS_TAB_KEY = 'dashboard:active-tab'

/**
 * DashboardPage — панель управления с чистой вкладочной навигацией.
 */
export default function DashboardPage(): JSX.Element {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    try {
      const saved = localStorage.getItem(LS_TAB_KEY) as DashboardTab | null
      return saved || 'overview'
    } catch {
      return 'overview'
    }
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [statsLoading, setStatsLoading] = useState<boolean>(true)
  const [stats, setStats] = useState<OverviewStats>({
    materials: 0,
    products: 0,
    collections: 0,
    priceLists: 0,
  })

  const navigate = useNavigate()

  useEffect(() => {
    void loadUser()
    void loadStats()
  }, [])

  /** Запоминаем вкладку */
  useEffect(() => {
    try {
      localStorage.setItem(LS_TAB_KEY, activeTab)
    } catch {
      // ignore
    }
  }, [activeTab])

  /**
   * Загрузка текущего пользователя с ролью.
   */
  const loadUser = async (): Promise<void> => {
    try {
      const currentUser = await getCurrentUserWithRole()
      if (!currentUser) {
        navigate('/login')
        return
      }
      setUser(currentUser)
    } catch (error) {
      console.error('Error loading user:', error)
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Загрузка счётчиков для Overview с индикатором скелетонов.
   */
  const loadStats = async (): Promise<void> => {
    try {
      setStatsLoading(true)
      const [materialsResult, productsResult, collectionsResult, priceListsResult] = await Promise.all([
        supabase.from('materials').select('id', { count: 'exact', head: true }).then((res) => res).catch(() => ({ count: 0 })),
        supabase.from('products').select('id', { count: 'exact', head: true }).then((res) => res).catch(() => ({ count: 0 })),
        supabase.from('collections').select('id', { count: 'exact', head: true }).then((res) => res).catch(() => ({ count: 0 })),
        supabase.from('price_lists').select('id', { count: 'exact', head: true }).then((res) => res).catch(() => ({ count: 0 })),
      ])

      setStats({
        materials: (materialsResult as any).count || 0,
        products: (productsResult as any).count || 0,
        collections: (collectionsResult as any).count || 0,
        priceLists: (priceListsResult as any).count || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      setStats({ materials: 0, products: 0, collections: 0, priceLists: 0 })
    } finally {
      setStatsLoading(false)
    }
  }

  /**
   * Выход из системы (очистка локальных сессий и Supabase).
   */
  const handleLogout = async (): Promise<void> => {
    try {
      localStorage.removeItem('test-user')
      localStorage.removeItem('supabase-user')
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      localStorage.removeItem('test-user')
      localStorage.removeItem('supabase-user')
      navigate('/login')
    }
  }

  /** Подпись для хлебных крошек. */
  const breadcrumbLabel = (tab: DashboardTab): string => {
    switch (tab) {
      case 'overview': return 'Обзор'
      case 'generator': return 'Генератор прайс-листов'
      case 'labels': return 'Генератор этикеток'
      case 'upload': return 'Загрузка файлов'
      case 'materials': return 'Управление материалами'
      case 'products': return 'Управление продукцией'
      case 'collections': return 'Управление коллекциями'
      case 'types': return 'Типы продукции'
      case 'paint': return 'Рецепты окраски'
      case 'markup': return 'Правила наценки'
      case 'sinks': return 'Раковины'
      case 'sets': return 'Комплекты'
      case 'history': return 'История изменений'
      case 'users': return 'Управление пользователями'
      default: return 'Обзор'
    }
  }

  /** Список вкладок */
  const tabs: TabItem[] = useMemo(
    () => [
      { key: 'overview', label: 'Обзор', icon: <Gauge className="w-4 h-4" /> },
      { key: 'generator', label: 'Прайс-лист', icon: <FileText className="w-4 h-4" /> },
      { key: 'labels', label: 'Этикетки', icon: <Package className="w-4 h-4" /> },

      // Администрирование
      { key: 'upload', label: 'Загрузка', icon: <Upload className="w-4 h-4" />, visible: user?.role === 'admin' },
      { key: 'materials', label: 'Материалы', icon: <Database className="w-4 h-4" />, visible: user?.role === 'admin' },
      { key: 'products', label: 'Продукция', icon: <Package className="w-4 h-4" />, visible: user?.role === 'admin' },
      { key: 'collections', label: 'Коллекции', icon: <Settings className="w-4 h-4" />, visible: user?.role === 'admin' },
      { key: 'types', label: 'Типы', icon: <Settings className="w-4 h-4" />, visible: user?.role === 'admin' },

      // Новые из макета
      { key: 'paint', label: 'Окраска', icon: <PaintBucket className="w-4 h-4" />, visible: user?.role === 'admin' },
      { key: 'markup', label: 'Наценка', icon: <Percent className="w-4 h-4" />, visible: user?.role === 'admin' },
      { key: 'sinks', label: 'Раковины', icon: <Waves className="w-4 h-4" />, visible: user?.role === 'admin' },
      { key: 'sets', label: 'Комплекты', icon: <Boxes className="w-4 h-4" />, visible: user?.role === 'admin' },

      { key: 'history', label: 'История', icon: <Eye className="w-4 h-4" />, visible: user?.role === 'admin' },
      { key: 'users', label: 'Пользователи', icon: <Users className="w-4 h-4" />, visible: user?.role === 'admin' },
    ],
    [user?.role],
  )

  /** Примитивный скелетон карточки метрики */
  const SkeletonMetric = () => (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-40 mt-2 bg-gray-100 rounded animate-pulse" />
      </CardContent>
    </Card>
  )

  /** Рендер контента по вкладке */
  const renderTab = useCallback(
    (tab: DashboardTab): JSX.Element => {
      switch (tab) {
        case 'overview':
          return (
            <div className="space-y-6">
              {/* Метрики */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsLoading ? (
                  <>
                    <SkeletonMetric />
                    <SkeletonMetric />
                    <SkeletonMetric />
                    <SkeletonMetric />
                  </>
                ) : (
                  <>
                    <MetricCard
                      title="Материалы"
                      value={stats.materials}
                      hint={stats.materials === 0 ? 'Материалы не загружены' : 'Видов материалов'}
                      icon={<Database className="h-4 w-4 text-gray-500" />}
                    />
                    <MetricCard
                      title="Продукция"
                      value={stats.products}
                      hint={stats.products === 0 ? 'Товары не добавлены' : 'Типов мебели'}
                      icon={<Package className="h-4 w-4 text-gray-500" />}
                    />
                    <MetricCard
                      title="Коллекции"
                      value={stats.collections}
                      hint={stats.collections === 0 ? 'Коллекции не созданы' : 'Активных коллекций'}
                      icon={<Settings className="h-4 w-4 text-gray-500" />}
                    />
                    <MetricCard
                      title="Прайс-листы"
                      value={stats.priceLists}
                      hint={stats.priceLists === 0 ? 'Готово к созданию' : 'Созданных прайс-листов'}
                      icon={<FileText className="h-4 w-4 text-gray-500" />}
                    />
                  </>
                )}
              </div>

              {/* Курсы валют */}
              <CurrencyRates />

              {/* Быстрый старт */}
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Быстрый старт
                  </CardTitle>
                  <CardDescription>Основные действия для начала работы</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                    <Button
                      onClick={() => setActiveTab('generator')}
                      variant="outline"
                      className="bg-transparent h-24 flex flex-col gap-2 bg-purple-50 hover:bg-purple-100 border-purple-200"
                    >
                      <FileText className="w-6 h-6 text-purple-600" />
                      <span className="text-purple-700">Создать прайс-лист</span>
                    </Button>

                    <Button
                      onClick={() => setActiveTab('labels')}
                      variant="outline"
                      className="bg-transparent h-24 flex flex-col gap-2 bg-orange-50 hover:bg-orange-100 border-orange-200"
                    >
                      <Package className="w-6 h-6 text-orange-600" />
                      <span className="text-orange-700">Печать этикеток</span>
                    </Button>

                    {user?.role === 'admin' ? (
                      <Button
                        onClick={() => setActiveTab('upload')}
                        variant="outline"
                        className="bg-transparent h-24 flex flex-col gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
                      >
                        <Upload className="w-6 h-6 text-blue-600" />
                        <span className="text-blue-700">Загрузить данные</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setActiveTab('generator')}
                        variant="outline"
                        className="bg-transparent h-24 flex flex-col gap-2 bg-green-50 hover:bg-green-100 border-green-200"
                      >
                        <Eye className="w-6 h-6 text-green-600" />
                        <span className="text-green-700">Просмотр данных</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        case 'upload':
          return (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Загрузка файлов
                </CardTitle>
                <CardDescription>Загрузите Excel-файлы с данными о материалах и продукции</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload />
              </CardContent>
            </Card>
          )
        case 'materials':
          return (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Управление материалами
                </CardTitle>
                <CardDescription>Просмотр и редактирование материалов</CardDescription>
              </CardHeader>
              <CardContent>
                <MaterialsManager />
              </CardContent>
            </Card>
          )
        case 'products':
          return (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Управление продукцией
                </CardTitle>
                <CardDescription>Просмотр и редактирование продукции</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductManager />
              </CardContent>
            </Card>
          )
        case 'collections':
          return (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Управление коллекциями
                </CardTitle>
                <CardDescription>Создание и редактирование коллекций мебели</CardDescription>
              </CardHeader>
              <CardContent>
                <CollectionsManager />
              </CardContent>
            </Card>
          )
        case 'types':
          return (
            <div className="space-y-6">
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Типы продукции
                  </CardTitle>
                  <CardDescription>Управление типами мебельной продукции</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductTypesManager />
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Типы отображения
                  </CardTitle>
                  <CardDescription>Управление типами отображения продукции</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductViewTypesManager />
                </CardContent>
              </Card>
            </div>
          )
        case 'paint':
          return (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PaintBucket className="w-5 h-5" />
                  Рецепты окраски
                </CardTitle>
                <CardDescription>Управление рецептами окраски</CardDescription>
              </CardHeader>
              <CardContent>
                <PaintRecipesManager />
              </CardContent>
            </Card>
          )
        case 'markup':
          return (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Правила наценки
                </CardTitle>
                <CardDescription>Управление правилами наценки</CardDescription>
              </CardHeader>
              <CardContent>
                <MarkupRulesManager />
              </CardContent>
            </Card>
          )
        case 'sinks':
          return (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="w-5 h-5" />
                  Раковины
                </CardTitle>
                <CardDescription>Каталог раковин</CardDescription>
              </CardHeader>
              <CardContent>
                <SinksManager />
              </CardContent>
            </Card>
          )
        case 'sets':
          return (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="w-5 h-5" />
                  Комплекты
                </CardTitle>
                <CardDescription>Создание и редактирование комплектов (наборов)</CardDescription>
              </CardHeader>
              <CardContent>
                <SetsManager />
              </CardContent>
            </Card>
          )
        case 'history':
          return (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  История изменений
                </CardTitle>
                <CardDescription>История изменений технических карт и продукции</CardDescription>
              </CardHeader>
              <CardContent>
                <TechCardHistory />
              </CardContent>
            </Card>
          )
        case 'generator':
          return (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Генератор прайс-листов
                </CardTitle>
                <CardDescription>Создание и экспорт прайс-листов</CardDescription>
              </CardHeader>
              <CardContent>
                <PriceListGenerator />
              </CardContent>
            </Card>
          )
        case 'labels':
          return (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Генератор этикеток
                </CardTitle>
                <CardDescription>Создание и печать этикеток товаров с QR-кодами</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 mb-2">Модуль этикеток подключен ниже.</div>
                {/* Подключите отдельный компонент при необходимости */}
              </CardContent>
            </Card>
          )
        case 'users':
          return (
            <RoleGuard requiredRole="admin">
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Управление пользователями
                  </CardTitle>
                  <CardDescription>Управление пользователями и их ролями</CardDescription>
                </CardHeader>
                <CardContent>
                  <UserManagement />
                </CardContent>
              </Card>
            </RoleGuard>
          )
        default:
          return <></>
      }
    },
    [stats, statsLoading, user?.role],
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Верхняя шапка со статусами и пользователем */}
      <Header user={user} onLogout={handleLogout} />

      <main className="container mx-auto px-4 pb-10">
        {/* Заголовок и мобильная кнопка выхода */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Панель управления</h1>
            <p className="text-gray-600">Управление материалами, продукцией и генерация прайс-листов</p>
          </div>
          <div className="sm:hidden">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="bg-transparent flex items-center gap-2 w-full justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </Button>
          </div>
        </div>

        {/* Вкладки */}
        <div className="mb-4">
          <TabNav items={tabs} value={activeTab} onChange={(k) => setActiveTab(k as DashboardTab)} />
        </div>

        {/* Хлебные крошки */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Главная</span>
            <span className="text-gray-400">/</span>
            <span className="font-medium text-gray-900">{breadcrumbLabel(activeTab)}</span>
          </div>
        </div>

        {/* Контент активной вкладки */}
        <div className="space-y-6">{renderTab(activeTab)}</div>
      </main>
    </div>
  )
}
