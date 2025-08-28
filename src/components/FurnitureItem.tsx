/**
 * @file components/FurnitureItem.tsx
 * @description Функциональный компонент элемента мебели с мемоизацией и типобезопасностью
 */

import React, { useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Package, Calculator, Tag, Ruler } from 'lucide-react'
import type { FurnitureItemProps, FurnitureMaterial } from '../types'
import { 
  calculateFurniturePrice, 
  formatPrice, 
  getCollectionMultiplier 
} from '../utils/furniture'

// ===========================
// 🎯 РАСШИРЕННЫЕ ПРОПСЫ КОМПОНЕНТА
// ===========================

interface ExtendedFurnitureItemProps extends FurnitureItemProps {
  readonly materials?: readonly FurnitureMaterial[]
  readonly materialQuantities?: Record<string, number>
  readonly onCalculate?: (article: string) => void
  readonly showDetails?: boolean
  readonly className?: string
}

// ===========================
// 🎨 ФУНКЦИОНАЛЬНЫЙ КОМПОНЕНТ С МЕМОИЗАЦИЕЙ
// ===========================

/**
 * Мемоизированный компонент элемента мебели
 * Следует функциональной архитектуре с чистыми функциями
 */
export const FurnitureItem: React.FC<ExtendedFurnitureItemProps> = React.memo(({
  article,
  name,
  collection,
  price,
  materials = [],
  dimensions,
  materialQuantities = {},
  onSelect,
  onCalculate,
  showCalculations = true,
  showDetails = true,
  className = ''
}) => {
  
  // ===========================
  // 🧮 МЕМОИЗИРОВАННЫЕ РАСЧЕТЫ
  // ===========================

  /** Расчет цены с мемоизацией для производительности */
  const priceCalculation = useMemo(() => {
    if (!showCalculations) {
      return {
        basePrice: price,
        finalPrice: price,
        collectionMultiplier: 1,
        materialsCost: 0,
        markup: 0,
        profitMargin: 0,
        isRentable: true
      }
    }

    return calculateFurniturePrice(
      price,
      collection,
      materials,
      materialQuantities
    )
  }, [price, collection, materials, materialQuantities, showCalculations])

  /** Форматированные размеры */
  const formattedDimensions = useMemo(() => {
    if (!dimensions) return null
    
    const { width, height, depth } = dimensions
    return `${width} × ${height} × ${depth} мм`
  }, [dimensions])

  /** Список материалов с расходом */
  const materialsBreakdown = useMemo(() => {
    if (!showCalculations || materials.length === 0) return []

    return materials
      .filter(material => materialQuantities[material.id] > 0)
      .map(material => {
        const quantity = materialQuantities[material.id]
        const cost = material.price * quantity * material.consumptionCoeff
        
        return {
          name: material.name,
          quantity,
          cost,
          unit: material.unit,
          category: material.category
        }
      })
      .sort((a, b) => b.cost - a.cost) // Сортировка по убыванию стоимости
  }, [materials, materialQuantities, showCalculations])

  // ===========================
  // 🎛️ МЕМОИЗИРОВАННЫЕ ОБРАБОТЧИКИ
  // ===========================

  const handleSelect = useCallback(() => {
    onSelect?.({
      id: article,
      article,
      name,
      collection,
      basePrice: price,
      category: 'другое',
      materials: materials.map(m => m.id),
      dimensions: dimensions || { width: 0, height: 0, depth: 0 },
      isActive: true
    })
  }, [onSelect, article, name, collection, price, materials, dimensions])

  const handleCalculate = useCallback(() => {
    onCalculate?.(article)
  }, [onCalculate, article])

  // ===========================
  // 🎨 РЕНДЕР КОМПОНЕНТА
  // ===========================

  return (
    <Card className={`
      transition-all duration-200 hover:shadow-lg cursor-pointer
      ${className}
    `}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4" />
              {name}
            </CardTitle>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {article}
              </Badge>
              
              <Badge variant="secondary" className="text-xs">
                {collection}
              </Badge>
              
              {showCalculations && (
                <Badge 
                  variant={priceCalculation.isRentable ? "default" : "destructive"}
                  className="text-xs"
                >
                  {priceCalculation.isRentable ? 'Рентабельно' : 'Убыточно'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Размеры изделия */}
        {showDetails && formattedDimensions && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Ruler className="w-4 h-4" />
            <span>{formattedDimensions}</span>
          </div>
        )}

        {/* Расчет цены */}
        {showCalculations && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Базовая цена:</span>
                <div className="font-semibold">
                  {formatPrice(priceCalculation.basePrice)}
                </div>
              </div>
              
              <div>
                <span className="text-gray-500">Итоговая цена:</span>
                <div className="font-bold text-lg text-blue-600">
                  {formatPrice(priceCalculation.finalPrice)}
                </div>
              </div>
            </div>

            {/* Детализация расчета */}
            {priceCalculation.materialsCost > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Материалы:</span>
                    <div>{formatPrice(priceCalculation.materialsCost)}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Наценка:</span>
                    <div className="text-green-600">
                      {formatPrice(priceCalculation.markup)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Список материалов */}
        {showDetails && materialsBreakdown.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Материалы:</h4>
            <div className="space-y-1">
              {materialsBreakdown.slice(0, 3).map((material, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {material.name} ({material.quantity} {material.unit})
                  </span>
                  <span className="font-medium">
                    {formatPrice(material.cost)}
                  </span>
                </div>
              ))}
              {materialsBreakdown.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{materialsBreakdown.length - 3} материалов
                </div>
              )}
            </div>
          </div>
        )}

        {/* Действия */}
        <div className="flex gap-2 pt-2">
          {onSelect && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelect}
              className="flex-1"
            >
              Выбрать
            </Button>
          )}
          
          {onCalculate && showCalculations && (
            <Button
              variant="default"
              size="sm"
              onClick={handleCalculate}
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
