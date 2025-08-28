/**
 * @file types/furniture/index.ts
 * @description Типобезопасные интерфейсы для мебельной фабрики WASSER
 * 
 * Особенности:
 * - Readonly интерфейсы для иммутабельности
 * - Строгая типизация ценообразования
 * - Дискриминированные объединения для безопасности
 * - Специфика мебельного производства
 */

// ===========================
// 🪑 ОСНОВНЫЕ ТИПЫ МЕБЕЛИ
// ===========================

export type FurnitureCategory = 
  | 'tables'      // Столы
  | 'chairs'      // Стулья
  | 'cabinets'    // Шкафы
  | 'kitchens'    // Кухни
  | 'wardrobes'   // Гардеробные
  | 'accessories' // Аксессуары

export type FurnitureCollection = 
  | 'modern'      // Модерн
  | 'classic'     // Классик  
  | 'loft'        // Лофт
  | 'provence'    // Прованс
  | 'scandinavian' // Скандинавский

export type MaterialType =
  | 'dsp'         // ДСП
  | 'mdf'         // МДФ
  | 'solid_wood'  // Массив дерева
  | 'veneer'      // Шпон
  | 'glass'       // Стекло
  | 'metal'       // Металл
  | 'plastic'     // Пластик

// ===========================
// 📊 ЦЕНООБРАЗОВАНИЕ И МАТЕРИАЛЫ
// ===========================

export interface MaterialCost {
  readonly type: MaterialType
  readonly name: string
  readonly pricePerUnit: number
  readonly unit: 'м2' | 'м3' | 'шт' | 'кг'
  readonly supplier?: string
  readonly lastUpdated: string
}

export interface CollectionMultiplier {
  readonly collection: FurnitureCollection
  readonly multiplier: number
  readonly description: string
}

// ===========================
// 🛋️ МЕБЕЛЬНОЕ ИЗДЕЛИЕ
// ===========================

export interface FurnitureItemProps {
  readonly id: string
  readonly article: string
  readonly name: string
  readonly category: FurnitureCategory
  readonly collection: FurnitureCollection
  readonly basePrice: number
  readonly materials: readonly MaterialType[]
  readonly dimensions: {
    readonly width: number
    readonly height: number
    readonly depth: number
  }
  readonly description?: string
  readonly images?: readonly string[]
  readonly isActive: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

// ===========================
// 💰 РАСЧЕТ ЦЕН
// ===========================

export interface PriceCalculation {
  readonly basePrice: number
  readonly collectionMultiplier: number
  readonly materialsCost: number
  readonly finalPrice: number
  readonly currency: 'RUB' | 'USD' | 'EUR'
  readonly calculatedAt: string
}

export interface PriceListItem extends FurnitureItemProps {
  readonly calculatedPrice: PriceCalculation
  readonly priceHistory?: readonly PriceCalculation[]
}

// ===========================
// 📄 ПРАЙС-ЛИСТ И ДОКУМЕНТЫ
// ===========================

export interface PriceListConfig {
  readonly title: string
  readonly collections: readonly FurnitureCollection[]
  readonly categories: readonly FurnitureCategory[]
  readonly includeImages: boolean
  readonly includeDescriptions: boolean
  readonly format: 'pdf' | 'excel' | 'csv'
  readonly currency: 'RUB' | 'USD' | 'EUR'
  readonly discountPercentage?: number
}

export interface GeneratedPriceList {
  readonly id: string
  readonly config: PriceListConfig
  readonly items: readonly PriceListItem[]
  readonly totalItems: number
  readonly totalValue: number
  readonly generatedAt: string
  readonly generatedBy: string
  readonly downloadUrl?: string
}

// ===========================
// 🏭 ПРОИЗВОДСТВЕННЫЕ ДАННЫЕ
// ===========================

export interface ProductionSpec {
  readonly item: FurnitureItemProps
  readonly materialsRequired: readonly {
    readonly material: MaterialType
    readonly quantity: number
    readonly unit: string
  }[]
  readonly estimatedProductionTime: number // в часах
  readonly complexity: 'low' | 'medium' | 'high'
  readonly specialRequirements?: readonly string[]
}

// ===========================
// 📈 СТАТИСТИКА И АНАЛИТИКА
// ===========================

export interface FurnitureStats {
  readonly totalItems: number
  readonly itemsByCategory: Record<FurnitureCategory, number>
  readonly itemsByCollection: Record<FurnitureCollection, number>
  readonly averagePrice: number
  readonly priceRange: {
    readonly min: number
    readonly max: number
  }
  readonly lastUpdated: string
}

// ===========================
// 🔍 ФИЛЬТРЫ И ПОИСК
// ===========================

export interface FurnitureFilters {
  readonly categories?: readonly FurnitureCategory[]
  readonly collections?: readonly FurnitureCollection[]
  readonly priceRange?: {
    readonly min: number
    readonly max: number
  }
  readonly materials?: readonly MaterialType[]
  readonly searchQuery?: string
  readonly sortBy?: 'name' | 'price' | 'article' | 'created'
  readonly sortOrder?: 'asc' | 'desc'
  readonly isActive?: boolean
}

// ===========================
// 🎨 УТИЛИТАРНЫЕ ФУНКЦИИ
// ===========================

export type FurnitureItemUpdate = Partial<Omit<FurnitureItemProps, 'id' | 'createdAt'>>

export type CreateFurnitureItem = Omit<FurnitureItemProps, 'id' | 'createdAt' | 'updatedAt'>

// ===========================
// 🔄 API ОТВЕТЫ
// ===========================

export interface FurnitureAPIResponse<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly timestamp: string
}

export type FurnitureListResponse = FurnitureAPIResponse<{
  readonly items: readonly FurnitureItemProps[]
  readonly total: number
  readonly page: number
  readonly limit: number
}>

export type FurnitureDetailsResponse = FurnitureAPIResponse<FurnitureItemProps>

// ===========================
// 🧮 РАСЧЕТНЫЕ УТИЛИТЫ
// ===========================

export interface CollectionPricing {
  readonly getCollectionMultiplier: (collection: FurnitureCollection) => number
  readonly calculateFinalPrice: (basePrice: number, collection: FurnitureCollection) => PriceCalculation
  readonly applyDiscount: (price: number, discountPercent: number) => number
}

export default FurnitureItemProps
