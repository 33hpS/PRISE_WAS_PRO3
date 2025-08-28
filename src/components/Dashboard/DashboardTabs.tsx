/**
 * @file components/Dashboard/DashboardTabs.tsx
 * @description Функциональная навигация по вкладкам с мемоизацией
 */

import React, { useCallback } from 'react'
import type { DashboardTab, TabDefinition } from '../../types/dashboard/types'
import { useDashboard } from '../../context/dashboard/DashboardContext'

// ===========================
// 🎯 ИНТЕРФЕЙСЫ КОМПОНЕНТОВ
// ===========================

interface TabButtonProps {
  readonly tab: TabDefinition
  readonly isActive: boolean
  readonly onClick: (key: DashboardTab) => void
}

interface DashboardTabsProps {
  readonly tabDefinitions: readonly TabDefinition[]
}

// ===========================
// 🎨 МЕМОИЗИРОВАННАЯ КНОПКА ВКЛАДКИ
// ===========================

const TabButton: React.FC<TabButtonProps> = React.memo(({ tab, isActive, onClick }) => {
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
        ${
          isActive
            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
        }
      `}
      title={tab.description}
      aria-current={isActive ? 'page' : undefined}
    >
      {tab.icon}
      <span>{tab.label}</span>
    </button>
  )
})

TabButton.displayName = 'TabButton'

// ===========================
// 🎨 ОСНОВНОЙ КОМПОНЕНТ НАВИГАЦИИ
// ===========================

export const DashboardTabs: React.FC<DashboardTabsProps> = React.memo(({ tabDefinitions }) => {
  const { state, actions, isAdmin, metrics } = useDashboard()

  // Мемоизированная фильтрация вкладок по правам доступа
  const availableTabs = React.useMemo(() => {
    return tabDefinitions.filter(tab => !tab.adminOnly || isAdmin)
  }, [tabDefinitions, isAdmin])

  // Мемоизированный обработчик смены вкладки с метриками
  const handleTabChange = useCallback((tabKey: DashboardTab) => {
    const startTime = metrics.startTimer()
    
    actions.setActiveTab(tabKey)
    
    // Метрики производительности
    requestAnimationFrame(() => {
      metrics.endTimer(startTime, 'tabSwitch')
    })
  }, [actions, metrics])

  // Мемоизированное определение активной вкладки
  const activeTabDefinition = React.useMemo(() => {
    return availableTabs.find(tab => tab.key === state.activeTab) || availableTabs[0]
  }, [availableTabs, state.activeTab])

  if (availableTabs.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      {/* Навигация по вкладкам */}
      <div className="flex flex-wrap gap-2 mb-4">
        {availableTabs.map(tab => (
          <TabButton
            key={tab.key}
            tab={tab}
            isActive={tab.key === state.activeTab}
            onClick={handleTabChange}
          />
        ))}
      </div>

      {/* Хлебные крошки с типобезопасностью */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span>Главная</span>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-gray-900">
          {activeTabDefinition?.label || 'Неизвестная страница'}
        </span>
        
        {/* Индикатор загрузки */}
        {state.loading && (
          <>
            <span className="text-gray-400">/</span>
            <span className="text-blue-600 animate-pulse">Загрузка...</span>
          </>
        )}
      </div>
    </div>
  )
})

DashboardTabs.displayName = 'DashboardTabs'
