/**
 * Forex service: fetch and cache exchange rates with selectable base (KGS | USD).
 * Uses open.er-api.com (free, CORS-friendly).
 */

export type CurrencyCode = 'USD' | 'EUR' | 'RUB' | 'KZT' | 'CNY'

/**
 * Supported base currencies for display
 */
export type BaseCurrency = 'KGS' | 'USD'

/**
 * Branded type for cache key safety
 */
export type CacheKey = string & { readonly __brand: 'CacheKey' }

/**
 * Shape of API response from open.er-api.com for latest rates
 */
interface ErApiResponse {
  result: 'success' | 'error'
  time_last_update_unix: number
  time_last_update_utc: string
  time_next_update_unix: number
  time_next_update_utc: string
  base_code: string
  rates: Record<string, number>
}

/**
 * Shape for normalized exchange rate entry:
 * perUnit — how many BASE currency units for 1 unit of code.
 * Example: base=KGS => 1 USD = XX KGS; base=USD => 1 EUR = YY USD.
 */
export interface NormalizedRate {
  code: CurrencyCode
  name: string
  flag: string
  perUnit: number
}

/**
 * Cache payload shape
 */
interface ForexCache {
  timestamp: number
  rates: Record<string, number>
  base: BaseCurrency
}

/**
 * Available currencies with UI metadata
 */
export const CURRENCIES: Record<CurrencyCode, { name: string; flag: string }> = {
  USD: { name: 'Доллар США', flag: '🇺🇸' },
  EUR: { name: 'Евро', flag: '🇪🇺' },
  RUB: { name: 'Рубль (Россия)', flag: '🇷🇺' },
  KZT: { name: 'Теңге (Казахстан)', flag: '🇰🇿' },
  CNY: { name: 'Юань (Китай)', flag: '🇨🇳' }
}

/**
 * Cache base key (per base currency)
 */
const FOREX_CACHE_KEY = (base: BaseCurrency): CacheKey =>
  (`forex-cache::${base}` as CacheKey)

/**
 * Cache time-to-live in milliseconds (10 minutes)
 */
const FOREX_TTL = 10 * 60 * 1000

/**
 * Read cached rates if fresh
 */
function readCache(base: BaseCurrency): ForexCache | null {
  try {
    const raw = localStorage.getItem(FOREX_CACHE_KEY(base))
    if (!raw) return null
    const parsed: ForexCache = JSON.parse(raw)
    if (parsed.base !== base) return null
    if (Date.now() - parsed.timestamp > FOREX_TTL) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Write rates to cache
 */
function writeCache(base: BaseCurrency, rates: Record<string, number>) {
  const payload: ForexCache = { timestamp: Date.now(), rates, base }
  localStorage.setItem(FOREX_CACHE_KEY(base), JSON.stringify(payload))
}

/**
 * Fetch latest rates with selected base from API.
 * API returns: 1 BASE = rates[target] TARGET
 */
export async function fetchRates(base: BaseCurrency): Promise<NormalizedRate[]> {
  // Try cache first
  const cached = readCache(base)
  if (cached) {
    return normalizeRates(base, cached.rates)
  }

  const endpoint = `https://open.er-api.com/v6/latest/${base}`
  const resp = await fetch(endpoint)
  if (!resp.ok) {
    if (cached) return normalizeRates(base, cached.rates)
    throw new Error('Не удалось загрузить курсы валют')
  }

  const data: ErApiResponse = await resp.json()
  if (data.result !== 'success' || !data.rates) {
    if (cached) return normalizeRates(base, cached.rates)
    throw new Error('Ответ API валют некорректен')
  }

  writeCache(base, data.rates)
  return normalizeRates(base, data.rates)
}

/**
 * Normalize API map into list of selected currencies with "per unit" in BASE.
 * For API map: 1 BASE = R[C] C
 * Then 1 C = 1 / R[C] BASE
 */
function normalizeRates(
  base: BaseCurrency,
  apiRates: Record<string, number>
): NormalizedRate[] {
  const desired: CurrencyCode[] = ['USD', 'EUR', 'RUB', 'KZT', 'CNY']
  const list: NormalizedRate[] = desired.map((code) => {
    const r = apiRates[code]
    const perUnit = r ? 1 / r : 0
    const meta = CURRENCIES[code]
    return {
      code,
      name: meta.name,
      flag: meta.flag,
      perUnit: Number.isFinite(perUnit) ? perUnit : 0
    }
  })

  // Consistent ordering
  const order = ['USD', 'EUR', 'RUB', 'KZT', 'CNY']
  list.sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code))
  return list
}

/**
 * Force refresh ignoring cache (clear cache then fetch)
 */
export async function refreshRates(base: BaseCurrency): Promise<NormalizedRate[]> {
  localStorage.removeItem(FOREX_CACHE_KEY(base))
  return fetchRates(base)
}

/**
 * Backward compatibility helpers (KGS)
 */
export async function fetchKgsRates(): Promise<NormalizedRate[]> {
  return fetchRates('KGS')
}
export async function refreshKgsRates(): Promise<NormalizedRate[]> {
  return refreshRates('KGS')
}
