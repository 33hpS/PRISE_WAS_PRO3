/**
 * @file components/TestFurnitureItem.tsx
 * @description Тестовый компонент мебели с функциональной архитектурой
 * 
 * Демонстрирует:
 * - Типобезопасность с TypeScript
 * - React.memo оптимизацию
 * - useMemo для производительности
 * - Специфику мебельной фабрики WASSER
 */

import React, { useMemo } from 'react'

interface FurnitureItemProps {
  readonly article: string
  readonly name: string
  readonly collection: string
  readonly price: number
  readonly materials: readonly string[]
}

/**
 * Утилита для расчета множителя коллекции
 * Функциональный подход без побочных эффектов
 */
const getCollectionMultiplier = (collection: string): number => {
  const multipliers: Record<string, number> = {
    'classic': 1.2,    // Классическая коллекция +20%
    'modern': 1.1,     // Современная коллекция +10%
    'loft': 1.15,      // Лофт коллекция +15%
    'provence': 1.25,  // Прованс коллекция +25%
    'scandinavian': 1.05 // Скандинавская +5%
  }
  return multipliers[collection.toLowerCase()] || 1.0
}

/**
 * Функциональный компонент мебельного изделия
 * Использует React.memo для оптимизации рендеров
 */
export const TestFurnitureItem: React.FC<FurnitureItemProps> = React.memo(({ 
  article, 
  name, 
  collection, 
  price, 
  materials 
}) => {
  // Мемоизированный расчет финальной цены
  const calculatedPrice = useMemo(() => {
    const collectionMultiplier = getCollectionMultiplier(collection)
    return Math.round(price * collectionMultiplier)
  }, [price, collection])

  // Мемоизированное форматирование материалов
  const formattedMaterials = useMemo(() => 
    materials.join(', '), 
    [materials]
  )

  return (
    <div className="furniture-item bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {name}
      </h3>
      
      <div className="space-y-1 text-sm text-gray-600">
        <p>
          <span className="font-medium">Артикул:</span> {article}
        </p>
        <p>
          <span className="font-medium">Коллекция:</span> {collection}
        </p>
        <p>
          <span className="font-medium">Материалы:</span> {formattedMaterials}
        </p>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Базовая: {price.toLocaleString('ru-RU')} ₽
        </span>
        <span className="text-lg font-bold text-blue-600">
          {calculatedPrice.toLocaleString('ru-RU')} ₽
        </span>
      </div>
    </div>
  )
})

TestFurnitureItem.displayName = 'TestFurnitureItem'

/**
 * Утилита для генерации прайс-листа (заглушка для демонстрации)
 * Функциональный подход с типобезопасностью
 */
export const generatePriceList = (items: readonly FurnitureItemProps[]): void => {
  console.log('🏠 Генерация прайс-листа мебельной фабрики WASSER')
  console.log(`📊 Количество изделий: ${items.length}`)
  
  items.forEach(item => {
    const calculatedPrice = Math.round(item.price * getCollectionMultiplier(item.collection))
    console.log(`📦 ${item.name} (${item.article}) - ${calculatedPrice.toLocaleString('ru-RU')} ₽`)
  })
}

export default TestFurnitureItem
