/**
 * @file components/Furniture/PriceListPreview.tsx
 * @description Превью прайс-листа с функциональным подходом
 */

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  FileText, 
  Download, 
  Eye, 
  Settings, 
  BarChart3, 
  Clock,
  Package2,
  Coins
} from 'lucide-react'
import type { PriceListConfig, PriceListItem } from '../../types'
import { usePriceListGeneration } from '../../hooks'

// ===========================
// 🎯 ИНТЕРФЕЙСЫ
// ===========================

interface PriceListPreviewProps {
  readonly items: readonly PriceListItem[]
  readonly config: PriceListConfig
  readonly onConfigChange?: (config: Partial<PriceListConfig>) => void
  readonly onGenerate?: () => void
  readonly className?: string
}

// ===========================
// 🎨 ОСНОВНОЙ КОМПОНЕНТ
// ===========================

export const PriceListPreview: React.FC<PriceListPreviewProps> = React.memo(({
  items,
  config,
  onConfigChange,
  onGenerate,
  className = ''
}) => {
  // Хук генерации с мемоизированными данными
  const {
    isGenerating,
    lastResult,
    statistics,
    previewData,
    generatePDF
  } = usePriceListGeneration({ items, config })

  // ===========================
  // 🧮 МЕМОИЗИРОВАННЫЕ РАСЧЕТЫ
  // ===========================

  /** Статистика по коллекциям */
  const collectionsStats = useMemo(() => {
    const stats = items.reduce((acc, item) => {
      const collection = item.collection || 'Без коллекции'
      if (!acc[collection]) {
        acc[collection] = { count: 0, totalValue: 0 }
      }
      acc[collection].count += 1
      acc[collection].totalValue += item.finalPrice
      return acc
    }, {} as Record<string, { count: number; totalValue: number }>)

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        count: data.count,
        totalValue: data.totalValue,
        avgPrice: data.totalValue / data.count
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
  }, [items])

  /** Цветовая схема для статуса */
  const statusColor = useMemo(() => {
    if (isGenerating) return 'bg-blue-100 text-blue-800'
    if (lastResult?.success) return 'bg-green-100 text-green-800'
    if (lastResult?.error) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }, [isGenerating, lastResult])

  /** Текст статуса */
  const statusText = useMemo(() => {
    if (isGenerating) return 'Генерация...'
    if (lastResult?.success) return `Создан: ${lastResult.filename}`
    if (lastResult?.error) return `Ошибка: ${lastResult.error}`
    return 'Готов к генерации'
  }, [isGenerating, lastResult])

  // ===========================
  // 🎛️ ОБРАБОТЧИКИ
  // ===========================

  const handleGenerate = async () => {
    try {
      const result = await generatePDF()
      
      if (result.success) {
        onGenerate?.()
      }
    } catch (error) {
      console.error('Ошибка генерации PDF:', error)
    }
  }

  // ===========================
  // 🎨 РЕНДЕР
  // ===========================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Заголовок и статус */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Превью прайс-листа
            </CardTitle>
            
            <Badge className={statusColor}>
              {isGenerating && <Clock className="w-3 h-3 mr-1 animate-spin" />}
              {statusText}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Основная информация */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Package2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {statistics.totalItems}
              </div>
              <div className="text-sm text-gray-500">Позиций</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {statistics.collections}
              </div>
              <div className="text-sm text-gray-500">Коллекций</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Coins className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {statistics.totalValue.toLocaleString('ru-RU')}₽
              </div>
              <div className="text-sm text-gray-500">Общая стоимость</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {statistics.avgPrice.toLocaleString('ru-RU')}₽
              </div>
              <div className="text-sm text-gray-500">Средняя цена</div>
            </div>
          </div>

          {/* Конфигурация */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Формат:</span>
                <div className="font-medium">{config.format}</div>
              </div>
              
              <div>
                <span className="text-gray-500">Сортировка:</span>
                <div className="font-medium">
                  {config.sortBy === 'article' && 'По артикулу'}
                  {config.sortBy === 'name' && 'По названию'}
                  {config.sortBy === 'price' && 'По цене'}
                  {config.sortBy === 'collection' && 'По коллекции'}
                </div>
              </div>
              
              <div>
                <span className="text-gray-500">Группировка:</span>
                <div className="font-medium">
                  {config.groupByCollection ? 'По коллекциям' : 'Общий список'}
                </div>
              </div>
            </div>
          </div>

          {/* Действия */}
          <div className="flex gap-3 pt-6">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || items.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Генерируется...' : 'Скачать PDF'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onConfigChange?.({})}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Настройки
            </Button>

            <Button
              variant="ghost"
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Предпросмотр
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Статистика по коллекциям */}
      {collectionsStats.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Статистика по коллекциям</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {collectionsStats.map((collection) => (
                <div key={collection.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{collection.name}</div>
                    <div className="text-sm text-gray-500">
                      {collection.count} поз. • средняя: {collection.avgPrice.toLocaleString('ru-RU')}₽
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold">
                      {collection.totalValue.toLocaleString('ru-RU')}₽
                    </div>
                    <div className="text-sm text-gray-500">
                      {((collection.totalValue / statistics.totalValue) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Последний результат генерации */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Последняя генерация</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Файл:</span>
                <div className="font-medium break-all">{lastResult.filename}</div>
              </div>
              
              <div>
                <span className="text-gray-500">Размер:</span>
                <div className="font-medium">{lastResult.fileSize} KB</div>
              </div>
              
              <div>
                <span className="text-gray-500">Время:</span>
                <div className="font-medium">{lastResult.generationTime.toFixed(0)} мс</div>
              </div>
              
              <div>
                <span className="text-gray-500">Позиций:</span>
                <div className="font-medium">{lastResult.itemsCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

PriceListPreview.displayName = 'PriceListPreview'
