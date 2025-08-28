// src/components/dashboard/Dashboard.tsx
// Главный компонент дашборда WASSER с функциональной архитектурой

import React, { useMemo, useCallback, startTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Package, 
  FileText, 
  Users, 
  TrendingUp, 
  Plus,
  Clock,
  Calendar,
  Activity
} from 'lucide-react';
import { MetricCard } from './MetricCard';
import { ProductCard } from '../furniture/ProductCard';
import { DashboardData, FurnitureItemProps, ActivityItem } from '../../types/furniture';
import { formatLargeAmount, calculateTotalValue, calculateAveragePrice } from '../../utils/pricing';

interface DashboardProps {
  readonly data: DashboardData;
  readonly onCreatePriceList?: () => void;
  readonly onProductSelect?: (product: FurnitureItemProps) => void;
  readonly selectedProducts?: readonly string[];
}

/**
 * Функциональная утилита форматирования времени активности
 */
const formatActivityTime = (timestamp: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} мин назад`;
  } else if (diffInMinutes < 1440) { // 24 часа
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} час${hours === 1 ? '' : hours < 5 ? 'а' : 'ов'} назад`;
  } else {
    return timestamp.toLocaleDateString('ru-RU');
  }
};

/**
 * Утилита получения иконки активности
 */
const getActivityIcon = (type: ActivityItem['type']) => {
  const icons = {
    created_pricelist: FileText,
    updated_product: Package,
    added_material: Plus,
    exported_pdf: FileText
  };
  return icons[type] || Activity;
};

/**
 * Компонент элемента активности
 */
const ActivityItemComponent: React.FC<{ 
  readonly activity: ActivityItem 
}> = React.memo(({ activity }) => {
  const ActivityIcon = useMemo(() => getActivityIcon(activity.type), [activity.type]);
  
  const timeAgo = useMemo(() => 
    formatActivityTime(activity.timestamp), 
    [activity.timestamp]
  );

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
        <ActivityIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">
          {activity.description}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {activity.user} • {activity.userRole}
        </div>
      </div>
      
      <div className="flex-shrink-0 text-xs text-muted-foreground flex items-center">
        <Clock className="h-3 w-3 mr-1" />
        {timeAgo}
      </div>
    </div>
  );
});

ActivityItemComponent.displayName = 'ActivityItemComponent';

/**
 * Главный компонент дашборда WASSER
 */
const Dashboard: React.FC<DashboardProps> = React.memo(({
  data,
  onCreatePriceList,
  onProductSelect,
  selectedProducts = []
}) => {
  const { metrics, recentProducts, recentActivity } = data;

  // Мемоизированные карточки метрик
  const metricCards = useMemo(() => [
    {
      title: 'Товары',
      value: metrics.products.total,
      trend: metrics.products.trend,
      isPositive: metrics.products.isPositive,
      icon: Package,
      formatter: undefined
    },
    {
      title: 'Прайс-листы',
      value: metrics.priceLists.generated,
      trend: metrics.priceLists.trend,
      isPositive: metrics.priceLists.isPositive,
      icon: FileText,
      formatter: undefined
    },
    {
      title: 'Клиенты',
      value: metrics.clients.active,
      trend: metrics.clients.trend,
      isPositive: metrics.clients.isPositive,
      icon: Users,
      formatter: undefined
    },
    {
      title: 'Продажи',
      value: metrics.sales.monthly,
      trend: metrics.sales.trend,
      isPositive: metrics.sales.isPositive,
      icon: TrendingUp,
      formatter: formatLargeAmount
    }
  ], [metrics]);

  // Мемоизированная статистика товаров
  const productsStats = useMemo(() => {
    const totalValue = calculateTotalValue(recentProducts);
    const averagePrice = calculateAveragePrice(recentProducts);
    
    return {
      totalValue,
      averagePrice,
      activeCount: recentProducts.filter(p => p.isActive).length
    };
  }, [recentProducts]);

  // Обработчик создания прайс-листа с переходом
  const handleCreatePriceList = useCallback(() => {
    startTransition(() => {
      onCreatePriceList?.();
    });
  }, [onCreatePriceList]);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Панель управления
          </h1>
          <p className="text-muted-foreground mt-1">
            Обзор метрик мебельной фабрики WASSER
          </p>
        </div>
        
        <Button 
          onClick={handleCreatePriceList}
          className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus className="h-4 w-4" />
          Создать прайс-лист
        </Button>
      </div>

      {/* Карточки метрик */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => (
          <MetricCard
            key={`metric-${index}`}
            title={metric.title}
            value={metric.value}
            trend={metric.trend}
            isPositive={metric.isPositive}
            icon={metric.icon}
            formatter={metric.formatter}
          />
        ))}
      </div>

      {/* Дополнительная статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Общая стоимость товаров
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {formatLargeAmount(productsStats.totalValue)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-green-600 dark:text-green-400">
              Средняя цена
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatLargeAmount(productsStats.averagePrice)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
              Активных товаров
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {productsStats.activeCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Основной контент */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Последние товары */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Последние товары
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Недавно добавленные или обновленные товары
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={onProductSelect}
                    isSelected={selectedProducts.includes(product.id)}
                    showCalculations={false}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Активность */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Активность
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                История последних действий в системе
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y dark:divide-gray-700">
                {recentActivity.map((activity) => (
                  <ActivityItemComponent
                    key={activity.id}
                    activity={activity}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export { Dashboard };