-- Full Supabase Schema for Furniture Factory Management System
-- Execute this script in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'шт',
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'Прочие материалы',
    article TEXT,
    supplier TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    markup_multiplier DECIMAL(5,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PRODUCT_TYPES TABLE
CREATE TABLE IF NOT EXISTS public.product_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    base_markup DECIMAL(10,2) DEFAULT 150,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PRODUCT_VIEW_TYPES TABLE
CREATE TABLE IF NOT EXISTS public.product_view_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Мебель для ванной',
    type TEXT NOT NULL,
    collection TEXT NOT NULL,
    view_type TEXT DEFAULT 'Стандартный',
    markup DECIMAL(10,2) DEFAULT 150,
    images TEXT[] DEFAULT '{}',
    tech_specs JSONB,
    materials_used JSONB,
    total_cost DECIMAL(10,2) DEFAULT 0,
    article TEXT,
    base_price DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PRICE_LISTS TABLE
CREATE TABLE IF NOT EXISTS public.price_lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    style TEXT DEFAULT 'Стандартный',
    products TEXT[] DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TECH_CARD_CHANGES TABLE (for history tracking)
CREATE TABLE IF NOT EXISTS public.tech_card_changes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted')),
    changed_by TEXT NOT NULL,
    changes JSONB DEFAULT '{}',
    previous_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. USER_PROFILES TABLE (for extended user info)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_materials_name ON public.materials(name);
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_active ON public.materials(is_active);

CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_collection ON public.products(collection);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

CREATE INDEX IF NOT EXISTS idx_collections_name ON public.collections(name);
CREATE INDEX IF NOT EXISTS idx_collections_active ON public.collections(is_active);

CREATE INDEX IF NOT EXISTS idx_product_types_category ON public.product_types(category);
CREATE INDEX IF NOT EXISTS idx_product_types_active ON public.product_types(is_active);

CREATE INDEX IF NOT EXISTS idx_tech_card_changes_product_id ON public.tech_card_changes(product_id);
CREATE INDEX IF NOT EXISTS idx_tech_card_changes_type ON public.tech_card_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_tech_card_changes_created_at ON public.tech_card_changes(created_at);

-- CREATE FUNCTIONS FOR AUTOMATIC TIMESTAMP UPDATES
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- CREATE TRIGGERS FOR UPDATED_AT
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_types_updated_at BEFORE UPDATE ON public.product_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_view_types_updated_at BEFORE UPDATE ON public.product_view_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_lists_updated_at BEFORE UPDATE ON public.price_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_view_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_card_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES (Allow authenticated users to read/write)
CREATE POLICY "Allow authenticated users full access to materials" ON public.materials
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to products" ON public.products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to collections" ON public.collections
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to product_types" ON public.product_types
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to product_view_types" ON public.product_view_types
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to price_lists" ON public.price_lists
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to tech_card_changes" ON public.tech_card_changes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view and update their own profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = id);

-- INSERT INITIAL DATA

-- Collections
INSERT INTO public.collections (name, description, markup_multiplier) VALUES
    ('Классик', 'Классическая коллекция мебели', 1.0),
    ('Модерн', 'Современная коллекция мебели', 1.2),
    ('Грация', 'Изящная коллекция мебели', 1.1),
    ('Элит', 'Элитная коллекция мебели', 1.5),
    ('Стандарт', 'Стандартная коллекция мебели', 1.0)
ON CONFLICT (name) DO NOTHING;

-- Product Types
INSERT INTO public.product_types (name, category, base_markup) VALUES
    ('Тумба', 'Тумбы', 150),
    ('Тумба краш', 'Тумбы', 200),
    ('Тум с ящ', 'Тумбы', 180),
    ('Тумба с ящ краш', 'Тумбы', 230),
    ('Пенал', 'Пеналы', 160),
    ('Пенал краш', 'Пеналы', 210),
    ('Зеркало', 'Зеркала', 120),
    ('Зеркало краш', 'Зеркала', 170),
    ('LED', 'Зеркала', 250),
    ('Простое зеркало', 'Зеркала', 100),
    ('Полка', 'Полки', 80),
    ('Шкаф', 'Шкафы', 200)
ON CONFLICT DO NOTHING;

-- Product View Types
INSERT INTO public.product_view_types (name, description) VALUES
    ('Стандартный', 'Стандартное отображение товара'),
    ('Компактный', 'Компактное отображение товара'),
    ('Детальный', 'Детальное отображение товара'),
    ('Каталожный', 'Отображение для каталога'),
    ('Прайс-лист', 'Отображение для прайс-листа')
ON CONFLICT (name) DO NOTHING;

-- Sample Materials
INSERT INTO public.materials (name, unit, price, category, article) VALUES
    ('ЛДСП 16мм Белый', 'м2', 850, 'Плитные материалы', 'raw48'),
    ('МДФ 16мм', 'м2', 1200, 'Плитные материалы', 'raw163'),
    ('Кромка Белая 1/19', 'м', 25, 'Кромочные материалы', 'raw102'),
    ('Петля Накладная прямая', 'шт', 120, 'Фурнитура', 'raw105'),
    ('Саморез 4*14 мм', 'шт', 2, 'Фурнитура', 'raw131'),
    ('Клей для кромки', 'г', 0.5, 'Клеи и составы', 'raw110'),
    ('Пленка ПВХ Белый глянец', 'м', 180, 'Отделочные материалы', 'raw11'),
    ('Зеркало 4 мм', 'м2', 950, 'Зеркала', 'raw80'),
    ('Евровинт 7х50 мм', 'шт', 8, 'Фурнитура', 'raw168'),
    ('Подвес Р-образный', 'шт', 25, 'Фурнитура', 'raw32')
ON CONFLICT DO NOTHING;

-- Sample Products
INSERT INTO public.products (name, description, category, type, collection, total_cost, markup, base_price) VALUES
    ('Зеркало Классик 80', 'Зеркало с подсветкой, коллекция Классик', 'Зеркала', 'Зеркало', 'Классик', 2500, 1250, 3750),
    ('Тумба Модерн 60', 'Подвесная тумба с раковиной', 'Тумбы', 'Тумба', 'Модерн', 4200, 2100, 6300),
    ('Пенал Грация 35', 'Высокий пенал для ванной комнаты', 'Пеналы', 'Пенал', 'Грация', 3800, 1900, 5700)
ON CONFLICT DO NOTHING;

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE 'Tables created: materials, products, collections, product_types, product_view_types, price_lists, tech_card_changes, user_profiles';
    RAISE NOTICE 'Indexes, triggers, and RLS policies applied';
    RAISE NOTICE 'Initial data inserted';
END $$;
