-- Экстренное исправление аутентификации Supabase
-- Выполните этот скрипт в SQL Editor Dashboard

-- 1. Полностью очищаем проблемные политики
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Only authenticated users can read materials" ON materials;
DROP POLICY IF EXISTS "Only authenticated users can read products" ON products;

-- 2. Временно отключаем RLS везде для диагностики
ALTER TABLE IF EXISTS user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_lists DISABLE ROW LEVEL SECURITY;

-- 3. Проверяем и исправляем права доступа
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 4. Обновляем права на sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. Создаем простые политики без рекурсии
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON user_roles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON user_roles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Проверяем существование тестовых пользователей
DO $$
BEGIN
    -- Если таблица user_roles пуста, добавляем данные для существующих пользователей
    IF NOT EXISTS (SELECT 1 FROM user_roles LIMIT 1) THEN
        -- Добавляем роли для пользователей по email (заменить на реальные UUID)
        INSERT INTO user_roles (user_id, role) 
        SELECT 
            id,
            CASE 
                WHEN email = 'admin@wasser.com' THEN 'admin'
                ELSE 'manager'
            END
        FROM auth.users
        WHERE email IN ('admin@wasser.com', 'manager@wasser.com')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;

-- 7. Показываем текущих пользователей для проверки
SELECT 
    u.email,
    u.id,
    ur.role,
    u.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at;
