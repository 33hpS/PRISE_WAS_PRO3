// src/hooks/useDashboard.ts
// Кастомный хук для управления состоянием дашборда WASSER
// Функциональная архитектура с типобезопасностью и мемоизацией

import { useState, useMemo, useCallback } from 'react';
import { DashboardData, FurnitureItemProps, ActivityItem, DashboardMetrics } from '../types/furniture';
import { calculateTotalValue, calculateAveragePrice, calculateTrendPercentage } from '../utils/pricing';

/**
 * Хук для управления данными дашборда мебельной фабрики
 */
export const useDashboard = (initialProducts: FurnitureItemProps[] = []) => {
  const [products, setProducts] = useState<FurnitureItemProps[]>(initialProducts);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Мемоизированные метрики на основе текущих данных
  const metrics: DashboardMetrics = useMemo(() => {
    const activeProducts = products.filter(p => p.isActive);
    const totalValue = calculateTotalValue(activeProducts);
    
    // В реальном приложении эти значения пришли бы из API
    // Здесь используем расчеты на основе текущих данных
    return {
      products: {
        total: products.length,
        active: activeProducts.length,
        trend: 12, // +12% с прошлого месяца
        isPositive: true
      },
      priceLists: {
        generated: recentActivity.filter(a => a.type === 'created_pricelist').length,
        trend: 8,
        isPositive: true
      },
      clients: {
        active: 64, // Фиксированное значение, в реальности из API
        trend: 23,
        isPositive: true
      },
      sales: {
        monthly: totalValue,
        trend: 16,
        isPositive: true
      }
    };
  }, [products, recentActivity]);

  // Мемоизированные последние товары (отсортированные по дате обновления)
  const recentProducts = useMemo(() => 
    [...products]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 4), // Показываем 4 последних товара
    [products]
  );

  // Мемоизированные выбранные товары
  const selectedProducts = useMemo(() => 
    products.filter(p => selectedProductIds.includes(p.id)),
    [products, selectedProductIds]
  );

  // Мемоизированные статистические данные
  const dashboardStats = useMemo(() => {
    const totalValue = calculateTotalValue(products);
    const averagePrice = calculateAveragePrice(products);
    const collectionsCount = new Set(products.map(p => p.collection)).size;
    
    return {
      totalValue,
      averagePrice,
      collectionsCount,
      selectedCount: selectedProductIds.length,
      selectedValue: calculateTotalValue(selectedProducts)
    };
  }, [products, selectedProducts, selectedProductIds]);

  // Мемоизированный объект данных для дашборда
  const dashboardData: DashboardData = useMemo(() => ({
    metrics,
    recentProducts,
    recentActivity: recentActivity.slice(0, 5), // Показываем 5 последних активностей
    totalValue: dashboardStats.totalValue,
    averagePrice: dashboardStats.averagePrice,
    collectionsCount: dashboardStats.collectionsCount
  }), [metrics, recentProducts, recentActivity, dashboardStats]);

  // Функция добавления товара
  const addProduct = useCallback((product: FurnitureItemProps) => {
    setProducts(prev => [...prev, product]);
    
    // Добавляем запись об активности
    const activityItem: ActivityItem = {
      id: `activity-${Date.now()}`,
      type: 'updated_product',
      description: `Добавлен товар "${product.name}"`,
      user: 'Система',
      userRole: 'Админ',
      timestamp: new Date()
    };
    
    setRecentActivity(prev => [activityItem, ...prev]);
  }, []);

  // Функция обновления товара
  const updateProduct = useCallback((productId: string, updates: Partial<FurnitureItemProps>) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, ...updates, updatedAt: new Date() }
        : product
    ));

    // Добавляем запись об активности
    const product = products.find(p => p.id === productId);
    if (product) {
      const activityItem: ActivityItem = {
        id: `activity-${Date.now()}`,
        type: 'updated_product',
        description: `Обновлен товар "${product.name}"`,
        user: 'Менеджер',
        userRole: 'Менеджер',
        timestamp: new Date()
      };
      
      setRecentActivity(prev => [activityItem, ...prev]);
    }
  }, [products]);

  // Функция выбора/отмены выбора товара
  const toggleProductSelection = useCallback((productId: string) => {
    setSelectedProductIds(prev => {
      const isSelected = prev.includes(productId);
      return isSelected 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
    });
  }, []);

  // Функция выбора товара
  const selectProduct = useCallback((product: FurnitureItemProps) => {
    toggleProductSelection(product.id);
  }, [toggleProductSelection]);

  // Функция очистки выборки
  const clearSelection = useCallback(() => {
    setSelectedProductIds([]);
  }, []);

  // Функция создания прайс-листа
  const createPriceList = useCallback(() => {
    if (selectedProducts.length === 0) return;

    setIsLoading(true);
    
    // Имитация асинхронной операции создания прайс-листа
    setTimeout(() => {
      const activityItem: ActivityItem = {
        id: `activity-${Date.now()}`,
        type: 'created_pricelist',
        description: `Создан прайс-лист (${selectedProducts.length} товаров)`,
        user: 'Админ',
        userRole: 'Админ',
        timestamp: new Date()
      };
      
      setRecentActivity(prev => [activityItem, ...prev]);
      clearSelection();
      setIsLoading(false);
    }, 1000);
  }, [selectedProducts, clearSelection]);

  // Функция добавления записи об активности
  const addActivity = useCallback((activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const activityItem: ActivityItem = {
      ...activity,
      id: `activity-${Date.now()}`,
      timestamp: new Date()
    };
    
    setRecentActivity(prev => [activityItem, ...prev]);
  }, []);

  // Функция поиска товаров
  const searchProducts = useCallback((query: string) => {
    if (!query.trim()) return products;
    
    const lowercaseQuery = query.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.article.toLowerCase().includes(lowercaseQuery) ||
      product.collection.toLowerCase().includes(lowercaseQuery) ||
      product.category.toLowerCase().includes(lowercaseQuery)
    );
  }, [products]);

  // Функция фильтрации товаров по коллекции
  const filterByCollection = useCallback((collection: string) => {
    return products.filter(product => product.collection === collection);
  }, [products]);

  return {
    // Данные
    dashboardData,
    products,
    selectedProducts,
    selectedProductIds,
    recentActivity,
    dashboardStats,
    isLoading,

    // Действия
    addProduct,
    updateProduct,
    selectProduct,
    toggleProductSelection,
    clearSelection,
    createPriceList,
    addActivity,
    searchProducts,
    filterByCollection,
    setProducts
  };
};