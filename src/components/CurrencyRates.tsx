import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Типы для валют
export type BaseCurrency = 'USD' | 'EUR' | 'CNY' | 'TRY';

export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  change: number;
  flag?: string;
  perUnit?: number;
}

interface CurrencyRatesProps {
  rates?: Record<string, CurrencyRate>;
  onRatesChange?: (rates: Record<string, CurrencyRate>) => void;
}

const CurrencyRates: React.FC<CurrencyRatesProps> = ({ rates: externalRates, onRatesChange }) => {
  const [baseCurrency, setBaseCurrency] = useState<BaseCurrency>('USD');
  const [customRates, setCustomRates] = useState<Record<string, number>>({
    USD: 90.5,
    EUR: 98.2,
    CNY: 12.4,
    TRY: 2.8
  });

  // Используем внешние rates если они переданы, иначе создаем на основе customRates
  const rates = useMemo(() => {
    if (externalRates) return externalRates;
    
    return Object.entries(customRates).reduce((acc, [code, rate]) => {
      acc[code] = {
        code,
        name: getCurrencyName(code),
        rate,
        change: 0,
        flag: getCurrencyFlag(code),
        perUnit: code === 'CNY' || code === 'TRY' ? 10 : 1
      };
      return acc;
    }, {} as Record<string, CurrencyRate>);
  }, [externalRates, customRates]);

  // Безопасное преобразование строки в BaseCurrency
  const handleBaseCurrencyChange = (value: string) => {
    if (isValidBaseCurrency(value)) {
      setBaseCurrency(value);
    }
  };

  // Type guard для проверки валидности BaseCurrency
  const isValidBaseCurrency = (value: string): value is BaseCurrency => {
    return ['USD', 'EUR', 'CNY', 'TRY'].includes(value);
  };

  const getCurrencyName = (code: string): string => {
    const names: Record<string, string> = {
      USD: 'Доллар США',
      EUR: 'Евро',
      CNY: 'Юань',
      TRY: 'Турецкая лира'
    };
    return names[code] || code;
  };

  const getCurrencyFlag = (code: string): string => {
    const flags: Record<string, string> = {
      USD: '🇺🇸',
      EUR: '🇪🇺',
      CNY: '🇨🇳',
      TRY: '🇹🇷'
    };
    return flags[code] || '🏳️';
  };

  const handleRateChange = (currency: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomRates(prev => ({
      ...prev,
      [currency]: numValue
    }));

    if (onRatesChange) {
      const updatedRates = { ...rates };
      if (updatedRates[currency]) {
        updatedRates[currency].rate = numValue;
      }
      onRatesChange(updatedRates);
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const convertedRates = useMemo(() => {
    const baseRate = rates[baseCurrency]?.rate || 1;
    return Object.entries(rates)
      .filter(([code]) => code !== baseCurrency)
      .map(([code, currency]) => ({
        ...currency,
        convertedRate: (currency.rate / baseRate).toFixed(4)
      }));
  }, [rates, baseCurrency]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Курсы валют</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="base-currency">Базовая валюта</Label>
          <Select value={baseCurrency} onValueChange={handleBaseCurrencyChange}>
            <SelectTrigger id="base-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">🇺🇸 Доллар США</SelectItem>
              <SelectItem value="EUR">🇪🇺 Евро</SelectItem>
              <SelectItem value="CNY">🇨🇳 Юань</SelectItem>
              <SelectItem value="TRY">🇹🇷 Турецкая лира</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Курсы к рублю:</h4>
          {Object.entries(rates).map(([code, currency]) => (
            <div key={code} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{currency.flag}</span>
                <div>
                  <div className="font-medium">{currency.name}</div>
                  <div className="text-sm text-gray-500">
                    {currency.perUnit && currency.perUnit > 1 ? `за ${currency.perUnit} единиц` : 'за 1 единицу'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={currency.rate}
                  onChange={(e) => handleRateChange(code, e.target.value)}
                  className="w-24 text-right"
                  step="0.01"
                />
                {getTrendIcon(currency.change)}
              </div>
            </div>
          ))}
        </div>

        {convertedRates.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium">Кросс-курсы к {getCurrencyName(baseCurrency)}:</h4>
            {convertedRates.map(({ code, name, convertedRate, flag }) => (
              <div key={code} className="flex justify-between text-sm">
                <span>{flag} {name}</span>
                <span className="font-mono">{convertedRate}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrencyRates;