// src/pages/Home.tsx
// Главная страница WASSER с интеграцией функциональных компонентов
// Типобезопасная архитектура с производительностью и модульностью

import React, { useEffect, useMemo } from 'react';
import { Dashboard } from '../components/dashboard/Dashboard';
import { useDashboard } from '../hooks/useDashboard';
import { FurnitureItemProps, ActivityItem } from '../types/furniture';

/**
 * Тестовые данные для демонстрации функциональности
 * В реальном приложении данные будут загружаться из API
 */
const mockFurnitureData: FurnitureItemProps[] = [
  {
    id: '1',
    article: 'TBL-001',
    name: 'Стол обеденный "Классик"',
    collection: 'Premium',
    category: 'столы',
    basePrice: 30000,
    materials: ['Дуб массив', 'Лак матовый', 'Фурнитура металл'],
    dimensions: {
      width: 180,
      height: 75,
      depth: 90
    },
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    article: 'WRD-002', 
    name: 'Шкаф-купе "Модерн"',
    collection: 'Comfort',
    category: 'шкафы',
    basePrice: 68000,
    materials: ['ЛДСП', 'Зеркало', 'Направляющие soft-close'],
    dimensions: {
      width: 220,
      height: 240,
      depth: 60
    },
    isActive: true,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-12')
  },
  {
    id: '3',
    article: 'BED-003',
    name: 'Кровать двуспальная "Люкс"',
    collection: 'Luxury',
    category: 'кровати',
    basePrice: 53000,
    materials: ['Бук массив', 'Ткань велюр', 'Подъемный механизм'],
    dimensions: {
      width: 200,
      height: 110,
      depth: 220
    },
    isActive: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '4',
    article: 'COM-004',
    name: 'Комод "Минимал"',
    collection: 'Basic',
    category: 'комоды',
    basePrice: 28000,
    materials: ['МДФ', 'Краска белая', 'Ручки хром'],
    dimensions: {
      width: 120,
      height: 80,
      depth: 45
    },
    isActive: true,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-08')
  }
];

/**
 * Тестовые данные активности
 */
const mockActivityData: ActivityItem[] = [
  {
    id: 'activity-1',
    type: 'created_pricelist',
    description: 'Создан прайс-лист',
    user: 'Админ',
    userRole: 'Админ',
    timestamp: new Date(Date.now() - 2 * 60 * 1000) // 2 мин назад
  },
  {
    id: 'activity-2',
    type: 'updated_product',
    description: 'Обновлен товар',
    user: 'Менеджер',
    userRole: 'Менеджер',
    timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 мин назад
  },
  {
    id: 'activity-3',
    type: 'added_material',
    description: 'Добавлен материал',
    user: 'Админ',
    userRole: 'Админ',
    timestamp: new Date(Date.now() - 60 * 60 * 1000) // 1 час назад
  },
  {
    id: 'activity-4',
    type: 'exported_pdf',
    description: 'Экспорт в PDF',
    user: 'Менеджер',
    userRole: 'Менеджер',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 часа назад
  }
];

/**
 * Главный компонент страницы Home
 */
const Home: React.FC = () => {
  const {
    dashboardData,
    selectedProducts,
    createPriceList,
    selectProduct,
    addActivity
  } = useDashboard(mockFurnitureData);

  // Инициализация тестовых данных активности
  useEffect(() => {
    mockActivityData.forEach(activity => {
      addActivity({
        type: activity.type,
        description: activity.description,
        user: activity.user,
        userRole: activity.userRole
      });
    });
  }, [addActivity]);

  // Мемоизированный обработчик создания прайс-листа
  const handleCreatePriceList = React.useCallback(() => {
    if (selectedProducts.length === 0) {
      // В реальном приложении показали бы уведомление
      alert('Выберите товары для создания прайс-листа');
      return;
    }
    
    createPriceList();
    
    // Добавляем уведомление об успешном создании
    addActivity({
      type: 'created_pricelist',
      description: `Создан прайс-лист для ${selectedProducts.length} товаров`,
      user: 'Текущий пользователь',
      userRole: 'Админ'
    });
  }, [selectedProducts, createPriceList, addActivity]);

  // Мемоизированный обработчик выбора товара
  const handleProductSelect = React.useCallback((product: FurnitureItemProps) => {
    selectProduct(product);
  }, [selectProduct]);

  // Мемоизированный массив ID выбранных товаров
  const selectedProductIds = useMemo(() => 
    selectedProducts.map(p => p.id),
    [selectedProducts]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Контейнер дашборда */}
      <div className="container mx-auto px-4 py-8">
        <Dashboard
          data={dashboardData}
          onCreatePriceList={handleCreatePriceList}
          onProductSelect={handleProductSelect}
          selectedProducts={selectedProductIds}
        />
      </div>
      
      {/* Информация о выбранных товарах (опционально) */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm">
          <h3 className="font-semibold mb-2">Выбранные товары</h3>
          <div className="space-y-1">
            {selectedProducts.slice(0, 3).map(product => (
              <div key={product.id} className="text-sm text-muted-foreground">
                {product.name}
              </div>
            ))}
            {selectedProducts.length > 3 && (
              <div className="text-sm text-muted-foreground">
                +{selectedProducts.length - 3} ещё
              </div>
            )}
          </div>
          <button
            onClick={handleCreatePriceList}
            className="mt-3 w-full bg-primary text-primary-foreground px-3 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Создать прайс-лист ({selectedProducts.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;