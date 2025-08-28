/**
 * @file utils/furniture.ts
 * @description Функциональные утилиты для мебельной фабрики с мемоизацией
 */

import { 
  FurnitureMaterial, 
  FurnitureCollection, 
  PriceCalculationResult,
  COLLECTION_MULTIPLIERS,
  CollectionName
} from '../types'

// ===========================
// 🧮 ЧИСТЫЕ ФУНКЦИИ РАСЧЕТА
// ===========================

/**
 * Типобезопасная функция получения множителя коллекции
 * Использует константы с проверкой типов
 */
export const getCollectionMultiplier = (collection: string): number => {
  const normalizedCollection = collection.toLowerCase() as CollectionName
  return COLLECTION_MULTIPLIERS[normalizedCollection] ?? 1.0
}

/**
 * Функция расчета стоимости материалов с коэффициентами потребления
 * Иммутабельная функция без побочных эффектов
 */
export const calculateMaterialsCost = (
  materials: readonly FurnitureMaterial[],
  quantities: Record<string, number>
): number => {
  return materials.reduce((total, material) => {
    if (!material.isActive) return total
    
    const quantity = quantities[material.id] || 0
    const cost = material.price * quantity * material.consumptionCoeff
    
    return total + cost
  }, 0)
}

/**
 * Полный расчет цены изделия с учетом всех факторов
 * Возвращает детализированный результат
 */
export const calculateFurniturePrice = (
  basePrice: number,
  collection: string,
  materials: readonly FurnitureMaterial[],
  quantities: Record<string, number>
): PriceCalculationResult => {
  const materialsCost = calculateMaterialsCost(materials, quantities)
  const collectionMultiplier = getCollectionMultiplier(collection)
  
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
    profitMargin,
    isRentable: profitMargin >= 20 // Минимальная рентабельность 20%
  } as const
}

/**
 * Функция форматирования цены для отображения
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

/**
 * Функция фильтрации активных материалов
 */
export const getActiveMaterials = (
  materials: readonly FurnitureMaterial[]
): readonly FurnitureMaterial[] => {
  return materials.filter(material => material.isActive)
}

/**
 * Группировка материалов по категориям
 */
export const groupMaterialsByCategory = (
  materials: readonly FurnitureMaterial[]
): Record<string, readonly FurnitureMaterial[]> => {
  return materials.reduce((groups, material) => {
    const category = material.category
    return {
      ...groups,
      [category]: [...(groups[category] || []), material]
    }
  }, {} as Record<string, readonly FurnitureMaterial[]>)
}

/**
 * Валидация данных изделия
 */
export const validateFurnitureProduct = (product: {
  article: string
  name: string
  basePrice: number
}): { isValid: boolean; errors: readonly string[] } => {
  const errors: string[] = []
  
  if (!product.article?.trim()) {
    errors.push('Артикул обязателен')
  }
  
  if (!product.name?.trim()) {
    errors.push('Название обязательно')
  }
  
  if (typeof product.basePrice !== 'number' || product.basePrice <= 0) {
    errors.push('Базовая цена должна быть положительным числом')
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors as readonly string[]
  }
}

// ===========================
// 🎨 ФУНКЦИИ ДЛЯ ГЕНЕРАЦИИ PDF
// ===========================

/**
 * Подготовка данных для прайс-листа
 */
export const preparePriceListData = (
  products: readonly any[],
  materials: readonly FurnitureMaterial[],
  quantities: Record<string, Record<string, number>>
) => {
  return products.map(product => {
    const productQuantities = quantities[product.id] || {}
    const calculation = calculateFurniturePrice(
      product.basePrice,
      product.collection,
      materials,
      productQuantities
    )
    
    return {
      article: product.article,
      name: product.name,
      collection: product.collection,
      basePrice: product.basePrice,
      materialsCost: calculation.materialsCost,
      finalPrice: calculation.finalPrice,
      markup: calculation.markup,
      profitMargin: calculation.profitMargin,
      materials: materials
        .filter(m => productQuantities[m.id] > 0)
        .map(m => ({
          name: m.name,
          quantity: productQuantities[m.id],
          cost: m.price * productQuantities[m.id] * m.consumptionCoeff,
          unit: m.unit
        }))
    }
  })
}
