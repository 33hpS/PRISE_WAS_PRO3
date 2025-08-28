/**
 * @file components/furniture/FurnitureItem.tsx
 * @description Компонент мебельного изделия с функциональной архитектурой
 * 
 * Основано на userExamples FurnitureItem
 * React.memo + useMemo для оптимизации производительности
 */

import React, { useMemo } from 'react'
import type { FurnitureItemProps } from '../../types/furniture'
import { calculateFurniturePriceMemo, formatPrice } from '../../utils/furniture/pricing'

interface FurnitureItemComponentProps {
  readonly item: FurnitureItemProps
  readonly showDetails?: boolean
  readonly onEdit?: (item: FurnitureItemProps) => void
  readonly onDelete?: (id: string) => void
}

/**
 * Функциональный компонент мебельного изделия (из userExamples)
 * React.memo для предотвращения лишних рендеров
 */
export const FurnitureItem: React.FC<FurnitureItemComponentProps> = React.memo(({ 
  item,
  showDetails = false,
  onEdit,
  onDelete
}) => {
  // useMemo для оптимизации расчета цены (как в userExamples)
  const calculatedPrice = useMemo(() => {
    return calculateFurniturePriceMemo(item)
  }, [item.price, item.collection, item.materials])

  // Мемоизированное форматирование цены
  const formattedPrice = useMemo(() => {
    return formatPrice(calculatedPrice.finalPrice)
  }, [calculatedPrice.finalPrice])

  // Мемоизированное объединение материалов
  const materialsText = useMemo(() => {
    return item.materials.join(', ')
  }, [item.materials])

  return (
    <div className="furniture-item bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Основная информация (как в userExamples) */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {item.name}
          </h3>
          <p className="text-sm text-gray-600">
            Артикул: {item.article}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">
            {formattedPrice}
          </div>
          {showDetails && (
            <div className="text-xs text-gray-500 mt-1">
              База: {formatPrice(item.price)}
            </div>
          )}
        </div>
      </div>

      {/* Коллекция и материалы */}
      <div className="space-y-1 text-sm text-gray-600 mb-3">
        <p>
          <span className="font-medium">Коллекция:</span> {item.collection}
        </p>
        <p>
          <span className="font-medium">Материалы:</span> {materialsText}
        </p>
        
        {item.description && (
          <p className="text-gray-500 text-xs mt-2">
            {item.description}
          </p>
        )}
      </div>

      {/* Детали ценообразования (если включены) */}
      {showDetails && (
        <div className="border-t pt-3 mt-3">
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              Множитель коллекции: ×{calculatedPrice.collectionMultiplier}
            </div>
            <div>
              Множитель материалов: ×{calculatedPrice.materialMultiplier.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Размеры (если есть) */}
      {item.dimensions && (
        <div className="border-t pt-2 mt-3">
          <p className="text-xs text-gray-500">
            Размеры: {item.dimensions.width}×{item.dimensions.height}×{item.dimensions.depth} {item.dimensions.unit}
          </p>
        </div>
      )}

      {/* Действия */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-3 pt-3 border-t">
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Редактировать
            </button>
          )}
          {onDelete && item.id && (
            <button
              onClick={() => onDelete(item.id!)}
              className="text-sm text-red-600 hover:text-red-800 font-medium ml-auto"
            >
              Удалить
            </button>
          )}
        </div>
      )}
    </div>
  )
})

FurnitureItem.displayName = 'FurnitureItem'

export default FurnitureItem
