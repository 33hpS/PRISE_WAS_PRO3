-- 🚀 ПРОСТОЙ СКРИПТ: Назначение админа для sherhan1988hp@gmail.com
-- Выполните в Supabase SQL Editor

-- 1. Создаем таблицу ролей если не существует
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Назначаем роль админа для Sherhan
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'sherhan1988hp@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();

-- 3. Назначаем роль админа для admin@wasser.com (если существует)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'admin@wasser.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();

-- 4. Включаем RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Создаем политики
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 6. Создаем функции
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    IF check_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT role INTO user_role 
    FROM public.user_roles 
    WHERE user_id = check_user_id;
    
    -- Если роль не найдена, проверяем email
    IF user_role IS NULL THEN
        SELECT 
            CASE 
                WHEN email = 'sherhan1988hp@gmail.com' THEN 'admin'
                WHEN email = 'admin@wasser.com' THEN 'admin'
                ELSE 'manager'
            END INTO user_role
        FROM auth.users 
        WHERE id = check_user_id;
        
        -- Создаем роль автоматически
        IF user_role IS NOT NULL THEN
            INSERT INTO public.user_roles (user_id, role) 
            VALUES (check_user_id, user_role)
            ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
        ELSE
            user_role := 'manager';
        END IF;
    END IF;
    
    RETURN COALESCE(user_role, 'manager');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.get_user_role(check_user_id) = 'admin';
END;
$$;

-- 7. Даем права на функции
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, anon;

-- 8. ПРОВЕРКА РЕЗУЛЬТАТА
SELECT 
    u.email,
    COALESCE(ur.role, 'автоматическая') as assigned_role,
    public.get_user_role(u.id) as function_role,
    public.is_admin(u.id) as is_admin
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN ('sherhan1988hp@gmail.com', 'admin@wasser.com')
ORDER BY u.created_at;