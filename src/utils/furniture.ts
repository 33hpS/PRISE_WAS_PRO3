// src/types/furniture.ts
// Типобезопасные интерфейсы мебельной фабрики WASSER
// Функциональная архитектура с readonly модификаторами

export type FurnitureCollection = 'Premium' | 'Comfort' | 'Basic' | 'Luxury';
export type FurnitureCategory = 'столы' | 'стулья' | 'шкафы' | 'кровати' | 'комоды';
export type UserRole = 'Админ' | 'Менеджер';

// Основной интерфейс товара мебели
export interface FurnitureItemProps {
  readonly id: string;
  readonly article: string;
  readonly name: string;
  readonly collection: FurnitureCollection;
  readonly category: FurnitureCategory;
  readonly basePrice: number;
  readonly materials: readonly string[];
  readonly dimensions?: {
    readonly width: number;
    readonly height: number;
    readonly depth: number;
  };
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Метрики дашборда
export interface DashboardMetrics {
  readonly products: {
    readonly total: number;
    readonly active: number;
    readonly trend: number;
    readonly isPositive: boolean;
  };
  readonly priceLists: {
    readonly generated: number;
    readonly trend: number;
    readonly isPositive: boolean;
  };
  readonly clients: {
    readonly active: number;
    readonly trend: number;
    readonly isPositive: boolean;
  };
  readonly sales: {
    readonly monthly: number;
    readonly trend: number;
    readonly isPositive: boolean;
  };
}

// Элемент активности
export interface ActivityItem {
  readonly id: string;
  readonly type: 'created_pricelist' | 'updated_product' | 'added_material' | 'exported_pdf';
  readonly description: string;
  readonly user: string;
  readonly userRole: UserRole;
  readonly timestamp: Date;
  readonly relatedItemId?: string;
}

// Прайс-лист конфигурация
export interface PriceListConfig {
  readonly currency: 'RUB' | 'USD' | 'EUR';
  readonly includeImages: boolean;
  readonly groupBy: 'collection' | 'category' | 'none';
  readonly showMaterials: boolean;
  readonly showDimensions: boolean;
  readonly title: string;
  readonly companyInfo: {
    readonly name: string;
    readonly address: string;
    readonly phone: string;
    readonly email: string;
  };
}

// Элемент прайс-листа с расчетами
export interface PriceListItem {
  readonly product: FurnitureItemProps;
  readonly calculatedPrice: number;
  readonly collectionMultiplier: number;
  readonly formattedPrice: string;
}

// Данные дашборда
export interface DashboardData {
  readonly metrics: DashboardMetrics;
  readonly recentProducts: readonly FurnitureItemProps[];
  readonly recentActivity: readonly ActivityItem[];
  readonly totalValue: number;
  readonly averagePrice: number;
  readonly collectionsCount: number;
}

// Пропсы компонентов
export interface MetricCardProps {
  readonly title: string;
  readonly value: number | string;
  readonly trend: number;
  readonly isPositive: boolean;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly formatter?: (value: number) => string;
}

export interface FurnitureListProps {
  readonly items: readonly FurnitureItemProps[];
  readonly onItemSelect?: (item: FurnitureItemProps) => void;
  readonly selectedItems?: readonly string[];
  readonly showPrices?: boolean;
  readonly showActions?: boolean;
}

export interface ProductCardProps {
  readonly product: FurnitureItemProps;
  readonly onSelect?: (product: FurnitureItemProps) => void;
  readonly isSelected?: boolean;
  readonly showCalculations?: boolean;
}