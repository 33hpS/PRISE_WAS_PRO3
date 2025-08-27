/**
 * CurrencyRates widget: shows latest exchange rates to selected base (KGS | USD),
 * with caching (10m), manual refresh, optional auto-refresh and delta indicators.
 */

import { useEffect, useMemo, useState, useTransition } from 'react'
import { RefreshCw, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import type { NormalizedRate, BaseCurrency } from '../services/forex'
import { fetchRates, refreshRates } from '../services/forex'

/**
 * Branded type for stable currency rows identity
 */
type RateRowId = string & { readonly __brand: 'RateRowId' }

/**
 * Local state shape with optional previous value for pseudo delta.
 */
interface RateWithPrev extends NormalizedRate {
  previous?: number
}

/**
 * Color palette per currency for better visual grouping
 */
const tone: Record<string, { bg: string; border: string; text: string }> = {
  USD: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
  EUR: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  RUB: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
  KZT: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800' },
  CNY: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800' },
}

/**
 * Local storage keys
 */
const BASE_KEY = 'forex-base'
const AUTO_KEY = 'forex-auto'

/**
 * Format number with thin grouping and unit
 */
function formatValue(value: number, base: BaseCurrency): string {
  const formatted = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)
  return `${formatted} ${base === 'KGS' ? 'сом' : 'USD'}`
}

/**
 * Map base label for title
 */
function baseLabel(base: BaseCurrency): string {
  return base === 'KGS' ? 'сомам' : 'доллару'
}

/**
 * CurrencyRates component: fetches, caches and displays currency rates.
 */
export default function CurrencyRates() {
  const [rates, setRates] = useState<RateWithPrev[]>([])
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string>('')

  // Smooth refresh without blocking UI
  const [isPending, startTransition] = useTransition()

  // Base currency selection and auto-refresh toggle
  const [base, setBase] = useState<BaseCurrency>(() => {
    const saved = localStorage.getItem(BASE_KEY) as BaseCurrency | null
    return saved === 'USD' ? 'USD' : 'KGS'
  })
  const [auto, setAuto] = useState<boolean>(() => {
    return localStorage.getItem(AUTO_KEY) === '1'
  })

  // Interval id guard
  const [intervalId, setIntervalId] = useState<number | null>(null)

  /**
   * Initial load and whenever base changes
   */
  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const data = fetchRates(base)
        if (!isMounted) return
        setRates(prev => mergeWithPrev(prev, data))
        setUpdatedAt(new Date())
        setError('')
      } catch (e: any) {
        setError(e?.message || 'Не удалось загрузить курсы валют')
      }
    })()
    return () => {
      isMounted = false
    }
  }, [base])

  /**
   * Setup/cleanup auto-refresh interval
   */
  useEffect(() => {
    // Clear previous
    if (intervalId) {
      window.clearInterval(intervalId)
      setIntervalId(null)
    }
    if (!auto) return

    // Every 10 minutes to match TTL
    const id = window.setInterval(
      () => {
        startTransition(() => {
          try {
            const data = refreshRates(base)
            setRates(prev => mergeWithPrev(prev, data))
            setUpdatedAt(new Date())
            setError('')
          } catch (e: any) {
            setError(e?.message || 'Ошибка автообновления курсов')
          }
        })
      },
      10 * 60 * 1000
    )

    setIntervalId(id)
    return () => {
      window.clearInterval(id)
    }
  }, [auto, base])

  /**
   * Persist base/auto to storage when changed
   */
  useEffect(() => {
    localStorage.setItem(BASE_KEY, base)
  }, [base])
  useEffect(() => {
    localStorage.setItem(AUTO_KEY, auto ? '1' : '0')
  }, [auto])

  /**
   * Merge new values with previous for local delta indicator
   */
  const mergeWithPrev = (prev: RateWithPrev[], next: NormalizedRate[]): RateWithPrev[] => {
    const prevMap = new Map(prev.map(r => [r.code, r.perUnit]))
    return next.map(n => ({
      ...n,
      previous: prevMap.get(n.code),
    }))
  }

  /**
   * Manual refresh
   */
  const handleRefresh = () => {
    startTransition(() => {
      try {
        const data = refreshRates(base)
        setRates(prev => mergeWithPrev(prev, data))
        setUpdatedAt(new Date())
        setError('')
      } catch (e: any) {
        setError(e?.message || 'Ошибка обновления курсов валют')
      }
    })
  }

  /**
   * Memoized rows for rendering performance
   */
  const rows = useMemo(() => {
    return rates.map(r => {
      const id = r.code as unknown as RateRowId
      const delta = r.previous ? r.perUnit - r.previous : 0
      const deltaIcon =
        delta > 0.0001 ? (
          <ArrowUpRight className='w-3 h-3 text-emerald-600' />
        ) : delta < -0.0001 ? (
          <ArrowDownRight className='w-3 h-3 text-red-600' />
        ) : null

      const palette = tone[r.code] || {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-800',
      }

      return (
        <div
          key={id}
          className={`p-3 rounded-lg border ${palette.bg} ${palette.border} hover:shadow-sm transition-transform duration-200 hover:-translate-y-0.5`}
          aria-label={`Курс ${r.name}`}
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='text-xl' aria-hidden>
                {r.flag}
              </span>
              <div>
                <div className={`text-sm font-semibold ${palette.text}`}>{r.code}</div>
                <div className='text-xs text-gray-500'>{r.name}</div>
              </div>
            </div>
            <div className='text-right'>
              <div className='text-sm font-bold text-gray-900'>{formatValue(r.perUnit, base)}</div>
              {deltaIcon && (
                <div className='flex items-center justify-end gap-1 text-xs text-gray-500'>
                  {deltaIcon}
                  <span>
                    {delta > 0 ? '+' : ''}
                    {Math.abs(delta).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    })
  }, [rates, base])

  return (
    <Card className='bg-white border border-gray-200'>
      <CardHeader className='flex items-center justify-between space-y-0'>
        <CardTitle className='text-base font-semibold'>
          Курсы валют к {baseLabel(base)} ({base})
        </CardTitle>
        <div className='flex items-center gap-2'>
          <div className='hidden sm:flex items-center gap-1'>
            <Button
              variant='outline'
              className={`bg-transparent h-8 px-3 ${base === 'KGS' ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
              onClick={() => setBase('KGS')}
              aria-label='Показывать в сомах (KGS)'
            >
              KGS
            </Button>
            <Button
              variant='outline'
              className={`bg-transparent h-8 px-3 ${base === 'USD' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''}`}
              onClick={() => setBase('USD')}
              aria-label='Показывать в долларах (USD)'
            >
              USD
            </Button>
          </div>
          <Button
            variant='outline'
            onClick={() => setAuto(a => !a)}
            className={`bg-transparent h-8 px-3 ${auto ? 'bg-amber-50 border-amber-200 text-amber-700' : ''}`}
            aria-label='Переключить автообновление'
            title='Автообновление каждые 10 минут'
          >
            {auto ? 'Авто: Вкл' : 'Авто: Выкл'}
          </Button>
          <Button
            variant='outline'
            onClick={handleRefresh}
            className='bg-transparent h-8 px-3'
            aria-label='Обновить курсы валют'
            title='Обновить сейчас'
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className='flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm'>
            <AlertTriangle className='w-4 h-4' />
            {error}
          </div>
        ) : rates.length === 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3'>
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className='p-3 rounded-lg border border-gray-200 bg-gray-50 animate-pulse h-[64px]'
              />
            ))}
          </div>
        ) : (
          <div>
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3'>{rows}</div>
            {updatedAt && (
              <div className='text-xs text-gray-500 mt-3'>
                Обновлено: {updatedAt.toLocaleTimeString('ru-RU')}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

