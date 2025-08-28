/**
 * @file components/Dashboard/DashboardContent.tsx
 * @description Функциональный контент дашборда с ленивой загрузкой и обработкой ошибок
 */

import React, { Suspense, useMemo } from 'react'
import { Loader2, AlertCircle, Lock } from 'lucide-react'
import type { TabDefinition } from '../../types/dashboard/types'
import { useDashboard } from '../../context/dashboard/DashboardContext'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'

// ===========================
// 🎯 ИНТЕРФЕЙСЫ
// ===========================

interface DashboardContentProps {
  readonly tabDefinitions: readonly TabDefinition[]
}

// ===========================
// 🎨 СЛУЖЕБНЫЕ КОМПОНЕНТЫ
// ===========================

const ComponentLoader: React.FC = React.memo(() => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    <span className="ml-2 text-gray-600">Загрузка компонента...</span>
  </div>
))

ComponentLoader.displayName = 'ComponentLoader'

const ErrorBoundaryFallback: React.FC<{ 
  error?: string 
  onRetry?: () => void 
}> = React.memo(({ error, onRetry }) => (
  <Card className="border-red-200 bg-red-50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-600">
        <AlertCircle className="w-5 h-5" />
        Ошибка загрузки компонента
      </CardTitle>
    </CardHeader>
    <CardContent>
      {error && (
        <p className="text-gray-600 mb-4 font-mono text-sm bg-white p-2 rounded border">
          {error}
        </p>
      )}
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Попробовать снова
        </Button>
      )}
    </CardContent>
  </Card>
))

ErrorBoundaryFallback.displayName = 'ErrorBoundaryFallback'

const AccessDenied: React.FC = React.memo(() => (
  <Card className="border-yellow-200 bg-yellow-50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-yellow-600">
        <Lock className="w-5 h-5" />
        Нет доступа
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-600">
        У вас нет прав для доступа к этой функции. Обратитесь к администратору 
        для получения необходимых разрешений.
      </p>
    </CardContent>
  </Card>
))

AccessDenied.displayName = 'AccessDenied'

const TabNotFound: React.FC = React.memo(() => (
  <Card>
    <CardContent className="p-8 text-center">
      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-600 mb-2">Вкладка не найдена</h3>
      <p className="text-gray-500">
        Запрошенная вкладка не существует или была удалена.
      </p>
    </CardContent>
  </Card>
))

TabNotFound.displayName = 'TabNotFound'

// ===========================
// 🎨 ОСНОВНОЙ КОМПОНЕНТ КОНТЕНТА
// ===========================

export const DashboardContent: React.FC<DashboardContentProps> = React.memo(({ tabDefinitions }) => {
  const { state, isAdmin } = useDashboard()

  // Мемоизированный поиск активной вкладки с проверкой прав
  const activeTab = useMemo(() => {
    const availableTabs = tabDefinitions.filter(tab => !tab.adminOnly || isAdmin)
    return availableTabs.find(tab => tab.key === state.activeTab) || availableTabs[0]
  }, [tabDefinitions, state.activeTab, isAdmin])

  // Мемоизированная проверка доступа
  const accessCheck = useMemo(() => {
    if (!activeTab) return { hasAccess: false, reason: 'not-found' }
    if (activeTab.adminOnly && !isAdmin) return { hasAccess: false, reason: 'admin-required' }
    return { hasAccess: true, reason: null }
  }, [activeTab, isAdmin])

  // Обработчик повторной попытки
  const handleRetry = React.useCallback(() => {
    window.location.reload()
  }, [])

  // Рендер в зависимости от состояния доступа
  if (!accessCheck.hasAccess) {
    if (accessCheck.reason === 'not-found') {
      return <TabNotFound />
    }
    if (accessCheck.reason === 'admin-required') {
      return <AccessDenied />
    }
  }

  if (!activeTab) {
    return <TabNotFound />
  }

  // Безопасный рендер компонента активной вкладки
  const ActiveComponent = activeTab.component

  return (
    <div className="space-y-6">
      {/* Отображение ошибок приложения */}
      {state.error && (
        <ErrorBoundaryFallback 
          error={state.error} 
          onRetry={handleRetry}
        />
      )}
      
      {/* Основной контент с границами ошибок */}
      <Suspense fallback={<ComponentLoader />}>
        <React.StrictMode>
          <ActiveComponent />
        </React.StrictMode>
      </Suspense>
    </div>
  )
})

DashboardContent.displayName = 'DashboardContent'
