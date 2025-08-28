/**
 * @file types/furniture/index.ts
 * @description Типобезопасные интерфейсы мебельной фабрики WASSER
 * 
 * Основано на userExamples с расширениями для production
 * Функциональная архитектура с полной типизацией
 */

// Базовый интерфейс мебельного изделия (из userExamples)
export interface FurnitureItemProps {
  readonly article: string
  readonly name: string
  readonly collection: string
  readonly price: number
  readonly materials: readonly string[]
  readonly id?: string
  readonly description?: string
  readonly dimensions?: FurnitureDimensions
  readonly images?: readonly string[]
  readonly isActive?: boolean
  readonly createdAt?: string
  readonly updatedAt?: string
}

// Дополнительные типы для production
export interface FurnitureDimensions {
  readonly width: number
  readonly height: number
  readonly depth: number
  readonly unit: 'cm' | 'mm'
}

export interface FurnitureCategory {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly sortOrder: number
}

export interface FurnitureCollection {
  readonly id: string
  readonly name: string
  readonly multiplier: number
  readonly description: string
  readonly isActive: boolean
}

// Типы для ценообразования (расширение userExamples)
export interface PriceCalculation {
  readonly basePrice: number
  readonly collectionMultiplier: number
  readonly materialMultiplier: number
  readonly finalPrice: number
  readonly discount?: number
  readonly currency: 'RUB' | 'USD' | 'EUR'
}

export interface PriceListItem extends FurnitureItemProps {
  readonly calculatedPrice: PriceCalculation
  readonly formattedPrice: string
}

// Типы для PDF генерации (из userExamples)
export interface PriceListGenerationOptions {
  readonly title?: string
  readonly includeImages?: boolean
  readonly includeDescription?: boolean
  readonly groupByCollection?: boolean
  readonly showMaterials?: boolean
  readonly currency?: 'RUB' | 'USD' | 'EUR'
  readonly companyLogo?: string
}

// Фильтры и поиск
export interface FurnitureFilters {
  readonly categories?: readonly string[]
  readonly collections?: readonly string[]
  readonly materials?: readonly string[]
  readonly priceRange?: {
    readonly min: number
    readonly max: number
  }
  readonly searchQuery?: string
  readonly sortBy?: 'name' | 'price' | 'article' | 'collection'
  readonly sortOrder?: 'asc' | 'desc'
}

// API типы
export interface FurnitureAPIResponse<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly total?: number
  readonly page?: number
}

export type FurnitureListResponse = FurnitureAPIResponse<{
  readonly items: readonly FurnitureItemProps[]
  readonly total: number
}>

// Утилитарные типы
export type CreateFurnitureItem = Omit<FurnitureItemProps, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateFurnitureItem = Partial<CreateFurnitureItem> & { readonly id: string }

export default FurnitureItemProps
