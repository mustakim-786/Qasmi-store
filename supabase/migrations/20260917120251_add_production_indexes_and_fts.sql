/*
# Production performance indexes and full-text search

1. Composite Indexes
- `products(featured, status)` — the featured products query filters on both columns together
- `products(category_id, status)` — category pages filter by category AND active status
- `products(status, created_at)` — admin product listing ordered by created_at with status filter

2. Full-Text Search
- Adds a `search_vector` generated column on `products` using `to_tsvector` with English + Urdu config
- Adds a GIN index on `search_vector` for fast full-text search
- Adds a trigger to keep `search_vector` updated on insert/update
- Enables the app to use `WHERE search_vector @@ plainto_tsquery(...)` instead of `ilike` scans

3. Updated_at triggers
- Adds `updated_at` trigger on `product_variants` (was missing)
- Adds `updated_at` trigger on `categories` (was missing)

4. Security
- No RLS or policy changes — all existing policies remain unchanged
*/

-- ============================================================
-- Composite indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_featured_status
  ON products(featured, status);

CREATE INDEX IF NOT EXISTS idx_products_category_status
  ON products(category_id, status);

CREATE INDEX IF NOT EXISTS idx_products_status_created_at
  ON products(status, created_at DESC);

-- ============================================================
-- Full-text search: generated column + GIN index + trigger
-- ============================================================

-- Add search_vector column (nullable so existing rows get populated by trigger)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate existing rows
UPDATE products
SET search_vector = to_tsvector('simple', coalesce(name_en, '') || ' ' || coalesce(name_ur, '') || ' ' || coalesce(description_en, '') || ' ' || coalesce(description_ur, ''));

-- GIN index for fast full-text matching
CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING GIN (search_vector);

-- Trigger function to auto-update search_vector
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.name_en, '') || ' ' ||
    coalesce(NEW.name_ur, '') || ' ' ||
    coalesce(NEW.description_en, '') || ' ' ||
    coalesce(NEW.description_ur, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_search_vector ON products;
CREATE TRIGGER trigger_products_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- ============================================================
-- updated_at triggers for product_variants and categories
-- ============================================================
DROP TRIGGER IF EXISTS trigger_variants_updated_at ON product_variants;
CREATE TRIGGER trigger_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at column to product_variants if missing
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON categories;
CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at column to categories if missing
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();