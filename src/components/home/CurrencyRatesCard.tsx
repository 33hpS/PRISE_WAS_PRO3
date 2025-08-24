/**
 * @file CurrencyRatesCard.tsx
 * @description Карточка курсов валют с реальными данными из services/forex.ts, кэш и ручное обновление.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { BaseCurrency, NormalizedRate, fetchRates, refreshRates } from '../../services/forex'

/** Локальное состояние загрузки */
type LoadState = 'idle' | 'loading' | 'error'

/**
 * CurrencyRatesCard — реальные курсы, база KGS или USD
 */
export default function CurrencyRatesCard(): JSX.Element {
  const [base, setBase] = useState<BaseCurrency>('KGS')
  const [rates, setRates] = useState<NormalizedRate[]>([])
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)

  /** Загрузка курсов */
  useEffect(() => {
    let mounted = true
    const run = async () => {
      setState('loading')
      setError(null)
      try {
        const list = await fetchRates(base)
        if (!mounted) return
        setRates(list)
        setUpdatedAt(Date.now())
        setState('idle')
      } catch (e: any) {
        setState('error')
        setError(e?.message || 'Не удалось загрузить курсы')
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [base])

  /** Обновление с игнорированием кэша */
  const onRefresh = async () => {
    setState('loading')
    setError(null)
    try {
      const list = await refreshRates(base)
      setRates(list)
      setUpdatedAt(Date.now())
      setState('idle')
    } catch (e: any) {
      setState('error')
      setError(e?.message || 'Ошибка обновления')
    }
  }

  const title = useMemo(() => `Курсы валют (${base})`, [base])

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="flex items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <div
            className="inline-flex rounded-lg border border-gray-200 overflow-hidden"
            role="tablist"
            aria-label="Выбор базовой валюты"
          >
            {(['KGS', 'USD'] as BaseCurrency[]).map((b) => {
              const active = base === b
              return (
                <button
                  key={b}
                  onClick={() => setBase(b)}
                  className={`px-2.5 py-1.5 text-xs ${active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  role="tab"
                  aria-selected={active}
                >
                  {b}
                </button>
              )
            })}
          </div>
          <Button variant="outline" className="bg-transparent h-8 px-3" onClick={onRefresh} aria-label="Обновить курсы" disabled={state === 'loading'}>
            {state === 'loading' ? 'Обновление…' : 'Обновить'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {state === 'error' && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">{error}</div>}
        <div className="grid grid-cols-3 gap-3">
          {rates.map((r) => (
            <div key={r.code} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
              <div className="text-xs text-gray-500">{r.flag} {r.code}</div>
              <div className="text-lg font-bold text-gray-900">{r.perUnit.toFixed(2)}</div>
            </div>
          ))}
        </div>
        {updatedAt && (
          <div className="text-xs text-gray-500 mt-3">Обновлено: {new Date(updatedAt).toLocaleString('ru-RU')}</div>
        )}
      </CardContent>
    </Card>
  )
}
