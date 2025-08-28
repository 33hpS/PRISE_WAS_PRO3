// src/components/furniture/ProductCard.tsx
// Функциональная карточка товара мебели с типобезопасностью

import React, { useMemo, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PackageOpen, Ruler, Calendar } from 'lucide-react';
import { ProductCardProps, FurnitureCollection } from '../../types/furniture';
import { calculateFurniturePrice, formatPrice, getCollectionMultiplier } from '../../utils/pricing';

/**
 * Функциональная утилита получения стиля коллекции
 */
const getCollectionBadgeVariant = (collection: FurnitureCollection): "default" | "secondary" | "outline" | "destructive" => {
  const variants: Record<FurnitureCollection, "default" | "secondary" | "outline" | "destructive"> = {
    'Premium': 'default',
    'Comfort': 'secondary',
    'Basic': 'outline',
    'Luxury': 'default'
  };
  return variants[collection];
};

/**
 * Утилита форматирования габаритов
 */
const formatDimensions = (dimensions?: { width: number; height: number; depth: number }): string => {
  if (!dimensions) return 'Размеры не указаны';
  const { width, height, depth } = dimensions;
  return `${width}×${height}×${depth} см`;
};

/**
 * Утилита форматирования даты
 */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
};

/**
 * Оптимизированная карточка товара мебели для WASSER
 */
const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  onSelect,
  isSelected = false,
  showCalculations = false
}) => {
  const {
    article,
    name,
    collection,
    category,
    basePrice,
    materials,
    dimensions,
    isActive,
    createdAt
  } = product;

  // Мемоизированный расчет итоговой цены
  const calculatedPrice = useMemo(() => 
    calculateFurniturePrice(basePrice, collection),
    [basePrice, collection]
  );

  // Мемоизированное форматирование цены
  const formattedPrice = useMemo(() => 
    formatPrice(calculatedPrice),
    [calculatedPrice]
  );

  // Мемоизированная базовая цена для показа расчетов
  const formattedBasePrice = useMemo(() => 
    formatPrice(basePrice),
    [basePrice]
  );

  // Мемоизированный множитель коллекции
  const collectionMultiplier = useMemo(() => 
    getCollectionMultiplier(collection),
    [collection]
  );

  // Мемоизированные габариты
  const dimensionsText = useMemo(() => 
    formatDimensions(dimensions),
    [dimensions]
  );

  // Мемоизированная дата создания
  const createdDate = useMemo(() => 
    formatDate(createdAt),
    [createdAt]
  );

  // Мемоизированный стиль коллекции
  const collectionVariant = useMemo(() => 
    getCollectionBadgeVariant(collection),
    [collection]
  );

  // Стабильный обработчик выбора товара
  const handleSelect = useCallback(() => {
    onSelect?.(product);
  }, [onSelect, product]);

  return (
    <Card className={`
      relative overflow-hidden transition-all duration-300 hover:shadow-lg group cursor-pointer
      ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}
      ${!isActive ? 'opacity-60' : ''}
    `}>
      {/* Индикатор выбора */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}

      {/* Индикатор неактивного товара */}
      {!isActive && (
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="text-xs">
            Неактивен
          </Badge>
        </div>
      )}

      <CardContent className="p-4" onClick={handleSelect}>
        {/* Заголовок и цена */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-blue-600 transition-colors">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Артикул: <span className="font-mono">{article}</span>
            </p>
          </div>
          
          <div className="text-right ml-3">
            <div className="text-xl font-bold text-foreground">
              {formattedPrice}
            </div>
            {showCalculations && basePrice !== calculatedPrice && (
              <div className="text-sm text-muted-foreground">
                База: {formattedBasePrice}
              </div>
            )}
          </div>
        </div>

        {/* Коллекция и категория */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={collectionVariant} className="text-xs">
            {collection}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
        </div>

        {/* Информация о товаре */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <PackageOpen className="w-4 h-4 mr-2" />
            <span>Материалы: {materials.length} шт.</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Ruler className="w-4 h-4 mr-2" />
            <span>{dimensionsText}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Добавлен: {createdDate}</span>
          </div>
        </div>

        {/* Расчеты коллекции */}
        {showCalculations && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
            <div className="text-sm font-medium mb-2">Расчет цены:</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Базовая цена:</span>
                <span>{formattedBasePrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Множитель коллекции:</span>
                <span>×{collectionMultiplier}</span>
              </div>
              <div className="border-t pt-1 flex justify-between font-medium">
                <span>Итого:</span>
                <span>{formattedPrice}</span>
              </div>
            </div>
          </div>
        )}

        {/* Список материалов */}
        {materials.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Материалы:</div>
            <div className="flex flex-wrap gap-1">
              {materials.slice(0, 3).map((material, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {material}
                </Badge>
              ))}
              {materials.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{materials.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Действия */}
        <div className="flex gap-2">
          <Button
            onClick={handleSelect}
            className="flex-1"
            variant={isSelected ? "secondary" : "default"}
          >
            {isSelected ? 'Выбран' : 'Добавить в прайс-лист'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

export { ProductCard };