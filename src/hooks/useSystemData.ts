/**
 * @file useSystemData.ts
 * @description Централизованный хук системных данных Home: товары, коллекции, пин‑коллекции, метрики, seed().
 */
import { useCallback, useMemo, useState } from 'react'
import type { SystemMetrics } from '../components/home/SystemMetricsPanel'

/** Тип товара для домашней страницы */
export interface SysProduct {
  id: string
  name: string
  article?: string
}

/** Тип коллекции для домашней страницы */
export interface SysCollection {
  id: string
  name: string
  pinned?: boolean
  product_order: string[]
  cover_url?: string
  updated_at?: string
}

/** Приватные ключи хранилища */
const LS = {
  products: 'wasser_products_data',
  collections: 'wasser_collections_data',
  audit: 'wasser_change_log',
}

/** Утилиты чтения/записи */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* noop */
  }
}

/** Генерация простого ID */
function rid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** Начальное наполнение (демо) */
function seedProducts(): SysProduct[] {
  const now = new Date().toISOString()
  return [
    { id: rid(), name: 'Тумба 600 Белая', article: 'TB-600-WHT' },
    { id: rid(), name: 'Пенал узкий', article: 'PENAL-NARROW' },
    { id: rid(), name: 'Зеркало 600', article: 'MIR-600' },
  ]
}
function seedCollections(productIds: string[]): SysCollection[] {
  const now = new Date().toISOString()
  return [
    {
      id: rid(),
      name: '2025 Весна',
      pinned: true,
      product_order: productIds.slice(0, Math.ceil(productIds.length / 2)),
      cover_url: '',
      updated_at: now,
    },
    {
      id: rid(),
      name: '2025 Осень',
      pinned: false,
      product_order: productIds.slice(Math.ceil(productIds.length / 2)),
      cover_url: '',
      updated_at: now,
    },
  ]
}

/**
 * useSystemData — отдает данные для Home + seed()
 */
export function useSystemData() {
  const [products, setProducts] = useState<SysProduct[]>(() => read<SysProduct[]>(LS.products, []))
  const [collections, setCollections] = useState<SysCollection[]>(() => read<SysCollection[]>(LS.collections, []))

  /** Пин‑коллекции для виджета */
  const pinnedCollections = useMemo(
    () =>
      collections
        .filter((c) => !!c.pinned)
        .map((c) => ({ id: c.id, name: c.name, productIds: c.product_order, cover_url: c.cover_url })),
    [collections],
  )

  /** Метрики для панели */
  const metrics: SystemMetrics = useMemo(
    () => ({
      products: products.length,
      collections: collections.length,
      materials: (() => {
        try {
          const raw = localStorage.getItem('wasser_materials') || localStorage.getItem('wasser_materials_data')
          const list = raw ? (JSON.parse(raw) as unknown[]) : []
          return Array.isArray(list) ? list.length : 0
        } catch {
          return 0
        }
      })(),
      lastUpdate: Date.now(),
    }),
    [products.length, collections.length],
  )

  /** Наполнить демо‑данными */
  const seed = useCallback(() => {
    const p = seedProducts()
    const c = seedCollections(p.map((x) => x.id))
    setProducts(p)
    setCollections(c)
    write(LS.products, p)
    write(LS.collections, c)
    try {
      const log = read<any[]>(LS.audit, [])
      const now = Date.now()
      log.unshift({ id: rid(), at: now, action: 'seed', entity: 'system' })
      write(LS.audit, log)
    } catch {
      /* noop */
    }
  }, [])

  return {
    products,
    collections,
    pinnedCollections,
    metrics,
    seed,
  }
}
