// src/utils/pricing.ts
// Функциональные утилиты расчета цен мебели WASSER
// Чистые функции без побочных эффектов

import { FurnitureCollection, FurnitureItemProps, PriceListItem } from '../types/furniture';

// Константы множителей коллекций
const COLLECTION_MULTIPLIERS: Record<FurnitureCollection, number> = {
  'Premium': 1.5,
  'Comfort': 1.2,
  'Basic': 1.0,
  'Luxury': 1.8
} as const;

/**
 * Чистая функция получения множителя коллекции
 */
export const getCollectionMultiplier = (collection: FurnitureCollection): number => {
  return COLLECTION_MULTIPLIERS[collection] || 1.0;
};

/**
 * Функциональный расчет итоговой цены товара
 */
export const calculateFurniturePrice = (
  basePrice: number, 
  collection: FurnitureCollection
): number => {
  const multiplier = getCollectionMultiplier(collection);
  return Math.round(basePrice * multiplier);
};

/**
 * Утилита форматирования цены в рублях
 */
export const formatPrice = (price: number): string => {
  return `${price.toLocaleString('ru-RU')} ₽`;
};

/**
 * Форматирование крупных сумм (для дашборда)
 */
export const formatLargeAmount = (amount: number): string => {
  if (amount >= 1000000) {
    return `₽${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `₽${(amount / 1000).toFixed(0)}K`;
  }
  return formatPrice(amount);
};

/**
 * Расчет элемента прайс-листа с полной информацией
 */
export const calculatePriceListItem = (product: FurnitureItemProps): PriceListItem => {
  const collectionMultiplier = getCollectionMultiplier(product.collection);
  const calculatedPrice = calculateFurniturePrice(product.basePrice, product.collection);
  
  return {
    product,
    calculatedPrice,
    collectionMultiplier,
    formattedPrice: formatPrice(calculatedPrice)
  };
};

/**
 * Функция расчета общей стоимости товаров
 */
export const calculateTotalValue = (products: readonly FurnitureItemProps[]): number => {
  return products.reduce((total, product) => {
    const price = calculateFurniturePrice(product.basePrice, product.collection);
    return total + price;
  }, 0);
};

/**
 * Функция расчета средней цены
 */
export const calculateAveragePrice = (products: readonly FurnitureItemProps[]): number => {
  if (products.length === 0) return 0;
  
  const totalValue = calculateTotalValue(products);
  return Math.round(totalValue / products.length);
};

/**
 * Группировка товаров по коллекциям с расчетами
 */
export const groupProductsByCollection = (
  products: readonly FurnitureItemProps[]
): Record<FurnitureCollection, { products: FurnitureItemProps[], totalValue: number, count: number }> => {
  return products.reduce((groups, product) => {
    const collection = product.collection;
    
    if (!groups[collection]) {
      groups[collection] = {
        products: [],
        totalValue: 0,
        count: 0
      };
    }
    
    const price = calculateFurniturePrice(product.basePrice, product.collection);
    groups[collection].products.push(product);
    groups[collection].totalValue += price;
    groups[collection].count += 1;
    
    return groups;
  }, {} as Record<FurnitureCollection, { products: FurnitureItemProps[], totalValue: number, count: number }>);
};

/**
 * Расчет статистики коллекций
 */
export const calculateCollectionStats = (products: readonly FurnitureItemProps[]) => {
  const grouped = groupProductsByCollection(products);
  
  return Object.entries(grouped).map(([collection, data]) => ({
    collection: collection as FurnitureCollection,
    count: data.count,
    totalValue: data.totalValue,
    averagePrice: Math.round(data.totalValue / data.count),
    formattedTotalValue: formatPrice(data.totalValue),
    formattedAveragePrice: formatPrice(Math.round(data.totalValue / data.count)),
    multiplier: getCollectionMultiplier(collection as FurnitureCollection)
  }));
};

/**
 * Валидация цены товара
 */
export const validateProductPrice = (basePrice: number): boolean => {
  return basePrice > 0 && basePrice <= 10000000; // до 10M рублей
};

/**
 * Применение скидки к товару
 */
export const applyDiscount = (
  basePrice: number, 
  collection: FurnitureCollection, 
  discountPercent: number
): number => {
  const originalPrice = calculateFurniturePrice(basePrice, collection);
  const discountAmount = Math.round(originalPrice * (discountPercent / 100));
  return originalPrice - discountAmount;
};

/**
 * Расчет процентного изменения
 */
export const calculateTrendPercentage = (currentValue: number, previousValue: number): number => {
  if (previousValue === 0) return 0;
  return Math.round(((currentValue - previousValue) / previousValue) * 100);
};

/**
 * Сравнение цен двух товаров
 */
export const comparePrices = (
  product1: FurnitureItemProps, 
  product2: FurnitureItemProps
): number => {
  const price1 = calculateFurniturePrice(product1.basePrice, product1.collection);
  const price2 = calculateFurniturePrice(product2.basePrice, product2.collection);
  return price1 - price2;
};