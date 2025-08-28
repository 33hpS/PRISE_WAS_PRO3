/**
 * @file utils/furniture/pricing.ts
 * @description Утилиты ценообразования мебельной фабрики WASSER
 * 
 * Основано на userExamples getCollectionMultiplier
 * Функциональный подход с мемоизацией и типобезопасностью
 */

import type { FurnitureItemProps, PriceCalculation, FurnitureCollection } from '../../types/furniture'

// Множители коллекций (расширение userExamples)
const COLLECTION_MULTIPLIERS: Record<string, number> = {
  'classic': 1.25,      // Классическая коллекция +25%
  'modern': 1.15,       // Современная коллекция +15%
  'loft': 1.20,         // Лофт коллекция +20%
  'provence': 1.30,     // Прованс коллекция +30%
  'scandinavian': 1.10, // Скандинавская +10%
  'minimal': 1.05,      // Минимализм +5%
  'luxury': 1.50,       // Люкс коллекция +50%
  'economy': 0.90       // Эконом коллекция -10%
} as const

// Множители материалов для точного ценообразования
const MATERIAL_MULTIPLIERS: Record<string, number> = {
  'дсп': 0.85,              // ДСП дешевле базовой цены
  'лдсп': 0.90,             // ЛДСП немного дороже ДСП
  'мдф': 1.00,              // МДФ базовая цена
  'массив дуба': 1.80,      // Массив дуба дорогой
  'массив сосны': 1.35,     // Массив сосны средний
  'массив березы': 1.45,    // Массив березы
  'шпон': 1.25,             // Шпон дороже МДФ
  'пластик': 0.75,          // Пластик дешевый
  'стекло': 1.15,           // Стекло среднее
  'металл': 1.10,           // Металл среднее
  'ротанг': 1.60,           // Ротанг дорогой
  'кожа': 2.00,             // Кожа очень дорогая
  'ткань': 1.20             // Ткань средняя
} as const

/**
 * Получение множителя коллекции (из userExamples, улучшенная версия)
 * Чистая функция без побочных эффектов
 */
export const getCollectionMultiplier = (collection: string): number => {
  const normalizedCollection = collection.toLowerCase().trim()
  return COLLECTION_MULTIPLIERS[normalizedCollection] ?? 1.0
}

/**
 * Расчет множителя материалов
 * Функциональный подход с учетом всех материалов
 */
export const getMaterialMultiplier = (materials: readonly string[]): number => {
  if (materials.length === 0) return 1.0

  // Вычисляем средний множитель всех материалов
  const totalMultiplier = materials.reduce((sum, material) => {
    const normalizedMaterial = material.toLowerCase().trim()
    return sum + (MATERIAL_MULTIPLIERS[normalizedMaterial] ?? 1.0)
  }, 0)

  return totalMultiplier / materials.length
}

/**
 * Основная функция расчета цены (расширение userExamples)
 * Типобезопасный расчет с детализацией
 */
export const calculateFurniturePrice = (item: FurnitureItemProps): PriceCalculation => {
  const collectionMultiplier = getCollectionMultiplier(item.collection)
  const materialMultiplier = getMaterialMultiplier(item.materials)
  
  const finalPrice = Math.round(item.price * collectionMultiplier * materialMultiplier)
  
  return {
    basePrice: item.price,
    collectionMultiplier,
    materialMultiplier,
    finalPrice,
    currency: 'RUB'
  }
}

/**
 * Мемоизированный расчет цены для оптимизации производительности
 * Используется в компонентах с useMemo (как в userExamples)
 */
const priceCache = new Map<string, PriceCalculation>()

export const calculateFurniturePriceMemo = (item: FurnitureItemProps): PriceCalculation => {
  const cacheKey = `${item.article}-${item.price}-${item.collection}-${item.materials.join(',')}`
  
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey)!
  }
  
  const result = calculateFurniturePrice(item)
  priceCache.set(cacheKey, result)
  
  // Ограничиваем размер кэша
  if (priceCache.size > 1000) {
    const firstKey = priceCache.keys().next().value
    priceCache.delete(firstKey)
  }
  
  return result
}

/**
 * Форматирование цены для отображения
 * Локализация для российского рынка
 */
export const formatPrice = (price: number, currency: string = 'RUB'): string => {
  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
  
  return formatter.format(price)
}

/**
 * Применение скидки к цене
 * Функциональный подход с валидацией
 */
export const applyDiscount = (price: number, discountPercent: number): number => {
  const validDiscount = Math.max(0, Math.min(100, discountPercent))
  return Math.round(price * (1 - validDiscount / 100))
}

/**
 * Группировка мебели по коллекциям для прайс-листа
 * Функциональная утилита для компонентов
 */
export const groupFurnitureByCollection = (
  items: readonly FurnitureItemProps[]
): Record<string, FurnitureItemProps[]> => {
  return items.reduce((groups, item) => {
    const collection = item.collection
    if (!groups[collection]) {
      groups[collection] = []
    }
    groups[collection].push(item)
    return groups
  }, {} as Record<string, FurnitureItemProps[]>)
}

/**
 * Сортировка мебели по различным критериям
 * Функциональная утилита с типобезопасностью
 */
export const sortFurniture = (
  items: readonly FurnitureItemProps[],
  sortBy: 'name' | 'price' | 'article' | 'collection',
  order: 'asc' | 'desc' = 'asc'
): FurnitureItemProps[] => {
  const sorted = [...items].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'ru')
        break
      case 'price':
        const priceA = calculateFurniturePrice(a).finalPrice
        const priceB = calculateFurniturePrice(b).finalPrice
        comparison = priceA - priceB
        break
      case 'article':
        comparison = a.article.localeCompare(b.article)
        break
      case 'collection':
        comparison = a.collection.localeCompare(b.collection, 'ru')
        break
    }
    
    return order === 'desc' ? -comparison : comparison
  })
  
  return sorted
}

/**
 * Валидация данных мебельного изделия
 * Типобезопасная проверка для форм
 */
export const validateFurnitureItem = (item: Partial<FurnitureItemProps>) => {
  const errors: string[] = []
  
  if (!item.article?.trim()) {
    errors.push('Артикул обязателен')
  }
  
  if (!item.name?.trim()) {
    errors.push('Название обязательно')
  }
  
  if (!item.collection?.trim()) {
    errors.push('Коллекция обязательна')
  }
  
  if (typeof item.price !== 'number' || item.price <= 0) {
    errors.push('Цена должна быть положительным числом')
  }
  
  if (!item.materials || item.materials.length === 0) {
    errors.push('Необходимо указать хотя бы один материал')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Поиск мебели по тексту
 * Функциональный поиск с поддержкой русского языка
 */
export const searchFurniture = (
  items: readonly FurnitureItemProps[],
  query: string
): FurnitureItemProps[] => {
  if (!query.trim()) return [...items]
  
  const normalizedQuery = query.toLowerCase().trim()
  
  return items.filter(item => {
    return (
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.article.toLowerCase().includes(normalizedQuery) ||
      item.collection.toLowerCase().includes(normalizedQuery) ||
      item.materials.some(material => 
        material.toLowerCase().includes(normalizedQuery)
      ) ||
      item.description?.toLowerCase().includes(normalizedQuery)
    )
  })
}

// Экспорт всех утилит
export default {
  getCollectionMultiplier,
  getMaterialMultiplier,
  calculateFurniturePrice,
  calculateFurniturePriceMemo,
  formatPrice,
  applyDiscount,
  groupFurnitureByCollection,
  sortFurniture,
  validateFurnitureItem,
  searchFurniture
}
