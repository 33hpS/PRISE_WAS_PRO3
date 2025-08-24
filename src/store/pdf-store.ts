/**
 * @file pdf-store.ts
 * @description Глобальное Zustand-хранилище для обмена данными между генератором прайс-листов и PDF-генератором.
 */

import { create } from 'zustand'

/**
 * Данные о менеджере компании для PDF.
 */
export interface ManagerData {
  name: string
  phone: string
  email: string
}

/**
 * Данные компании для PDF.
 */
export interface CompanyData {
  name: string
  tagline: string
  address: string
  phone: string
  email: string
  website: string
  manager: ManagerData
  logo?: string
}

/**
 * Данные документа.
 */
export interface DocumentData {
  title: string
  version: string
  date: string
  specialOffer?: string
}

/**
 * Элемент товара для PDF.
 */
export interface PdfProduct {
  id: string
  article?: string
  name: string
  collection?: string
  type?: string
  description?: string
  base_price?: number
  total_cost?: number
  markup?: number
  images?: string[]
  category?: string
  /** Пользовательские поля (используются в шаблонах) */
  dimensions?: string
  material?: string
  color?: string
}

/**
 * Видимость колонок для таблиц прайс-листа.
 */
export interface PdfColumns {
  index?: boolean
  article?: boolean
  name?: boolean
  collection?: boolean
  type?: boolean
  description?: boolean
  cost?: boolean
  markup?: boolean
  price?: boolean
  image?: boolean
  dimensions?: boolean
  material?: boolean
  color?: boolean
}

/**
 * Конфигурация визуального стиля и таблиц для PDF.
 */
export interface PdfConfig {
  /** Стиль шаблона */
  selectedStyle: 'modern' | 'nordic' | 'executive'
  /** Группировка */
  groupBy: 'none' | 'collection' | 'type' | 'category'
  /** Включать изображения */
  includeImages: boolean
  /** Текущая коллекция (для заголовков) */
  selectedCollection: string

  /** Набор колонок */
  columns?: PdfColumns

  /** Цвета и типографика */
  primaryColor?: string
  accentColor?: string
  bgColor?: string
  fontFamily?: 'Inter' | 'Roboto' | 'System' | 'Space Grotesk'
  showLogo?: boolean

  /** Табличный стиль */
  density?: 'compact' | 'regular' | 'spacious'
  striped?: boolean
}

/**
 * Полный набор данных для PDF.
 */
export interface PdfData {
  companyData: CompanyData
  documentData: DocumentData
  products: PdfProduct[]
  config: PdfConfig
}

/**
 * Состояние Zustand-хранилища.
 */
interface PdfStoreState {
  data: PdfData | null
  setData: (data: PdfData) => void
  mergeConfig: (partial: Partial<PdfConfig>) => void
  updateLogo: (logo?: string) => void
  clear: () => void
}

/**
 * Создание Zustand-хранилища для PDF.
 */
export const usePdfStore = create<PdfStoreState>((set, get) => ({
  data: null,
  setData: (data) => set({ data }),
  mergeConfig: (partial) =>
    set((state) => {
      if (!state.data) return state
      return {
        data: {
          ...state.data,
          config: {
            ...state.data.config,
            ...partial,
          },
        },
      }
    }),
  updateLogo: (logo) =>
    set((state) => {
      if (!state.data) return state
      return {
        data: {
          ...state.data,
          companyData: {
            ...state.data.companyData,
            logo,
          },
        },
      }
    }),
  clear: () => set({ data: null }),
}))

/**
 * Вспомогательная функция: сформировать PdfData из списка товаров и базовой информации.
 */
export function buildPdfDataFromProducts(params: {
  products: PdfProduct[]
  selectedStyle: 'modern' | 'nordic' | 'executive'
  groupBy: 'none' | 'collection' | 'type' | 'category'
  selectedCollection: string
  includeImages: boolean
  companyData?: Partial<CompanyData>
  documentData?: Partial<DocumentData>
  logo?: string
  columns?: PdfColumns
  primaryColor?: string
  accentColor?: string
  bgColor?: string
  fontFamily?: 'Inter' | 'Roboto' | 'System' | 'Space Grotesk'
  showLogo?: boolean
  density?: 'compact' | 'regular' | 'spacious'
  striped?: boolean
}): PdfData {
  const companyData: CompanyData = {
    name: 'WASSER',
    tagline: 'Мебельная фабрика',
    address: 'Бишкек, ул. Промышленная, 1',
    phone: '+996 (312) 555-123',
    email: 'sales@wasser.kg',
    website: 'www.wasser.kg',
    manager: {
      name: 'Отдел продаж',
      phone: '+996 (555) 998-877',
      email: 'sales@wasser.kg',
    },
    logo: params.logo,
    ...(params.companyData || {}),
  }

  const documentData: DocumentData = {
    title: 'ПРАЙС-ЛИСТ МЕБЕЛИ ДЛЯ ВАННЫХ КОМНАТ',
    version: '1.0.0',
    date: new Date().toLocaleDateString('ru-RU'),
    specialOffer: 'Специальные условия для оптовых клиентов при заказе от 100 000 сом',
    ...(params.documentData || {}),
  }

  const config: PdfConfig = {
    selectedStyle: params.selectedStyle,
    groupBy: params.groupBy,
    includeImages: params.includeImages,
    selectedCollection: params.selectedCollection,
    columns: params.columns || {
      index: true,
      article: true,
      name: true,
      collection: true,
      type: true,
      dimensions: true,
      material: true,
      color: true,
      price: true,
    },
    primaryColor: params.primaryColor || '#667eea',
    accentColor: params.accentColor || '#764ba2',
    bgColor: params.bgColor || '#ffffff',
    fontFamily: params.fontFamily || 'Inter',
    showLogo: params.showLogo !== false,
    density: params.density || 'regular',
    striped: params.striped ?? true,
  }

  return {
    companyData,
    documentData,
    products: params.products,
    config,
  }
}
