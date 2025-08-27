/**
 * @file forex.ts - Функциональный модуль валютных курсов для мебельной фабрики WASSER
 * Архитектура: Типобезопасные интерфейсы + кэширование + error handling
 */

export type CurrencyCode = 'USD' | 'EUR' | 'RUB' | 'KGS' | 'KZT' | 'CNY'
export type BaseCurrency = 'KGS' | 'USD'

// Функциональный интерфейс нормализованного курса
export interface NormalizedRate {
  code: string
  name: string
  rate: number
}

// Типобезопасный интерфейс API ответа
interface ApiResponse {
  result: 'success' | 'error'
  base_code: string
  rates: Record<string, number>
}

// Функциональный кэш с типизацией
interface CacheEntry {
  timestamp: number
  data: NormalizedRate[]
  base: BaseCurrency
}

// Мета-данные валют для мебельной фабрики
const CURRENCY_META: Record<string, { name: string; flag: string }> = {
  USD: { name: 'Доллар США', flag: '🇺🇸' },
  EUR: { name: 'Евро', flag: '🇪🇺' },
  RUB: { name: 'Российский рубль', flag: '🇷🇺' },
  KGS: { name: 'Киргизский сом', flag: '🇰🇬' },
  KZT: { name: 'Казахский тенге', flag: '🇰🇿' },
  CNY: { name: 'Китайский юань', flag: '🇨🇳' },
}

// Константы кэширования
const CACHE_KEY = 'wasser-forex-cache'
const CACHE_TTL = 10 * 60 * 1000 // 10 минут

/**
 * Типобезопасное чтение из кэша
 */
const readCache = (base: BaseCurrency): CacheEntry | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}-${base}`)
    if (!cached) return null

    const entry: CacheEntry = JSON.parse(cached)
    if (Date.now() - entry.timestamp > CACHE_TTL) return null

    return entry
  } catch {
    return null
  }
}

/**
 * Функциональная запись в кэш
 */
const writeCache = (base: BaseCurrency, data: NormalizedRate[]): void => {
  const entry: CacheEntry = {
    timestamp: Date.now(),
    data,
    base,
  }

  try {
    localStorage.setItem(`${CACHE_KEY}-${base}`, JSON.stringify(entry))
  } catch {
    // Кэш необязателен, игнорируем ошибки
  }
}

/**
 * Функциональная нормализация курсов
 */
const normalizeRates = (baseCode: string, apiRates: Record<string, number>): NormalizedRate[] => {
  const targetCurrencies = ['USD', 'EUR', 'RUB', 'KGS', 'KZT', 'CNY']

  return targetCurrencies
    .filter(code => code !== baseCode && apiRates[code])
    .map(code => ({
      code,
      name: CURRENCY_META[code]?.name || code,
      rate: apiRates[code],
    }))
    .sort((a, b) => a.code.localeCompare(b.code))
}

/**
 * Основной метод getRates - функциональный подход к получению курсов
 */
export const getRates = async (base: BaseCurrency = 'USD'): Promise<NormalizedRate[]> => {
  // Проверяем кэш
  const cached = readCache(base)
  if (cached) {
    return cached.data
  }

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data: ApiResponse = await response.json()

    if (data.result !== 'success' || !data.rates) {
      throw new Error('Invalid API response')
    }

    const normalized = normalizeRates(base, data.rates)
    writeCache(base, normalized)

    return normalized
  } catch (error) {
    // При ошибке возвращаем заглушку
    console.warn('Forex API error, returning fallback rates:', error)
    return getFallbackRates(base)
  }
}

/**
 * Функциональные заглушки курсов для оффлайн работы
 */
const getFallbackRates = (base: BaseCurrency): NormalizedRate[] => {
  const fallbackRates =
    base === 'USD'
      ? [
          { code: 'EUR', name: 'Евро', rate: 0.85 },
          { code: 'RUB', name: 'Российский рубль', rate: 75.0 },
          { code: 'KGS', name: 'Киргизский сом', rate: 85.0 },
          { code: 'KZT', name: 'Казахский тенге', rate: 450.0 },
        ]
      : [
          { code: 'USD', name: 'Доллар США', rate: 0.012 },
          { code: 'EUR', name: 'Евро', rate: 0.01 },
          { code: 'RUB', name: 'Российский рубль', rate: 0.88 },
        ]

  return fallbackRates
}

/**
 * Принудительное обновление с очисткой кэша
 */
export const refreshRates = async (base: BaseCurrency = 'USD'): Promise<NormalizedRate[]> => {
  localStorage.removeItem(`${CACHE_KEY}-${base}`)
  return getRates(base)
}

/**
 * Совместимость с устаревшими вызовами
 */
export const fetchRates = getRates
export const fetchKgsRates = () => getRates('KGS')
export const refreshKgsRates = () => refreshRates('KGS')
