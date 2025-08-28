/**
 * @file types/index.ts
 * @description Barrel exports для типобезопасной архитектуры мебельной фабрики WASSER
 */

// ===========================
// 🏭 ОСНОВНЫЕ ТИПЫ МЕБЕЛЬНОЙ ФАБРИКИ
// ===========================

/** Материалы для мебели */
export interface FurnitureMaterial {
  readonly id: string
  readonly name: string
  readonly price: number
  readonly unit: string
  readonly category: 'wood' | 'metal' | 'fabric' | 'hardware' | 'finish' | 'glass'
  readonly consumptionCoeff: number
  readonly isActive: boolean
  readonly supplier?: string
  readonly description?: string
}

/** Коллекции мебели с множителями */
export interface FurnitureCollection {
  readonly id: string
  readonly name: string
  readonly multiplier: number
  readonly description: string
  readonly isActive: boolean
  readonly sortOrder: number
  readonly style: 'классик' | 'модерн' | 'лофт' | 'прованс' | 'скандинавский'
}

/** Изделие мебели */
export interface FurnitureProduct {
  readonly id: string
  readonly article: string
  readonly name: string
  readonly collection: string
  readonly basePrice: number
  readonly category: 'столы' | 'стулья' | 'шкафы' | 'кровати' | 'комоды' | 'другое'
  readonly materials: readonly string[]
  readonly dimensions: {
    readonly width: number
    readonly height: number
    readonly depth: number
  }
  readonly isActive: boolean
  readonly description?: string
}

/** Элемент прайс-листа */
export interface PriceListItem {
  readonly article: string
  readonly name: string
  readonly collection: string
  readonly basePrice: number
  readonly materialsCost: number
  readonly finalPrice: number
  readonly markup: number
  readonly materials: readonly {
    readonly name: string
    readonly quantity: number
    readonly cost: number
  }[]
}

/** Расчет цены изделия */
export interface PriceCalculation {
  readonly basePrice: number
  readonly materialsCost: number
  readonly collectionMultiplier: number
  readonly finalPrice: number
  readonly markup: number
  readonly profitMargin: number
}

// ===========================
// 🎯 DASHBOARD ТИПЫ
// ===========================

// Re-export dashboard types
export * from './dashboard/types'

// ===========================
// 🔧 UTILITY TYPES
// ===========================

/** Функция расчета множителя коллекции */
export type CollectionMultiplierFunction = (collection: string) => number

/** Функция расчета стоимости материалов */
export type MaterialsCostFunction = (
  materials: readonly FurnitureMaterial[],
  quantities: Record<string, number>
) => number

/** Конфигурация прайс-листа */
export interface PriceListConfig {
  readonly title: string
  readonly subtitle?: string
  readonly includeImages: boolean
  readonly includeMaterials: boolean
  readonly groupByCollection: boolean
  readonly sortBy: 'article' | 'name' | 'price' | 'collection'
  readonly currency: 'RUB' | 'USD' | 'EUR'
  readonly format: 'A4' | 'A3' | 'Letter'
}

/** Результат генерации PDF */
export interface PDFGenerationResult {
  readonly success: boolean
  readonly filename: string
  readonly itemsCount: number
  readonly fileSize: number
  readonly generationTime: number
  readonly error?: string
}
