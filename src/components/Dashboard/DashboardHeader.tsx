/**
 * @file components/Dashboard/DashboardHeader.tsx
 * @description Функциональная шапка дашборда с мемоизацией и типобезопасностью
 */

import React, { useCallback } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { LogOut, Settings, User as UserIcon } from 'lucide-react'
import { useDashboard } from '../../context/dashboard/DashboardContext'

// ===========================
// 🎨 ФУНКЦИОНАЛЬНЫЙ КОМПОНЕНТ ШАПКИ
// ===========================

export const DashboardHeader: React.FC = React.memo(() => {
  const { state, isAdmin } = useDashboard()

  // Мемоизированный обработчик выхода
  const handleLogout = useCallback(async () => {
    try {
      // Очистка localStorage
      const keysToRemove = ['test-user', 'supabase-user', 'wasser:dashboard:active-tab']
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn(`Ошибка удаления ключа ${key}:`, error)
        }
      })

      // Перенаправление на страницу входа
      window.location.href = '/login'
    } catch (error) {
      console.error('Ошибка при выходе:', error)
      // Принудительный переход даже при ошибке
      window.location.href = '/login'
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          
          {/* Логотип и название */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-bold">
                W
              </div>
              <div>
                <div className="font-semibold text-gray-900">WASSER</div>
                <div className="text-xs text-gray-500">Мебельная Фабрика</div>
              </div>
            </div>
          </div>

          {/* Центральная навигация */}
          <nav className="hidden md:flex items-center space-x-6">
            <span className="text-sm text-gray-600">Панель управления</span>
            {isAdmin && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                <Settings className="w-3 h-3 mr-1" />
                Администратор
              </span>
            )}
          </nav>

          {/* Информация о пользователе и выход */}
          <div className="flex items-center space-x-4">
            
            {/* Карточка пользователя */}
            <Card className="px-3 py-1.5 hidden sm:flex items-center space-x-2 border-gray-200">
              <UserIcon className="w-4 h-4 text-gray-600" />
              <div className="text-xs">
                <div 
                  className="font-medium text-gray-900 truncate max-w-[120px]" 
                  title={state.user?.email || 'Гость'}
                >
                  {state.user?.email || 'Гость'}
                </div>
                <div className="text-gray-500">
                  {state.user?.role || 'no-role'}
                </div>
              </div>
            </Card>

            {/* Кнопка выхода */}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="bg-transparent hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors"
              title="Выйти из системы"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Выйти</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
})

DashboardHeader.displayName = 'DashboardHeader'
