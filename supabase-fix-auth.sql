-- 🚨 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ АУТЕНТИФИКАЦИИ
-- Устраняем проблемы с RLS и добавляем роли для существующих пользователей

-- 1. Сначала отключаем RLS для безопасного обновления
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Создаем таблицу ролей если не существует
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Удаляем существующие роли чтобы избежать конфликтов
DELETE FROM public.user_roles;

-- 4. Добавляем роли для ВСЕХ существующих пользователей
INSERT INTO public.user_roles (user_id, role) 
SELECT 
    id as user_id,
    CASE 
        WHEN email = 'admin@wasser.com' THEN 'admin'
        WHEN email LIKE '%admin%' THEN 'admin'
        ELSE 'manager'
    END as role
FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = NOW();

-- 5. Создаем безопасные функции без рекурсии
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    target_user_id UUID;
BEGIN
    -- Если ID не передан, используем текущего пользователя
    target_user_id := COALESCE(check_user_id, auth.uid());
    
    -- Если нет ID, возвращаем manager
    IF target_user_id IS NULL THEN
        RETURN 'manager';
    END IF;
    
    -- Получаем роль из таблицы
    SELECT role INTO user_role 
    FROM public.user_roles 
    WHERE user_id = target_user_id;
    
    -- Если роль не найдена, проверяем email и создаем роль
    IF user_role IS NULL THEN
        SELECT 
            CASE 
                WHEN email = 'admin@wasser.com' THEN 'admin'
                WHEN email LIKE '%admin%' THEN 'admin'
                ELSE 'manager'
            END INTO user_role
        FROM auth.users 
        WHERE id = target_user_id;
        
        -- Создаем роль
        IF user_role IS NOT NULL THEN
            INSERT INTO public.user_roles (user_id, role) 
            VALUES (target_user_id, user_role)
            ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
        ELSE
            user_role := 'manager';
        END IF;
    END IF;
    
    RETURN COALESCE(user_role, 'manager');
END;
$$;

-- 6. Функция проверки админа
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.get_user_role(check_user_id) = 'admin';
END;
$$;

-- 7. Простые политики RLS без рекурсии
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Политика для чтения своей роли
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT
    USING (user_id = auth.uid());

-- Политика для админов (через service role)
CREATE POLICY "Service role full access" ON public.user_roles
    FOR ALL
    USING (current_setting('role') = 'service_role');

-- 8. Включаем RLS обратно
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 9. Даем права на функции
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, anon;

-- 10. Проверяем результат
SELECT 
    u.email,
    ur.role,
    public.get_user_role(u.id) as function_role,
    public.is_admin(u.id) as is_admin_check
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at;

-- ✅ ГОТОВО! Теперь аутентификация должна работать корректно
