-- 👑 Назначение роли админа для sherhan1988hp@gmail.com
-- Выполните в Supabase SQL Editor

-- 1. Проверяем существует ли пользователь
DO $$
DECLARE
    user_exists BOOLEAN;
    user_uuid UUID;
BEGIN
    -- Ищем пользователя
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'sherhan1988hp@gmail.com'
    ) INTO user_exists;
    
    IF user_exists THEN
        -- Получаем UUID пользователя
        SELECT id INTO user_uuid 
        FROM auth.users 
        WHERE email = 'sherhan1988hp@gmail.com';
        
        RAISE NOTICE '✅ Пользователь найден: %', user_uuid;
        
        -- Создаем таблицу user_roles если не существует
        CREATE TABLE IF NOT EXISTS public.user_roles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK (role IN ('admin', 'manager')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
        
        -- Добавляем или обновляем роль админа
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_uuid, 'admin')
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'admin',
            updated_at = NOW();
        
        RAISE NOTICE '🎉 Роль админа назначена для sherhan1988hp@gmail.com';
        
    ELSE
        RAISE NOTICE '❌ Пользователь sherhan1988hp@gmail.com не найден в auth.users';
        RAISE NOTICE 'Убедитесь что пользователь зарегистрирован в системе';
    END IF;
END $$;

-- 2. Проверяем результат
SELECT 
    u.email,
    ur.role,
    ur.created_at,
    ur.updated_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'sherhan1988hp@gmail.com';

-- 3. Включаем RLS если отключен
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Создаем политики если не существуют
DO $$
BEGIN
    -- Политика для чтения своей роли
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND policyname = 'Users can view own role'
    ) THEN
        CREATE POLICY "Users can view own role" ON public.user_roles
            FOR SELECT USING (user_id = auth.uid());
    END IF;
    
    -- Политика для админов
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND policyname = 'Admins can manage all roles'
    ) THEN
        CREATE POLICY "Admins can manage all roles" ON public.user_roles
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

-- 5. Создаем функции если не существуют
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
    
    -- Если роль не найдена, создаем дефолтную
    IF user_role IS NULL THEN
        -- Проверяем email для sherhan1988hp@gmail.com
        SELECT 
            CASE 
                WHEN email = 'sherhan1988hp@gmail.com' THEN 'admin'
                WHEN email = 'admin@wasser.com' THEN 'admin'
                ELSE 'manager'
            END INTO user_role
        FROM auth.users 
        WHERE id = check_user_id;
        
        -- Создаем роль
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

-- 6. Даем права на функции
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, anon;

-- 7. Финальная проверка всех ролей
DO $
BEGIN
    RAISE NOTICE '📊 ТЕКУЩИЕ РОЛИ ПОЛЬЗОВАТЕЛЕЙ:';
    RAISE NOTICE '✅ ГОТОВО! Sherhan назначен администратором!';
END $;

-- Финальная проверка - покажет результат
SELECT 
    u.email,
    COALESCE(ur.role, 'НЕТ РОЛИ') as role,
    public.get_user_role(u.id) as function_role,
    public.is_admin(u.id) as is_admin
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at;
