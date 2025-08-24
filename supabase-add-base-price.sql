-- Add missing base_price column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2) DEFAULT 0;

-- Update existing products to have base_price equal to total_cost if base_price is null
UPDATE products SET base_price = total_cost WHERE base_price IS NULL OR base_price = 0;

-- Add comment to the column
COMMENT ON COLUMN products.base_price IS 'Базовая цена продукта без наценки';
