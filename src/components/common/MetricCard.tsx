// src/components/dashboard/MetricCard.tsx
// Оптимизированная карточка метрики с функциональной архитектурой

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';
import { MetricCardProps } from '../../types/furniture';

/**
 * Функциональная утилита форматирования тренда
 */
const formatTrend = (trend: number, isPositive: boolean): string => {
  const sign = isPositive ? '+' : '';
  return `${sign}${trend}% с прошлого месяца`;
};

/**
 * Утилита получения цвета тренда
 */
const getTrendColor = (isPositive: boolean): string => {
  return isPositive 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';
};

/**
 * Мемоизированная карточка метрики для дашборда WASSER
 */
const MetricCard: React.FC<MetricCardProps> = React.memo(({
  title,
  value,
  trend,
  isPositive,
  icon: Icon,
  formatter
}) => {
  // Мемоизированное форматирование значения
  const formattedValue = useMemo(() => {
    if (typeof value === 'number' && formatter) {
      return formatter(value);
    }
    return typeof value === 'number' 
      ? value.toLocaleString('ru-RU') 
      : value;
  }, [value, formatter]);

  // Мемоизированное форматирование тренда
  const formattedTrend = useMemo(() => 
    formatTrend(trend, isPositive), 
    [trend, isPositive]
  );

  // Мемоизированный цвет тренда
  const trendColorClass = useMemo(() => 
    getTrendColor(isPositive), 
    [isPositive]
  );

  // Мемоизированная иконка тренда
  const TrendIcon = useMemo(() => 
    isPositive ? ArrowUpRight : ArrowDownRight,
    [isPositive]
  );

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Градиентный фон при hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="relative">
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="text-2xl font-bold mb-1 text-foreground">
          {formattedValue}
        </div>
        
        <div className="flex items-center text-xs">
          <TrendIcon className={`h-3 w-3 mr-1 ${
            isPositive 
              ? 'text-green-500 dark:text-green-400' 
              : 'text-red-500 dark:text-red-400'
          }`} />
          <span className={trendColorClass}>
            {formattedTrend}
          </span>
        </div>
        
        {/* Индикатор тренда */}
        <div className="flex items-center mt-2">
          <div className={`w-full h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden`}>
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isPositive 
                  ? 'bg-gradient-to-r from-green-400 to-green-600' 
                  : 'bg-gradient-to-r from-red-400 to-red-600'
              }`}
              style={{ width: `${Math.min(Math.abs(trend), 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

export { MetricCard };