-- ====================================
-- ПОЛНАЯ НАСТРОЙКА БАЗЫ ДАННЫХ
-- ====================================

-- Удаление существующих таблиц (если есть)
DROP TABLE IF EXISTS price_lists CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_types CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS materials CASCADE;

-- ====================================
-- СОЗДАНИЕ ТАБЛИЦ
-- ====================================

-- Таблица материалов
CREATE TABLE materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица коллекций
CREATE TABLE collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    markup_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица типов товаров
CREATE TABLE product_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    base_markup INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица товаров
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    type VARCHAR(100),
    collection VARCHAR(100),
    view_type VARCHAR(100),
    markup INTEGER DEFAULT 100,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    tech_specs JSONB DEFAULT '{}'::jsonb,
    materials_used JSONB DEFAULT '{}'::jsonb,
    total_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица прайс-листов
CREATE TABLE price_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    style VARCHAR(100) NOT NULL DEFAULT 'modern',
    products TEXT[] DEFAULT ARRAY[]::TEXT[],
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- ====================================

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_materials_updated_at 
    BEFORE UPDATE ON materials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at 
    BEFORE UPDATE ON collections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_types_updated_at 
    BEFORE UPDATE ON product_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_lists_updated_at 
    BEFORE UPDATE ON price_lists 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- НАСТРОЙКА БЕЗОПАСНОСТИ (RLS)
-- ====================================

-- Включить Row Level Security
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;

-- Создать политики для полного доступа (можно настроить более детально)
CREATE POLICY "Allow all operations on materials" 
    ON materials FOR ALL 
    USING (true);

CREATE POLICY "Allow all operations on collections" 
    ON collections FOR ALL 
    USING (true);

CREATE POLICY "Allow all operations on product_types" 
    ON product_types FOR ALL 
    USING (true);

CREATE POLICY "Allow all operations on products" 
    ON products FOR ALL 
    USING (true);

CREATE POLICY "Allow all operations on price_lists" 
    ON price_lists FOR ALL 
    USING (true);

-- ====================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ====================================

CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_name ON materials(name);
CREATE INDEX idx_collections_name ON collections(name);
CREATE INDEX idx_product_types_category ON product_types(category);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_collection ON products(collection);
CREATE INDEX idx_products_type ON products(type);

-- ====================================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- ====================================

-- Добавить базовые коллекции
INSERT INTO collections (name, description, markup_multiplier) VALUES 
('Стандарт', 'Базовая коллекция мебели', 1.0),
('Классик', 'Классическая коллекция с элегантным дизайном', 1.2),
('Грация', 'Элегантная коллекция премиум класса', 1.4),
('Модерн', 'Современная коллекция в стиле модерн', 1.6),
('Элит', 'Премиум коллекция высшего класса', 2.0);

-- Добавить типы товаров с наценками
INSERT INTO product_types (name, category, base_markup) VALUES 
('Тумба', 'Тумбы', 150),
('Тумба краш', 'Тумбы', 200),
('Тум с ящ', 'Тумбы', 180),
('Тумба с ящ краш', 'Тумбы', 230),
('Пенал', 'Пеналы', 160),
('Пенал краш', 'Пеналы', 210),
('Зеркало', 'Зеркала', 120),
('Зеркало краш', 'Зеркала', 170),
('LED', 'Зеркала', 250),
('Простое зеркало', 'Зеркала', 100);

-- Добавить базовые материалы
INSERT INTO materials (name, unit, price, category) VALUES 
-- Плитные материалы
('ЛДСП 16мм Белый', 'м²', 1200.00, 'Плитные материалы'),
('ЛДСП 16мм Дуб', 'м²', 1350.00, 'Плитные материалы'),
('МДФ 16мм', 'м²', 1800.00, 'Плитные материалы'),
('МДФ облегченный 16мм', 'м²', 1600.00, 'Плитные материалы'),

-- Кромочные материалы
('Кромка Белая 1/19', 'м.п.', 45.00, 'Кромочные материалы'),
('Кромка Дуб 1/19', 'м.п.', 55.00, 'Кромочные материалы'),
('Кромка ПВХ 2мм Белая', 'м.п.', 65.00, 'Кромочные материалы'),

-- Фурнитура
('Петля Накладная прямая (без доводчика)', 'шт', 180.00, 'Фурнитура'),
('Петля Накладная прямая (с доводчиком)', 'шт', 220.00, 'Фурнитура'),
('Направляющие полного выдвижения 450мм', 'пара', 320.00, 'Фурнитура'),
('Ручка мебельная хром', 'шт', 150.00, 'Фурнитура'),
('Подвес Р-образный', 'шт', 45.00, 'Фурнитура'),

-- Крепёж
('Евровинт 7х50 мм', 'шт', 8.00, 'Крепёж'),
('Саморез 4*14 мм', 'шт', 2.50, 'Крепёж'),
('Шкант 30х8 (дерево)', 'шт', 3.00, 'Крепёж'),
('Заглушки на конфирматы', 'шт', 1.50, 'Крепёж'),

-- Зеркала и стекло
('Зеркало 4 мм', 'м²', 850.00, 'Зеркала и стекло'),
('Зеркало с фацетом', 'м²', 1200.00, 'Зеркала и стекло'),

-- Клеи и составы
('Клей для кромки', 'г', 0.80, 'Клеи и составы'),
('Клей для пленки ПВХ', 'г', 1.20, 'Клеи и составы'),
('Клей ПВА', 'г', 0.60, 'Клеи и составы'),
('Супер клей GA065B AKFIX 705', 'г', 3.50, 'Клеи и составы'),
('Акфикс Миррор (310 гр)', 'г', 2.80, 'Клеи и составы'),

-- Пленки и покрытия
('Пленка ПВХ Белый глянец (ZB 1000)', 'м', 120.00, 'Пленки и покрытия'),
('3D Наклейки на тумбы и на зеркала', 'шт', 85.00, 'Пленки и покрытия'),

-- Прочие материалы
('Зет-Картон', 'м²', 25.00, 'Прочие материалы');

-- ====================================
-- ПРОВЕРКА СОЗДАНИЯ ТАБЛИЦ
-- ====================================

-- Показать созданные таблицы
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('materials', 'collections', 'product_types', 'products', 'price_lists')
ORDER BY table_name, ordinal_position;

-- Показать количество записей в каждой таблице
SELECT 
    'materials' as table_name, COUNT(*) as records FROM materials
UNION ALL
SELECT 
    'collections' as table_name, COUNT(*) as records FROM collections
UNION ALL
SELECT 
    'product_types' as table_name, COUNT(*) as records FROM product_types
UNION ALL
SELECT 
    'products' as table_name, COUNT(*) as records FROM products
UNION ALL
SELECT 
    'price_lists' as table_name, COUNT(*) as records FROM price_lists;
