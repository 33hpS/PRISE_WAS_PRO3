-- 🧹 ПОЛНАЯ ОЧИСТКА И ПЕРЕСОЗДАНИЕ СИСТЕМЫ РОЛЕЙ
-- Выполните этот скрипт ЦЕЛИКОМ в Supabase SQL Editor

-- =====================================
-- 🗑️ ШАГ 1: УДАЛЕНИЕ ВСЕГО СТАРОГО
-- =====================================

-- Удаляем все функции
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_admin();

-- Удаляем все политики RLS
DROP POLICY IF EXISTS "user_roles_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;

-- Отключаем RLS временно
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- =====================================
-- 🔧 ШАГ 2: ПЕРЕСОЗДАНИЕ ТАБЛИЦЫ
-- =====================================

-- Пересоздаем таблицу ролей (если нужно)
DROP TABLE IF EXISTS public.user_roles;
CREATE TABLE public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin', 'manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 🔧 ШАГ 3: БЕЗОПАСНЫЕ ФУНКЦИИ
-- =====================================

-- ✅ Функция получения роли (БЕЗ RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
BEGIN
    -- Если пользователь не аутентифицирован
    IF check_user_id IS NULL THEN
        RETURN 'manager';
    END IF;
    
    -- Получаем роль из таблицы (SECURITY DEFINER обходит RLS)
    SELECT role INTO user_role 
    FROM public.user_roles 
    WHERE user_id = check_user_id;
    
    -- Если роль найдена - возвращаем
    IF user_role IS NOT NULL THEN
        RETURN user_role;
    END IF;
    
    -- Если роль не найдена - проверяем email для fallback
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = check_user_id;
    
    -- Fallback на основе email
    IF user_email = 'admin@wasser.com' THEN
        -- Автоматически создаем роль админа
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (check_user_id, 'admin')
        ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
        RETURN 'admin';
    ELSE
        -- Создаем роль менеджера для всех остальных
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (check_user_id, 'manager')
        ON CONFLICT (user_id) DO NOTHING;
        RETURN 'manager';
    END IF;
END;
$$;

-- ✅ Функция проверки админа
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.get_user_role(check_user_id) = 'admin';
END;
$$;

-- =====================================
-- 🛡️ ШАГ 4: ПРОСТЫЕ RLS ПОЛИТИКИ
-- =====================================

-- Включаем RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Простая политика: пользователи видят только свои роли
CREATE POLICY "user_roles_own_data" ON public.user_roles
    FOR ALL
    USING (user_id = auth.uid());

-- Админы видят все роли (используем нашу безопасную функцию)
CREATE POLICY "user_roles_admin_access" ON public.user_roles
    FOR ALL
    USING (public.is_admin());

-- =====================================
-- 🚀 ШАГ 5: СОЗДАНИЕ РОЛЕЙ ДЛЯ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
-- =====================================

-- Создаем роли для всех существующих пользователей
INSERT INTO public.user_roles (user_id, role)
SELECT 
    id,
    CASE 
        WHEN email = 'admin@wasser.com' THEN 'admin'
        ELSE 'manager'
    END as role
FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = NOW();

-- =====================================
-- ✅ ШАГ 6: ПРОВЕРКА РЕЗУЛЬТАТА
-- =====================================

-- Проверяем что всё работает
SELECT 'SUCCESS: Functions created' as status;

-- Показываем всех пользователей с ролями
SELECT 
    u.email,
    COALESCE(ur.role, 'No role') as role,
    ur.created_at
FROM auth.users u 
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.email;

-- Тестируем функции
SELECT 
    'Function test:' as test,
    public.get_user_role() as current_user_role,
    public.is_admin() as is_current_user_admin;
