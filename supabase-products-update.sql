-- Update products table schema to match application requirements

-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS public.products CASCADE;

-- Create products table with correct schema
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Мебель для ванной',
    type TEXT NOT NULL DEFAULT '',
    collection TEXT NOT NULL DEFAULT '',
    view_type TEXT NOT NULL DEFAULT 'Стандартный',
    markup DECIMAL(10,2) DEFAULT 150.00,
    images TEXT[] DEFAULT '{}',
    tech_specs JSONB DEFAULT NULL,
    materials_used JSONB DEFAULT NULL,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read products" ON public.products
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert products" ON public.products
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products" ON public.products
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete products" ON public.products
    FOR DELETE TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_collection ON public.products(collection);
CREATE INDEX idx_products_type ON public.products(type);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO public.products (name, description, category, type, collection, markup, total_cost) VALUES
('Зеркало Классик 80', 'Зеркало для ванной комнаты с LED подсветкой', 'Зеркала', 'LED', 'Классик', 300.00, 1200.00),
('Тумба Грация 60', 'Тумба под раковину с одной дверцей', 'Тумбы', 'Обычная', 'Грация', 250.00, 800.00),
('Пенал Модерн 30', 'Высокий пенал для ванной комнаты', 'Пеналы', 'Краш', 'Модерн', 400.00, 1000.00);
