-- Обновление структуры базы данных для наценок на виды товаров

-- Создаем таблицу видов товаров с наценками
CREATE TABLE IF NOT EXISTS product_view_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  base_markup DECIMAL(5,2) DEFAULT 100.0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставляем виды товаров с их наценками
INSERT INTO product_view_types (name, category, base_markup, description) VALUES 
('Тумба', 'Тумбы', 150.0, 'Базовая тумба'),
('Тумба краш', 'Тумбы', 200.0, 'Тумба с крашенными фасадами'),
('Тум с ящ', 'Тумбы', 180.0, 'Тумба с выдвижными ящиками'),
('Тумба с ящ краш', 'Тумбы', 230.0, 'Тумба с ящиками и крашенными фасадами'),
('Пенал', 'Пеналы', 160.0, 'Базовый пенал'),
('Пенал краш', 'Пеналы', 210.0, 'Пенал с крашенными фасадами'),
('Зеркало', 'Зеркала', 120.0, 'Базовое зеркало'),
('Зеркало краш', 'Зеркала', 170.0, 'Зеркало с крашенным корпусом'),
('LED', 'Зеркала', 250.0, 'Зеркало с LED подсветкой'),
('Простое зеркало', 'Зеркала', 100.0, 'Простое зеркало без корпуса')
ON CONFLICT (name) DO UPDATE SET 
  base_markup = EXCLUDED.base_markup,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем триггеры для автообновления
CREATE TRIGGER update_product_view_types_updated_at BEFORE UPDATE ON product_view_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_product_view_types_category ON product_view_types(category);
CREATE INDEX IF NOT EXISTS idx_product_view_types_name ON product_view_types(name);

-- RLS политики
ALTER TABLE product_view_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users" ON product_view_types FOR ALL USING (auth.uid() IS NOT NULL);