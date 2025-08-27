/**
 * @file CurrencyRates.tsx - Функциональный компонент управления валютными курсами
 * Архитектура: React.memo + useMemo оптимизации для мебельной фабрики WASSER
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Loader2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import * as exchangeRateApi from '../services/forex'

interface NormalizedRate {
  code: string;
  name: string;
  rate: number;
}

interface CurrencyRatesProps {
  compact?: boolean;
}

const CurrencyRates: React.FC<CurrencyRatesProps> = React.memo(({ compact = false }) => {
  const [rates, setRates] = useState<NormalizedRate[]>([])
  const [comparisonRates, setComparisonRates] = useState<NormalizedRate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [base, setBase] = useState('USD')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Мемоизированные курсы для производительности
  const displayRates = useMemo(() => {
    const mainCurrencies = ['USD', 'EUR', 'RUB', 'KGS']
    return rates.filter(rate => mainCurrencies.includes(rate.code))
  }, [rates])

  // Функциональная загрузка курсов
  const loadRates = useCallback(async (targetBase: string) => {
    setLoading(true)
    setError(null)

    try {
      const fetchedRates = await exchangeRateApi.getRates(targetBase)
      setRates(fetchedRates)
      setLastUpdated(new Date())
    } catch (err) {
      setError('Ошибка загрузки курсов валют')
      console.warn('Forex API error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Эффект инициализации
  useEffect(() => {
    loadRates(base)
  }, [base, loadRates])

  // Функциональный рендер валюты
  const renderCurrencyRate = useCallback((rate: NormalizedRate) => (
    <div key={rate.code} className="flex justify-between items-center py-2 border-b">
      <div className="flex items-center space-x-2">
        <Badge variant="outline">{rate.code}</Badge>
        <span className="text-sm text-gray-600">{rate.name}</span>
      </div>
      <div className="text-right">
        <span className="font-mono text-sm">{rate.rate.toFixed(4)}</span>
      </div>
    </div>
  ), [])

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Курсы валют</CardTitle>
          <CardDescription>
            {loading ? 'Загрузка...' : `Обновлено: ${lastUpdated?.toLocaleTimeString() || 'Не загружено'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : (
            <div className="space-y-1">
              {displayRates.slice(0, 3).map(renderCurrencyRate)}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Валютные курсы</CardTitle>
            <CardDescription>
              Актуальные курсы для мебельной фабрики WASSER
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadRates(base)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8">
            <div className="text-red-600">{error}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => loadRates(base)}
            >
              Повторить
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {displayRates.map(renderCurrencyRate)}
          </div>
        )}
        
        {lastUpdated && (
          <div className="text-xs text-gray-500 mt-4 text-center">
            Последнее обновление: {lastUpdated.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

CurrencyRates.displayName = 'CurrencyRates'

export default CurrencyRates
