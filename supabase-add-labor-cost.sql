-- Add labor_cost column to product_view_types table
-- Execute this in Supabase SQL Editor

-- Add labor_cost column if it doesn't exist
ALTER TABLE product_view_types 
ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(10,2) DEFAULT 800;

-- Update existing records with default labor costs based on type
UPDATE product_view_types SET labor_cost = 
  CASE 
    WHEN LOWER(name) LIKE '%тумба%' AND LOWER(name) LIKE '%краш%' AND LOWER(name) LIKE '%ящ%' THEN 1400
    WHEN LOWER(name) LIKE '%тумба%' AND LOWER(name) LIKE '%краш%' THEN 1200
    WHEN LOWER(name) LIKE '%тумба%' AND LOWER(name) LIKE '%ящ%' THEN 1000
    WHEN LOWER(name) LIKE '%тумба%' THEN 800
    WHEN LOWER(name) LIKE '%пенал%' AND LOWER(name) LIKE '%краш%' THEN 900
    WHEN LOWER(name) LIKE '%пенал%' THEN 600
    WHEN LOWER(name) LIKE '%зеркало%' AND LOWER(name) LIKE '%краш%' THEN 600
    WHEN LOWER(name) LIKE '%led%' THEN 800
    WHEN LOWER(name) LIKE '%зеркало%' AND LOWER(name) LIKE '%простое%' THEN 300
    WHEN LOWER(name) LIKE '%зеркало%' THEN 400
    ELSE 800
  END
WHERE labor_cost IS NULL OR labor_cost = 800;

-- Add comment to the column
COMMENT ON COLUMN product_view_types.labor_cost IS 'Стоимость работы в сомах для данного типа товара';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_product_view_types_labor_cost ON product_view_types(labor_cost);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'product_view_types' 
ORDER BY ordinal_position;