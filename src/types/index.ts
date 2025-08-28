/**
 * @file types/index.ts
 * @description Центральная система типов мебельной фабрики WASSER
 * Функциональная архитектура с типобезопасностью
 */

// ===========================
// 🏭 ОСНОВНЫЕ ТИПЫ МЕБЕЛЬНОЙ ФАБРИКИ
// ===========================

/** Материал для производства мебели */
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

/** Коллекция мебели с множителем цены */
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

/** Элемент прайс-листа с расчетами */
export interface PriceListItem {
  readonly article: string
  readonly name: string
  readonly collection: string
  readonly basePrice: number
  readonly materialsCost: number
  readonly finalPrice: number
  readonly markup: number
  readonly profitMargin: number
  readonly materials: readonly {
    readonly name: string
    readonly quantity: number
    readonly cost: number
    readonly unit: string
  }[]
}

/** Пропсы компонента мебели */
export interface FurnitureItemProps {
  readonly article: string
  readonly name: string
  readonly collection: string
  readonly price: number
  readonly materials: readonly string[]
  readonly dimensions?: {
    readonly width: number
    readonly height: number
    readonly depth: number
  }
  readonly onSelect?: (item: FurnitureProduct) => void
  readonly showCalculations?: boolean
}

// ===========================
// 🎯 ФУНКЦИОНАЛЬНЫЕ ТИПЫ
// ===========================

/** Функция расчета множителя коллекции */
export type CollectionMultiplierFunction = (collection: string) => number

/** Функция расчета стоимости материалов */
export type MaterialsCostFunction = (
  materials: readonly FurnitureMaterial[],
  quantities: Record<string, number>
) => number

/** Функция генерации прайс-листа */
export type PriceListGeneratorFunction = (
  items: readonly PriceListItem[]
) => Promise<void>

/** Результат расчета цены */
export interface PriceCalculationResult {
  readonly basePrice: number
  readonly materialsCost: number
  readonly collectionMultiplier: number
  readonly finalPrice: number
  readonly markup: number
  readonly profitMargin: number
  readonly isRentable: boolean
}

// ===========================
// 🎮 DASHBOARD ТИПЫ
// ===========================

export type DashboardTab = 
  | 'overview' 
  | 'generator' 
  | 'materials' 
  | 'products' 
  | 'collections'
  | 'reports'

export interface UserWithRole {
  readonly id: string
  readonly email: string
  readonly role: 'admin' | 'manager' | 'user'
  readonly name?: string
  readonly permissions?: readonly string[]
}

export interface DashboardState {
  readonly activeTab: DashboardTab
  readonly user: UserWithRole | null
  readonly loading: boolean
  readonly error: string | null
}

// ===========================
// 🔧 UTILITY TYPES
// ===========================

/** Создание только для чтения */
export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: T[P] extends object ? ReadonlyDeep<T[P]> : T[P]
}

/** Обязательные поля */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/** Опциональные поля */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// ===========================
// 🏭 КОНСТАНТЫ МЕБЕЛЬНОЙ ФАБРИКИ
// ===========================

/** Множители коллекций мебели */
export const COLLECTION_MULTIPLIERS = {
  'премиум': 1.8,
  'люкс': 1.5,
  'стандарт': 1.2,
  'эконом': 1.0,
  'базовый': 0.9
} as const

/** Категории материалов */
export const MATERIAL_CATEGORIES = {
  wood: 'Древесина',
  metal: 'Металл', 
  fabric: 'Ткань',
  hardware: 'Фурнитура',
  finish: 'Отделка',
  glass: 'Стекло'
} as const

/** Типы мебели */
export const FURNITURE_TYPES = {
  столы: 'Столы',
  стулья: 'Стулья',
  шкафы: 'Шкафы',
  кровати: 'Кровати',
  комоды: 'Комоды',
  другое: 'Другое'
} as const

export type MaterialCategory = keyof typeof MATERIAL_CATEGORIES
export type FurnitureType = keyof typeof FURNITURE_TYPES
export type CollectionName = keyof typeof COLLECTION_MULTIPLIERS
