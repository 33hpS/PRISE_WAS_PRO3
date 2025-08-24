-- =============================================================================
-- ЧИСТАЯ СХЕМА БЕЗ СЛОЖНЫХ ТРИГГЕРОВ И ПОЛИТИК
-- =============================================================================

-- Удаляем старые объекты если есть
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can manage all roles" ON public.user_roles;
DROP TABLE IF EXISTS public.user_roles;

-- =============================================================================
-- СОЗДАЕМ ПРОСТУЮ ТАБЛИЦУ РОЛЕЙ
-- =============================================================================

CREATE TABLE public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin', 'manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Создаем индекс для быстрого поиска по user_id
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- =============================================================================
-- ОТКЛЮЧАЕМ RLS НА ВРЕМЯ НАСТРОЙКИ
-- =============================================================================

ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- СОЗДАЕМ АДМИНИСТРАТОРА И МЕНЕДЖЕРА (ВРУЧНУЮ)
-- =============================================================================

-- Вставляем роли для существующих пользователей
-- ВАЖНО: Замените UUID на реальные ID ваших пользователей из auth.users

-- Найдите ID пользователей в Supabase Dashboard -> Authentication -> Users
-- И замените эти UUID на реальные:

-- Пример вставки (ЗАМЕНИТЕ UUID НА РЕАЛЬНЫЕ):
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES 
--   ('USER_ID_ADMIN_HERE', 'admin'),
--   ('USER_ID_MANAGER_HERE', 'manager')
-- ON CONFLICT (user_id) DO UPDATE SET 
--   role = EXCLUDED.role,
--   updated_at = timezone('utc'::text, now());

-- =============================================================================
-- ПРОСТЫЕ ПОЛИТИКИ БЕЗОПАСНОСТИ (ВКЛЮЧАЕМ ПОЗЖЕ)
-- =============================================================================

-- Пока оставляем RLS отключенным для упрощения отладки
-- ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow read own role" ON public.user_roles 
--   FOR SELECT 
--   TO authenticated 
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Allow admin manage all" ON public.user_roles 
--   FOR ALL 
--   TO authenticated 
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.user_roles 
--       WHERE user_id = auth.uid() AND role = 'admin'
--     )
--   );

-- =============================================================================
-- ПРАВА ДОСТУПА
-- =============================================================================

-- Даем права на таблицу для authenticated пользователей
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =============================================================================
-- ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ ВРЕМЕНИ
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического обновления updated_at
CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON public.user_roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ГОТОВО! ТЕПЕРЬ НУЖНО ДОБАВИТЬ ПОЛЬЗОВАТЕЛЕЙ ВРУЧНУЮ
-- =============================================================================