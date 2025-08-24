-- 🔧 Создание и исправление таблицы product_view_types
-- Выполните в Supabase SQL Editor

BEGIN;

-- 1. Удаляем старую таблицу если есть проблемы
DROP TABLE IF EXISTS public.product_view_types CASCADE;

-- 2. Создаем таблицу заново с правильной структурой
CREATE TABLE public.product_view_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    labor_cost NUMERIC(10,2) DEFAULT 0,
    category TEXT DEFAULT 'standard',
    base_price NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Добавляем базовые типы отображения
INSERT INTO public.product_view_types (name, description, labor_cost, category, base_price) VALUES
('Обычная', 'Стандартное исполнение', 500.00, 'standard', 1000.00),
('С подсветкой', 'С LED подсветкой', 800.00, 'led', 1500.00),
('Краш', 'Кракелюрное покрытие', 1200.00, 'crash', 2000.00),
('Премиум', 'Премиальное исполнение', 1500.00, 'premium', 2500.00),
('Эконом', 'Экономичный вариант', 300.00, 'economy', 800.00);

-- 4. Создаем функцию обновления времени
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Создаем триггер для автообновления updated_at
CREATE TRIGGER update_product_view_types_updated_at 
    BEFORE UPDATE ON public.product_view_types 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Включаем RLS
ALTER TABLE public.product_view_types ENABLE ROW LEVEL SECURITY;

-- 7. Создаем политики RLS
CREATE POLICY "Everyone can read product view types" ON public.product_view_types
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage product view types" ON public.product_view_types
    FOR ALL USING (auth.role() = 'authenticated');

-- 8. Даем права на таблицу
GRANT ALL ON public.product_view_types TO authenticated;
GRANT SELECT ON public.product_view_types TO anon;

-- 9. Создаем индексы для производительности
CREATE INDEX idx_product_view_types_name ON public.product_view_types(name);
CREATE INDEX idx_product_view_types_category ON public.product_view_types(category);

COMMIT;

-- 10. Проверяем результат
SELECT 
    'product_view_types' as table_name,
    COUNT(*) as total_records,
    string_agg(DISTINCT category, ', ') as categories,
    MIN(labor_cost) as min_labor_cost,
    MAX(labor_cost) as max_labor_cost
FROM public.product_view_types;

-- 11. Показываем все записи
SELECT * FROM public.product_view_types ORDER BY category, name;

-- 12. Тестируем проблемные запросы
SELECT labor_cost FROM public.product_view_types WHERE name = 'Обычная';
SELECT * FROM public.product_view_types ORDER BY category ASC;
SELECT * FROM public.product_view_types WHERE id = (SELECT id FROM public.product_view_types LIMIT 1);