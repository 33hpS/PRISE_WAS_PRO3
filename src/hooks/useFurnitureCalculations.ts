/**
 * @file hooks/useFurnitureCalculations.ts
 * @description Функциональный хук для расчетов мебельной фабрики с мемоизацией
 */

import { useMemo, useCallback } from 'react'
import type { 
  FurnitureMaterial, 
  FurnitureCollection, 
  PriceCalculation,
  CollectionMultiplierFunction,
  MaterialsCostFunction
} from '../types'

// ===========================
// 🎯 КОНСТАНТЫ И КОНФИГУРАЦИЯ
// ===========================

/** Множители коллекций */
const COLLECTION_MULTIPLIERS: Record<string, number> = {
  'премиум': 1.8,
  'люкс': 1.5,
  'стандарт': 1.2,
  'эконом': 1.0,
  'базовый': 0.9
} as const

/** Минимальная наценка */
const MIN_MARKUP_PERCENT = 20

interface UseFurnitureCalculationsProps {
  readonly materials: readonly FurnitureMaterial[]
  readonly collections: readonly FurnitureCollection[]
  readonly basePrice: number
  readonly selectedCollection: string
  readonly materialQuantities: Record<string, number>
  readonly customMarkup?: number
}

/**
 * Хук для расчетов стоимости мебели с оптимизацией производительности
 */
export const useFurnitureCalculations = ({
  materials,
  collections,
  basePrice,
  selectedCollection,
  materialQuantities,
  customMarkup
}: UseFurnitureCalculationsProps) => {

  // ===========================
  // 🧮 ЧИСТЫЕ ФУНКЦИИ РАСЧЕТА
  // ===========================

  /** Типобезопасная функция расчета множителя коллекции */
  const getCollectionMultiplier: CollectionMultiplierFunction = useCallback(
    (collection: string) => {
      // Проверка в базе коллекций
      const collectionData = collections.find(c => 
        c.name.toLowerCase() === collection.toLowerCase() && c.isActive
      )
      
      if (collectionData) {
        return collectionData.multiplier
      }
      
      // Fallback на статические множители
      const normalizedCollection = collection.toLowerCase()
      return COLLECTION_MULTIPLIERS[normalizedCollection] ?? 1.0
    },
    [collections]
  )

  /** Функция расчета стоимости материалов */
  const calculateMaterialsCost: MaterialsCostFunction = useCallback(
    (materialsData, quantities) => {
      return materialsData.reduce((total, material) => {
        if (!material.isActive) return total
        
        const quantity = quantities[material.id] || 0
        const cost = material.price * quantity * material.consumptionCoeff
        
        return total + cost
      }, 0)
    },
    []
  )

  // ===========================
  // 🎯 МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ
  // ===========================

  /** Стоимость материалов с мемоизацией */
  const materialsCost = useMemo(() => {
    return calculateMaterialsCost(materials, materialQuantities)
  }, [materials, materialQuantities, calculateMaterialsCost])

  /** Множитель коллекции с мемоизацией */
  const collectionMultiplier = useMemo(() => {
    return getCollectionMultiplier(selectedCollection)
  }, [selectedCollection, getCollectionMultiplier])

  /** Полный расчет цены */
  const priceCalculation = useMemo<PriceCalculation>(() => {
    const subtotal = basePrice + materialsCost
    const finalPrice = subtotal * collectionMultiplier
    const markup = finalPrice - subtotal
    const profitMargin = subtotal > 0 ? (markup / subtotal) * 100 : 0

    return {
      basePrice,
      materialsCost,
      collectionMultiplier,
      finalPrice,
      markup,
      profitMargin: Math.max(profitMargin, MIN_MARKUP_PERCENT)
    }
  }, [basePrice, materialsCost, collectionMultiplier])

  /** Детализация материалов */
  const materialsBreakdown = useMemo(() => {
    return materials
      .filter(material => material.isActive && materialQuantities[material.id] > 0)
      .map(material => {
        const quantity = materialQuantities[material.id]
        const cost = material.price * quantity * material.consumptionCoeff
        
        return {
          id: material.id,
          name: material.name,
          quantity,
          unitPrice: material.price,
          coefficient: material.consumptionCoeff,
          cost,
          unit: material.unit,
          category: material.category
        }
      })
      .sort((a, b) => b.cost - a.cost) // Сортировка по убыванию стоимости
  }, [materials, materialQuantities])

  // ===========================
  // 🛠️ UTILITY ФУНКЦИИ
  // ===========================

  /** Проверка минимальной рентабельности */
  const isRentable = useMemo(() => {
    return priceCalculation.profitMargin >= MIN_MARKUP_PERCENT
  }, [priceCalculation.profitMargin])

  /** Рекомендуемая цена */
  const recommendedPrice = useMemo(() => {
    if (isRentable) return priceCalculation.finalPrice
    
    const minPrice = (basePrice + materialsCost) * (1 + MIN_MARKUP_PERCENT / 100)
    return minPrice * collectionMultiplier
  }, [isRentable, priceCalculation.finalPrice, basePrice, materialsCost, collectionMultiplier])

  /** Экспорт для прайс-листа */
  const exportData = useMemo(() => ({
    article: `WASSER-${selectedCollection.toUpperCase()}-${Date.now()}`,
    collection: selectedCollection,
    basePrice: priceCalculation.basePrice,
    materialsCost: priceCalculation.materialsCost,
    finalPrice: priceCalculation.finalPrice,
    markup: priceCalculation.markup,
    materials: materialsBreakdown
  }), [selectedCollection, priceCalculation, materialsBreakdown])

  return {
    // Основные расчеты
    materialsCost,
    collectionMultiplier,
    priceCalculation,
    
    // Детализация
    materialsBreakdown,
    
    // Валидация
    isRentable,
    recommendedPrice,
    
    // Экспорт
    exportData,
    
    // Utility функции
    getCollectionMultiplier,
    calculateMaterialsCost
  }
}
