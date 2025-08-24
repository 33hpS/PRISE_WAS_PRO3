-- Исправляем транслитерацию товаров
-- Удаляем старые записи с транслитом
DELETE FROM products WHERE name LIKE '%Klassik%' OR name LIKE '%Gratsiya%' OR name LIKE '%Modern%' 
   OR name = 'Zerkalo Klassik 80' OR name = 'Penal Gratsiya 35' OR name = 'Tumba Modern 60';

-- Добавляем товары с правильными русскими названиями
INSERT INTO products (name, description, category, type, collection, view_type, markup, total_cost, images, tech_specs, materials_used) VALUES
-- Зеркала
('Зеркало Классик 80', 'Зеркало с подсветкой 80см', 'Зеркала', 'Зеркало', 'Классик', 'Стандартный', 1500.00, 3000.00, '[]', null, null),
('Зеркало Грация 60', 'Элегантное зеркало 60см', 'Зеркала', 'Зеркало', 'Грация', 'Стандартный', 1200.00, 2400.00, '[]', null, null),
('Зеркало Модерн 100', 'Современное зеркало 100см', 'Зеркала', 'Зеркало LED', 'Модерн', 'Премиум', 2000.00, 4000.00, '[]', null, null),

-- Тумбы
('Тумба Модерн 60', 'Напольная тумба 60см', 'Тумбы', 'Тумба', 'Модерн', 'Стандартный', 1920.00, 3840.00, '[]', null, null),
('Тумба Классик 80', 'Классическая тумба 80см', 'Тумбы', 'Тумба с ящ', 'Классик', 'Стандартный', 2100.00, 4200.00, '[]', null, null),
('Тумба Грация 50', 'Изящная тумба 50см', 'Тумбы', 'Тумба', 'Грация', 'Стандартный', 1600.00, 3200.00, '[]', null, null),

-- Пеналы
('Пенал Грация 35', 'Навесной пенал 35см', 'Пеналы', 'Пенал', 'Грация', 'Стандартный', 1080.00, 2160.00, '[]', null, null),
('Пенал Модерн 40', 'Современный пенал 40см', 'Пеналы', 'Пенал', 'Модерн', 'Стандартный', 1200.00, 2400.00, '[]', null, null),
('Пенал Классик 30', 'Классический пенал 30см', 'Пеналы', 'Пенал', 'Классик', 'Стандартный', 960.00, 1920.00, '[]', null, null),

-- Шкафы
('Шкаф Элит 120', 'Шкаф-колонна 120см', 'Шкафы', 'Шкаф', 'Элит', 'Премиум', 3000.00, 6000.00, '[]', null, null),
('Шкаф Стандарт 100', 'Стандартный шкаф 100см', 'Шкафы', 'Шкаф', 'Стандарт', 'Стандартный', 2400.00, 4800.00, '[]', null, null);

-- Обновляем base_price для всех товаров (total_cost + markup)
UPDATE products SET base_price = total_cost + markup WHERE base_price IS NULL OR base_price = 0;

-- Добавляем артикулы
UPDATE products SET 
  article = CASE 
    WHEN name LIKE 'Зеркало%' THEN 'ZRK-' || SUBSTRING(name FROM '[0-9]+')
    WHEN name LIKE 'Тумба%' THEN 'TBM-' || SUBSTRING(name FROM '[0-9]+') 
    WHEN name LIKE 'Пенал%' THEN 'PNG-' || SUBSTRING(name FROM '[0-9]+')
    WHEN name LIKE 'Шкаф%' THEN 'SHK-' || SUBSTRING(name FROM '[0-9]+')
    ELSE 'ART-' || id::text
  END
WHERE article IS NULL OR article = '';

-- Проверяем результат
SELECT name, collection, type, total_cost, markup, base_price, article FROM products ORDER BY name;
