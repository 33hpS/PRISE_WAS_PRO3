/**
 * @file components/TestDashboard.tsx
 * @description Тестовый компонент для проверки интеграции
 */

import React from 'react'
import { DashboardProvider, useDashboard } from '../context/dashboard/DashboardContext'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const TestDashboardInner: React.FC = React.memo(() => {
  const { state, isAdmin, metrics } = useDashboard()

  return (
    <Card className="max-w-md mx-auto m-4">
      <CardHeader>
        <CardTitle>🧪 Тест интеграции дашборда</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <p><strong>Пользователь:</strong> {state.user?.email || 'Не авторизован'}</p>
          <p><strong>Роль:</strong> {state.user?.role || 'Нет роли'}</p>
          <p><strong>Админ:</strong> {isAdmin ? '✅ Да' : '❌ Нет'}</p>
          <p><strong>Активная вкладка:</strong> {state.activeTab}</p>
          <p><strong>Загрузка:</strong> {state.loading ? '⏳' : '✅'}</p>
          <p><strong>Время загрузки:</strong> {metrics.data.loadTime.toFixed(2)}ms</p>
        </div>
      </CardContent>
    </Card>
  )
})

TestDashboardInner.displayName = 'TestDashboardInner'

export const TestDashboard: React.FC = React.memo(() => (
  <DashboardProvider>
    <TestDashboardInner />
  </DashboardProvider>
))

TestDashboard.displayName = 'TestDashboard'
