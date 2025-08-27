import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

// Расширенный тип для нормализованных курсов валют
export interface NormalizedRate {
  code: string;
  name: string;
  rate: number;
  change: number;
  flag: string;      // Добавляем поле flag
  perUnit: number;   // Добавляем поле perUnit
}

interface CurrencyRatesCardProps {
  onRatesUpdate?: (rates: Record<string, NormalizedRate>) => void;
}

const CurrencyRatesCard: React.FC<CurrencyRatesCardProps> = ({ onRatesUpdate }) => {
  const [rates, setRates] = useState<Record<string, NormalizedRate>>({
    USD: {
      code: 'USD',
      name: 'Доллар США',
      rate: 90.5,
      change: 0.5,
      flag: '🇺🇸',
      perUnit: 1
    },
    EUR: {
      code: 'EUR',
      name: 'Евро',
      rate: 98.2,
      change: -0.3,
      flag: '🇪🇺',
      perUnit: 1
    },
    CNY: {
      code: 'CNY',
      name: 'Китайский юань',
      rate: 12.4,
      change: 0.1,
      flag: '🇨🇳',
      perUnit: 10
    },
    TRY: {
      code: 'TRY',
      name: 'Турецкая лира',
      rate: 2.8,
      change: -0.05,
      flag: '🇹🇷',
      perUnit: 10
    }
  });

  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Функция получения актуальных курсов (mock)
  const fetchRates = async () => {
    setLoading(true);
    
    // Имитация загрузки данных
    setTimeout(() => {
      const updatedRates = { ...rates };
      
      // Симулируем изменение курсов
      Object.keys(updatedRates).forEach(key => {
        const randomChange = (Math.random() - 0.5) * 2; // от -1 до 1
        updatedRates[key] = {
          ...updatedRates[key],
          rate: updatedRates[key].rate * (1 + randomChange / 100),
          change: randomChange
        };
      });
      
      setRates(updatedRates);
      setLastUpdate(new Date());
      setLoading(false);
      
      if (onRatesUpdate) {
        onRatesUpdate(updatedRates);
      }
    }, 1000);
  };

  // Получение иконки тренда
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  // Форматирование процента изменения
  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  // Форматирование времени последнего обновления
  const formatLastUpdate = (): string => {
    return lastUpdate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Курсы валют</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRates}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(rates).map((rate) => (
            <div key={rate.code} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{rate.flag}</span>
                  <div>
                    <div className="font-medium">{rate.code}</div>
                    <div className="text-xs text-gray-500">
                      {rate.perUnit > 1 ? `за ${rate.perUnit} единиц` : 'за 1 единицу'}
                    </div>
                  </div>
                </div>
                {getTrendIcon(rate.change)}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">
                  {rate.rate.toFixed(2)}
                </span>
                <span className={`text-sm ${
                  rate.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatChange(rate.change)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          Последнее обновление: {formatLastUpdate()}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencyRatesCard;