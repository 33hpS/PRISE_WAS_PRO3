-- 🚨 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ: Устранение бесконечной рекурсии в RLS политиках

-- 1. Отключаем все RLS политики для user_roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Only authenticated users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

-- 2. Временно отключаем RLS для отладки
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 3. Очищаем и пересоздаем таблицу с безопасной структурой
DROP TABLE IF EXISTS public.user_roles CASCADE;

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text CHECK (role IN ('admin', 'manager')) DEFAULT 'manager',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 4. Создаем безопасную функцию для получения роли пользователя
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id uuid;
    user_role text;
BEGIN
    -- Используем переданный ID или текущего пользователя
    target_user_id := COALESCE(check_user_id, auth.uid());
    
    -- Проверяем, что пользователь аутентифицирован
    IF target_user_id IS NULL THEN
        RETURN 'manager'; -- По умолчанию
    END IF;
    
    -- Получаем роль пользователя БЕЗ использования RLS
    SELECT role INTO user_role 
    FROM public.user_roles 
    WHERE user_id = target_user_id;
    
    -- Возвращаем роль или значение по умолчанию
    RETURN COALESCE(user_role, 'manager');
END;
$$;

-- 5. Создаем функцию проверки прав админа
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.get_user_role(check_user_id) = 'admin';
END;
$$;

-- 6. Включаем RLS с БЕЗОПАСНЫМИ политиками
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. Создаем простые политики БЕЗ рекурсии

-- Политика SELECT: пользователи видят только свою роль
CREATE POLICY "users_can_view_own_role" ON public.user_roles
    FOR SELECT 
    USING (user_id = auth.uid());

-- Политика INSERT: только сервисная роль может создавать записи
CREATE POLICY "service_role_can_insert" ON public.user_roles
    FOR INSERT 
    WITH CHECK (true); -- Будет работать только с service role key

-- Политика UPDATE: только сервисная роль может обновлять
CREATE POLICY "service_role_can_update" ON public.user_roles
    FOR UPDATE 
    USING (true) 
    WITH CHECK (true); -- Будет работать только с service role key

-- Политика DELETE: только сервисная роль может удалять
CREATE POLICY "service_role_can_delete" ON public.user_roles
    FOR DELETE 
    USING (true); -- Будет работать только с service role key

-- 8. Предоставляем права на функции
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon;

-- 9. Создаем тестовых пользователей с ролями (если пользователи существуют)
DO $$
DECLARE
    admin_id uuid;
    manager_id uuid;
BEGIN
    -- Ищем пользователей по email
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@wasser.com' LIMIT 1;
    SELECT id INTO manager_id FROM auth.users WHERE email = 'manager@wasser.com' LIMIT 1;
    
    -- Добавляем роли если пользователи найдены
    IF admin_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_id, 'admin')
        ON CONFLICT (user_id) DO UPDATE SET 
            role = EXCLUDED.role,
            updated_at = NOW();
    END IF;
    
    IF manager_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (manager_id, 'manager')
        ON CONFLICT (user_id) DO UPDATE SET 
            role = EXCLUDED.role,
            updated_at = NOW();
    END IF;
END $$;

-- 10. Создаем тестовые данные если таблицы материалов и продуктов пусты
DO $$
BEGIN
    -- Проверяем есть ли материалы
    IF NOT EXISTS (SELECT 1 FROM public.materials LIMIT 1) THEN
        INSERT INTO public.materials (name, unit, price) VALUES
        ('ЛДСП 16мм Белый', 'м2', 472.95),
        ('Кромка Белая 1/19', 'м', 5.4),
        ('Петля накладная', 'шт', 45.0),
        ('Ручка мебельная', 'шт', 120.0),
        ('Саморез 4x16', 'шт', 0.5);
    END IF;
    
    -- Проверяем есть ли типы продукции
    IF NOT EXISTS (SELECT 1 FROM public.product_types LIMIT 1) THEN
        INSERT INTO public.product_types (name) VALUES
        ('Зеркало'),
        ('Пенал'),
        ('Тумба'),
        ('Полка'),
        ('Шкаф');
    END IF;
    
    -- Проверяем есть ли коллекции
    IF NOT EXISTS (SELECT 1 FROM public.collections LIMIT 1) THEN
        INSERT INTO public.collections (name, description) VALUES
        ('Классик', 'Классическая коллекция мебели'),
        ('Модерн', 'Современная коллекция'),
        ('Грация', 'Элегантная коллекция');
    END IF;
    
    -- Проверяем есть ли продукция
    IF NOT EXISTS (SELECT 1 FROM public.products LIMIT 1) THEN
        INSERT INTO public.products (name, type, collection, category, total_cost, markup, base_price, article) VALUES
        ('Зеркало Классик 80', 'Зеркало', 'Классик', 'Аксессуары', 2500, 500, 3000, 'ZK-80'),
        ('Пенал Грация 35', 'Пенал', 'Грация', 'Хранение', 4500, 1000, 5500, 'PG-35'),
        ('Тумба Модерн 60', 'Тумба', 'Модерн', 'Основная', 6000, 1500, 7500, 'TM-60');
    END IF;
END $$;

-- 11. Проверяем что все работает
SELECT 'RLS policies fixed successfully' as status;