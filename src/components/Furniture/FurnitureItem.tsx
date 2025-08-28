/**
 * @file components/Furniture/FurnitureItem.tsx
 * @description Типобезопасный компонент элемента мебели с функциональным подходом
 */

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Package, Ruler, Tag, Calculator } from 'lucide-react'
import type { FurnitureProduct, FurnitureMaterial } from '../../types'
import { useFurnitureCalculations } from '../../hooks'

// ===========================
// 🎯 ИНТЕРФЕЙСЫ КОМПОНЕНТА
// ===========================

interface FurnitureItemProps {
  readonly product: FurnitureProduct
  readonly materials?: readonly FurnitureMaterial[]
  readonly selectedCollection?: string
  readonly materialQuantities?: Record<string, number>
  readonly onSelect?: (product: FurnitureProduct) => void
  readonly onCalculate?: (product: FurnitureProduct) => void
  readonly showDetails?: boolean
  readonly showPrice?: boolean
}

// ===========================
// 🎨 ОСНОВНОЙ КОМПОНЕНТ
// ===========================

/**
 * Мемоизированный компонент элемента мебели
 * Функциональный подход с типобезопасностью
 */
export const FurnitureItem: React.FC<FurnitureItemProps> = React.memo(({
  product,
  materials = [],
  selectedCollection = 'стандарт',
  materialQuantities = {},
  onSelect,
  onCalculate,
  showDetails = true,
  showPrice = true
}) => {
  // ===========================
  // 🧮 РАСЧЕТЫ С МЕМОИЗАЦИЕЙ
  // ===========================

  const { priceCalculation, materialsBreakdown, isRentable } = useFurnitureCalculations({
    materials,
    collections: [], // Заглушка, в реальном приложении передается из пропсов
    basePrice: product.basePrice,
    selectedCollection,
    materialQuantities
  })

  /** Размеры изделия */
  const dimensionsText = useMemo(() => {
    const { width, height, depth } = product.dimensions
    return `${width} × ${height} × ${depth} мм`
  }, [product.dimensions])

  /** Категория с иконкой */
  const categoryInfo = useMemo(() => {
    const categoryIcons: Record<string, React.ReactNode> = {
      'столы': <Package className="w-4 h-4" />,
      'стулья': <Package className="w-4 h-4" />,
      'шкафы': <Package className="w-4 h-4" />,
      'кровати': <Package className="w-4 h-4" />,
      'комоды': <Package className="w-4 h-4" />,
      'другое': <Package className="w-4 h-4" />
    }

    return {
      icon: categoryIcons[product.category] || <Package className="w-4 h-4" />,
      label: product.category.charAt(0).toUpperCase() + product.category.slice(1)
    }
  }, [product.category])

  /** Статус рентабельности */
  const rentabilityBadge = useMemo(() => {
    if (!showPrice) return null

    return isRentable ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Рентабельно
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800">
        Убыточно
      </Badge>
    )
  }, [isRentable, showPrice])

  // ===========================
  // 🎛️ ОБРАБОТЧИКИ СОБЫТИЙ
  // ===========================

  const handleSelect = () => {
    onSelect?.(product)
  }

  const handleCalculate = () => {
    onCalculate?.(product)
  }

  // ===========================
  // 🎨 РЕНДЕР КОМПОНЕНТА
  // ===========================

  return (
    <Card 
      className={`
        transition-all duration-200 hover:shadow-md cursor-pointer
        ${!product.isActive ? 'opacity-60 bg-gray-50' : 'hover:shadow-lg'}
      `}
      onClick={handleSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {categoryInfo.icon}
              {product.name}
            </CardTitle>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {product.article}
              </Badge>
              
              {product.collection && (
                <Badge variant="secondary" className="text-xs">
                  {product.collection}
                </Badge>
              )}
              
              {!product.isActive && (
                <Badge variant="destructive" className="text-xs">
                  Неактивно
                </Badge>
              )}
            </div>
          </div>

          {showPrice && rentabilityBadge}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Основная информация */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Ruler className="w-4 h-4" />
              <span>{dimensionsText}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Package className="w-4 h-4" />
              <span>{categoryInfo.label}</span>
            </div>
          </div>
        )}

        {/* Описание */}
        {product.description && showDetails && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Цена и расчеты */}
        {showPrice && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Базовая цена:</span>
                <div className="font-semibold">
                  {product.basePrice.toLocaleString('ru-RU')} ₽
                </div>
              </div>
              
              <div>
                <span className="text-gray-500">Итоговая цена:</span>
                <div className="font-bold text-lg text-blue-600">
                  {priceCalculation.finalPrice.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>

            {materialsBreakdown.length > 0 && (
              <div className="mt-3">
                <span className="text-xs text-gray-500">
                  Материалы: {materialsBreakdown.length} поз., 
                  {priceCalculation.materialsCost.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            )}
          </div>
        )}

        {/* Действия */}
        <div className="flex gap-2 pt-2">
          {onSelect && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleSelect()
              }}
              className="flex-1"
            >
              Выбрать
            </Button>
          )}
          
          {onCalculate && showPrice && (
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleCalculate()
              }}
              className="flex items-center gap-1"
            >
              <Calculator className="w-4 h-4" />
              Расчет
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

FurnitureItem.displayName = 'FurnitureItem'
