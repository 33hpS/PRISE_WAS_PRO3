/**
 * @file Home.tsx
 * @description Главная панель: метрики, быстрые действия и доступ к модулям.
 * - Не использует внешние CDN
 * - Хуки роутера берём из `react-router` (соответствие окружению)
 * - Пользователь определяется безопасно: localStorage → Supabase → fallback
 */

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
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
import LabelGenerator from '../components/LabelGenerator'
import CurrencyRates from '../components/CurrencyRates'
import { supabase, getCurrentUser } from '../lib/supabase'

/** Роли пользователя в UI */
type UserRole = 'admin' | 'manager'

/** Пользователь с ролью (минимальный набор для шапки/guard) */
interface UserWithRole {
  id: string
  email: string
  role: UserRole
}

/** Вкладки панели */
type DashboardTab =
  | 'overview'
  | 'generator'
  | 'labels'
  | 'upload'
  | 'materials'
  | 'products'
  | 'collections'
  | 'types'
  | 'history'
  | 'users'

/** Счётчики наглядных метрик */
interface OverviewStats {
  materials: number
  products: number
  collections: number
  priceLists: number
}

/**
 * Вычисление роли по email (локальное правило)
 * admin → для доверенных почт, иначе manager
 */
function resolveRoleByEmail(email?: string | null): UserRole {
  const e = (email || '').toLowerCase()
  if (e === 'sherhan1988hp@gmail.com' || e === 'admin@wasser.com') return 'admin'
  return 'manager'
}

/**
 * Чтение пользователя из localStorage (dev- или supabase-сессия)
 */
function readLocalUser(): UserWithRole | null {
  try {
    const testRaw = localStorage.getItem('test-user')
    if (testRaw) {
      const dev = JSON.parse(testRaw)
      if (dev?.authenticated && dev?.email && dev?.role) {
        const sessionAge = Date.now() - (dev.timestamp || 0)
        if (sessionAge < 7 * 24 * 60 * 60 * 1000) {
          return { id: dev.id || 'dev', email: dev.email, role: dev.role as UserRole }
        }
      }
    }
  } catch { /* ignore */ }

  try {
    const sbRaw = localStorage.getItem('supabase-user')
    if (sbRaw) {
      const u = JSON.parse(sbRaw)
      if (u?.authenticated && u?.email && u?.role) {
        const sessionAge = Date.now() - (u.timestamp || 0)
        if (sessionAge < 7 * 24 * 60 * 60 * 1000) {
          return { id: u.id || 'sb', email: u.email, role: u.role as UserRole }
        }
      }
    }
  } catch { /* ignore */ }

  return null
}

/**
 * Текстовая метка для хлебных крошек
 */
function breadcrumbLabel(tab: DashboardTab): string {
  switch (tab) {
    case 'overview':
      return 'Обзор'
    case 'generator':
      return 'Генератор прайс-листов'
    case 'labels':
      return 'Генератор этикеток'
    case 'upload':
      return 'Загрузка файлов'
    case 'materials':
      return 'Управление материалами'
    case 'products':
      return 'Управление продукцией'
    case 'collections':
      return 'Управление коллекциями'
    case 'types':
      return 'Типы продукции'
    case 'history':
      return 'История изменений'
    case 'users':
      return 'Управление пользователями'
    default:
      return 'Обзор'
  }
}

/**
 * Главная панель приложения
 */
export default function Home() {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [loading, setLoading] = useState<boolean>(true)
  const [stats, setStats] = useState<OverviewStats>({
    materials: 0,
    products: 0,
    collections: 0,
    priceLists: 0,
  })

  const navigate = useNavigate()

  useEffect(() => {
    void init()
  }, [])

  /** Инициализация: пользователь и счётчики */
  const init = async () => {
    setLoading(true)
    try {
      // 1) Попробуем взять локально
      const local = readLocalUser()
      if (local) {
        setUser(local)
      } else {
        // 2) Иначе — текущий Supabase-пользователь
        const sbUser = await getCurrentUser()
        if (sbUser && sbUser.email) {
          const role: UserRole = resolveRoleByEmail(sbUser.email)
          const packed: UserWithRole = { id: sbUser.id, email: sbUser.email, role }
          setUser(packed)
          // Кэшируем для быстрого старта
          localStorage.setItem(
            'supabase-user',
            JSON.stringify({
              id: packed.id,
              email: packed.email,
              role: packed.role,
              authenticated: true,
              timestamp: Date.now(),
            })
          )
        }
      }

      // 3) Счётчики с защитой от отсутствующих таблиц
      await loadStats()
    } catch (e) {
      // тихо, UI имеет пустые fallback'и
      // eslint-disable-next-line no-console
      console.warn('Home init warning:', e)
    } finally {
      setLoading(false)
    }
  }

  /** Загрузка счётчиков (устойчиво к ошибкам) */
  const loadStats = async () => {
    try {
      const [materialsResult, productsResult, collectionsResult, priceListsResult] = await Promise.all([
        supabase
          .from('materials')
          .select('id', { count: 'exact', head: true })
          .then((res) => res)
          .catch(() => ({ count: 0, error: null })),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .then((res) => res)
          .catch(() => ({ count: 0, error: null })),
        supabase
          .from('collections')
          .select('id', { count: 'exact', head: true })
          .then((res) => res)
          .catch(() => ({ count: 0, error: null })),
        supabase
          .from('price_lists')
          .select('id', { count: 'exact', head: true })
          .then((res) => res)
          .catch(() => ({ count: 0, error: null })),
      ])

      setStats({
        materials: (materialsResult as any).count || 0,
        products: (productsResult as any).count || 0,
        collections: (collectionsResult as any).count || 0,
        priceLists: (priceListsResult as any).count || 0,
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading stats:', error)
      setStats({ materials: 0, products: 0, collections: 0, priceLists: 0 })
    }
  }

  /** Выход из аккаунта */
  const handleLogout = async () => {
    try {
      localStorage.removeItem('test-user')
      localStorage.removeItem('supabase-user')
      await supabase.auth.signOut()
      navigate('/login')
    } catch {
      localStorage.removeItem('test-user')
      localStorage.removeItem('supabase-user')
      navigate('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user as any} onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-8">
        {/* Заголовок + mobile logout */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Панель управления</h1>
              <p className="text-gray-600">Управление материалами, продукцией и генерация прайс-листов</p>
            </div>

            <div className="sm:hidden">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="bg-transparent flex items-center space-x-2 w-full justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Выйти из аккаунта</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile навигация */}
        <div className="flex lg:hidden mb-6">
          <Card className="w-full">
            <CardContent className="p-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Навигация</label>
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as DashboardTab)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <optgroup label="📊 Основные">
                    <option value="overview">📊 Обзор</option>
                    <option value="generator">📄 Прайс-лист</option>
                    <option value="labels">🏷️ Этикетки</option>
                  </optgroup>
                  {(user?.role === 'admin') && (
                    <optgroup label="⚙️ Администрирование">
                      <option value="upload">📤 Загрузка</option>
                      <option value="materials">🗃️ Материалы</option>
                      <option value="products">📦 Продукция</option>
                      <option value="collections">📚 Коллекции</option>
                      <option value="types">⚙️ Типы</option>
                      <option value="history">📝 История</option>
                      <option value="users">👥 Пользователи</option>
                    </optgroup>
                  )}
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop навигация */}
        <div className="hidden lg:block">
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex">
                <div className="flex-1">
                  <div className="p-2">
                    <div className="flex items-center space-x-1 mb-2">
                      <h3 className="text-sm font-semibold text-gray-600 px-3 py-2">Основные</h3>
                    </div>

                    {/* Кнопки */}
                    <div className="grid grid-cols-3 gap-1 p-0">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border border-transparent hover:bg-gray-50 transition-all duration-200 ${
                          activeTab === 'overview' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        <span className="font-medium">Обзор</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('generator')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border border-transparent hover:bg-gray-50 transition-all duration-200 ${
                          activeTab === 'generator' ? 'bg-green-50 text-green-700 border-green-200' : ''
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">Прайс-лист</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('labels')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border border-transparent hover:bg-gray-50 transition-all duration-200 ${
                          activeTab === 'labels' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        <span className="font-medium">Этикетки</span>
                      </button>
                    </div>

                    {/* Раздел администратора */}
                    {(user?.role === 'admin') && (
                      <div className="mt-4">
                        <div className="flex items-center space-x-1 mb-2 px-3">
                          <h3 className="text-sm font-semibold text-gray-600">Администрирование</h3>
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                            Admin
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={() => setActiveTab('upload')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent hover:bg-gray-50 transition-all duration-200 ${
                              activeTab === 'upload' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            <span className="text-sm font-medium">Загрузка</span>
                          </button>

                          <button
                            onClick={() => setActiveTab('materials')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent hover:bg-gray-50 transition-all duration-200 ${
                              activeTab === 'materials' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''
                            }`}
                          >
                            <Database className="w-4 h-4" />
                            <span className="text-sm font-medium">Материалы</span>
                          </button>

                          <button
                            onClick={() => setActiveTab('products')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent hover:bg-gray-50 transition-all duration-200 ${
                              activeTab === 'products' ? 'bg-green-50 text-green-700 border-green-200' : ''
                            }`}
                          >
                            <Package className="w-4 h-4" />
                            <span className="text-sm font-medium">Продукция</span>
                          </button>

                          <button
                            onClick={() => setActiveTab('collections')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent hover:bg-gray-50 transition-all duration-200 ${
                              activeTab === 'collections' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''
                            }`}
                          >
                            <Package className="w-4 h-4" />
                            <span className="text-sm font-medium">Коллекции</span>
                          </button>

                          <button
                            onClick={() => setActiveTab('types')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent hover:bg-gray-50 transition-all duration-200 ${
                              activeTab === 'types' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : ''
                            }`}
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm font-medium">Типы</span>
                          </button>

                          <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent hover:bg-gray-50 transition-all duration-200 ${
                              activeTab === 'history' ? 'bg-gray-50 text-gray-700 border-gray-200' : ''
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-medium">История</span>
                          </button>

                          <button
                            onClick={() => setActiveTab('users')}
                            className={`col-span-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent hover:bg-gray-50 transition-all duration-200 ${
                              activeTab === 'users' ? 'bg-red-50 text-red-700 border-red-200' : ''
                            }`}
                          >
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">Пользователи</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Хлебные крошки */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">Главная</span>
                <span className="text-gray-400">/</span>
                <span className="font-medium text-gray-900">{breadcrumbLabel(activeTab)}</span>
              </div>
            </div>

            {/* Контент вкладок (desktop) */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Метрики */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white border border-gray-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Материалы</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.materials}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats.materials === 0 ? 'Материалы не загружены' : 'Видов материалов в базе'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Продукция</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.products}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats.products === 0 ? 'Товары не добавлены' : 'Типов мебели'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Коллекции</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.collections}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats.collections === 0 ? 'Коллекции не созданы' : 'Активных коллекций'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Прайс-листы</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.priceLists}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats.priceLists === 0 ? 'Готово к созданию' : 'Созданных прайс-листов'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Валюты */}
                  <CurrencyRates />

                  {/* Быстрый старт */}
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Быстрый старт
                      </CardTitle>
                      <CardDescription>Основные действия для работы с системой</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div
                        className={`grid gap-4 ${
                          user?.role === 'admin' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'
                        }`}
                      >
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

                        {user?.role === 'manager' && (
                          <Button
                            onClick={() => setActiveTab('generator')}
                            variant="outline"
                            className="bg-transparent h-24 flex flex-col gap-2 bg-green-50 hover:bg-green-100 border-green-200"
                          >
                            <Eye className="w-6 h-6 text-green-600" />
                            <span className="text-green-700">Просмотр данных</span>
                          </Button>
                        )}

                        {user?.role === 'admin' && (
                          <>
                            <Button
                              onClick={() => setActiveTab('upload')}
                              variant="outline"
                              className="bg-transparent h-24 flex flex-col gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
                            >
                              <Upload className="w-6 h-6 text-blue-600" />
                              <span className="text-blue-700">Загрузить данные</span>
                            </Button>

                            <Button
                              onClick={() => setActiveTab('materials')}
                              variant="outline"
                              className="bg-transparent h-24 flex flex-col gap-2 bg-green-50 hover:bg-green-100 border-green-200"
                            >
                              <Database className="w-6 h-6 text-green-600" />
                              <span className="text-green-700">Управление материалами</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'upload' && (
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Загрузка файлов
                    </CardTitle>
                    <CardDescription>Загрузите Excel файлы с данными о материалах и продукции</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'materials' && (
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
              )}

              {activeTab === 'products' && (
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
              )}

              {activeTab === 'collections' && (
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Управление коллекциями
                    </CardTitle>
                    <CardDescription>Создание и редактирование коллекций мебели</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CollectionsManager />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'types' && (
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
              )}

              {activeTab === 'history' && (
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
              )}

              {activeTab === 'generator' && (
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
              )}

              {activeTab === 'labels' && (
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Генератор этикеток
                    </CardTitle>
                    <CardDescription>Создание и печать этикеток товаров с QR-кодами</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LabelGenerator />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'users' && (
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
              )}
            </div>
          </div>
        </div>

        {/* Mobile хлебные крошки + контент – зеркалим логику */}
        <div className="lg:hidden">
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500">Главная</span>
              <span className="text-gray-400">/</span>
              <span className="font-medium text-gray-900">{breadcrumbLabel(activeTab)}</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Дальше — те же условия, что на десктопе */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Материалы</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.materials}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.materials === 0 ? 'Материалы не загружены' : 'Видов материалов в базе'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Продукция</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.products}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.products === 0 ? 'Товары не добавлены' : 'Типов мебели'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Коллекции</CardTitle>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.collections}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.collections === 0 ? 'Коллекции не созданы' : 'Активных коллекций'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Прайс-листы</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.priceLists}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.priceLists === 0 ? 'Готово к созданию' : 'Созданных прайс-листов'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <CurrencyRates />

                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Быстрый старт
                    </CardTitle>
                    <CardDescription>Основные действия для работы с системой</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className={`grid gap-4 ${
                        user?.role === 'admin' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'
                      }`}
                    >
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

                      {user?.role === 'manager' && (
                        <Button
                          onClick={() => setActiveTab('generator')}
                          variant="outline"
                          className="bg-transparent h-24 flex flex-col gap-2 bg-green-50 hover:bg-green-100 border-green-200"
                        >
                          <Eye className="w-6 h-6 text-green-600" />
                          <span className="text-green-700">Просмотр данных</span>
                        </Button>
                      )}

                      {user?.role === 'admin' && (
                        <>
                          <Button
                            onClick={() => setActiveTab('upload')}
                            variant="outline"
                            className="bg-transparent h-24 flex flex-col gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
                          >
                            <Upload className="w-6 h-6 text-blue-600" />
                            <span className="text-blue-700">Загрузить данные</span>
                          </Button>

                          <Button
                            onClick={() => setActiveTab('materials')}
                            variant="outline"
                            className="bg-transparent h-24 flex flex-col gap-2 bg-green-50 hover:bg-green-100 border-green-200"
                          >
                            <Database className="w-6 h-6 text-green-600" />
                            <span className="text-green-700">Управление материалами</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Остальные вкладки (mobile) */}
            {activeTab === 'upload' && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Загрузка файлов
                  </CardTitle>
                  <CardDescription>Загрузите Excel файлы с данными о материалах и продукции</CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload />
                </CardContent>
              </Card>
            )}

            {activeTab === 'materials' && (
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
            )}

            {activeTab === 'products' && (
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
            )}

            {activeTab === 'collections' && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Управление коллекциями
                  </CardTitle>
                  <CardDescription>Создание и редактирование коллекций мебели</CardDescription>
                </CardHeader>
                <CardContent>
                  <CollectionsManager />
                </CardContent>
              </Card>
            )}

            {activeTab === 'types' && (
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
            )}

            {activeTab === 'history' && (
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
            )}

            {activeTab === 'generator' && (
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
            )}

            {activeTab === 'labels' && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Генератор этикеток
                  </CardTitle>
                  <CardDescription>Создание и печать этикеток товаров с QR-кодами</CardDescription>
                </CardHeader>
                <CardContent>
                  <LabelGenerator />
                </CardContent>
              </Card>
            )}

            {activeTab === 'users' && (
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
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
