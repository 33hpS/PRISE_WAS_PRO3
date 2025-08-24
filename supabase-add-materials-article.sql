-- Add missing article column to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS article VARCHAR(100) DEFAULT '';

-- Create unique index on article column (optional, for better performance)
CREATE INDEX IF NOT EXISTS idx_materials_article ON materials(article);

-- Update existing materials to have unique articles
UPDATE materials 
SET article = 'AUTO-' || id || '-' || EXTRACT(epoch FROM NOW())::text
WHERE article IS NULL OR article = '';

-- Add comment to the column
COMMENT ON COLUMN materials.article IS 'Артикул материала';
