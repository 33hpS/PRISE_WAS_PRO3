-- Fix materials table schema - add missing columns
-- Execute this in Supabase SQL Editor

-- Add missing columns to materials table
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS type VARCHAR(100) DEFAULT 'Прочие материалы',
ADD COLUMN IF NOT EXISTS article VARCHAR(100) DEFAULT '';

-- Update existing records to have proper types based on names
UPDATE materials SET type = 
  CASE 
    WHEN LOWER(name) LIKE '%лдсп%' OR LOWER(name) LIKE '%мдф%' THEN 'Плитные материалы'
    WHEN LOWER(name) LIKE '%кромка%' THEN 'Кромочные материалы'
    WHEN LOWER(name) LIKE '%клей%' OR LOWER(name) LIKE '%акфикс%' OR LOWER(name) LIKE '%грунт%' THEN 'Клеи и составы'
    WHEN LOWER(name) LIKE '%винт%' OR LOWER(name) LIKE '%саморез%' OR LOWER(name) LIKE '%петля%' OR LOWER(name) LIKE '%направляющ%' OR LOWER(name) LIKE '%push%' OR LOWER(name) LIKE '%ограничитель%' OR LOWER(name) LIKE '%каркас%' THEN 'Фурнитура'
    WHEN LOWER(name) LIKE '%блок питан%' OR LOWER(name) LIKE '%датчик%' OR LOWER(name) LIKE '%сенсор%' OR LOWER(name) LIKE '%led%' THEN 'Электрика и подсветка'
    WHEN LOWER(name) LIKE '%пленка%' OR LOWER(name) LIKE '%краска%' OR LOWER(name) LIKE '%картон%' OR LOWER(name) LIKE '%изовер%' THEN 'Отделочные материалы'
    WHEN LOWER(name) LIKE '%зер%' AND LOWER(name) LIKE '%мм%' THEN 'Зеркала'
    ELSE 'Прочие материалы'
  END
WHERE type = 'Прочие материалы' OR type = '' OR type IS NULL;

-- Generate auto articles for existing records without articles
UPDATE materials SET article = CONCAT('MAT-', LPAD(CAST(EXTRACT(EPOCH FROM created_at) AS TEXT), 10, '0'), '-', UPPER(SUBSTRING(name, 1, 3)))
WHERE article = '' OR article IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(type);
CREATE INDEX IF NOT EXISTS idx_materials_article ON materials(article);
CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);

-- Add comments
COMMENT ON COLUMN materials.type IS 'Тип/категория материала';
COMMENT ON COLUMN materials.article IS 'Артикул материала';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'materials' 
ORDER BY ordinal_position;