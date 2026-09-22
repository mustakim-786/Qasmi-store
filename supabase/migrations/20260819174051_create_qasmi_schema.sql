/*
# Create Qasmi Store schema

Creates the core database tables for the Qasmi General Store e-commerce app:
categories, products, product_variants, and a single-row site_settings table.

## 1. New Tables

### categories
- `id` (uuid, primary key) — unique category identifier
- `slug` (text, unique) — URL-friendly identifier (e.g. "unstitched-fabrics")
- `name_en` (text) — category name in English
- `name_ur` (text) — category name in Urdu
- `cover_image` (text) — URL of the category cover photo
- `display_order` (integer) — sort order for display on storefront

### products
- `id` (uuid, primary key) — unique product identifier
- `slug` (text, unique) — URL-friendly identifier (e.g. "burj-khalifa-fabric")
- `name_en` (text) — product name in English
- `name_ur` (text) — product name in Urdu
- `category_id` (uuid, foreign key → categories.id) — which category this product belongs to
- `description_en` (text) — product description in English
- `description_ur` (text) — product description in Urdu
- `unit_type` (text) — meter / piece / ml / bottle / custom
- `spec_note_en` (text) — specification note in English
- `spec_note_ur` (text) — specification note in Urdu
- `price_retail` (numeric) — retail price
- `price_wholesale` (numeric, nullable) — wholesale price
- `video_url` (text, nullable) — product video URL (data URL or external link)
- `status` (text) — active / draft / out_of_stock
- `featured` (boolean) — whether the product is featured on the home page
- `created_at` (timestamptz) — creation timestamp
- `updated_at` (timestamptz) — last update timestamp

### product_variants
- `id` (uuid, primary key) — unique variant identifier
- `product_id` (uuid, foreign key → products.id ON DELETE CASCADE) — parent product
- `name_en` (text) — variant name in English (e.g. "Sea Green")
- `name_ur` (text) — variant name in Urdu
- `hex_swatch` (text, nullable) — hex color code for swatch display
- `images` (jsonb) — array of image URL strings
- `display_order` (integer) — sort order within the product

### site_settings
- `id` (integer, primary key, always 1) — enforces single-row constraint
- `store_name` (text) — store display name
- `logo_url` (text) — store logo URL
- `whatsapp_number` (text) — WhatsApp business number
- `about_en` (text) — about text in English
- `about_ur` (text) — about text in Urdu
- `contact_info` (jsonb) — { address, phone, email }
- `social_links` (jsonb) — { facebook, instagram }
- `home_banners` (jsonb) — array of { image, caption_en, caption_ur }
- `updated_at` (timestamptz) — last update timestamp

## 2. Indexes
- `categories.display_order` — for storefront sorting
- `products.slug` — unique index for slug lookups
- `products.category_id` — for filtering products by category
- `products.status` — for filtering active products
- `products.featured` — for fetching featured products
- `product_variants.product_id` — for fetching a product's variants

## 3. Security (Row Level Security)

This is a single-tenant app with an in-app admin login (not Supabase Auth).
The frontend talks to the database with the anon key for ALL operations,
so every table allows anon + authenticated to perform full CRUD.

- RLS enabled on all 4 tables.
- SELECT/INSERT/UPDATE/DELETE policies for anon, authenticated on each table.
*/

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ur text NOT NULL,
  cover_image text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories
  FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ur text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  description_en text NOT NULL DEFAULT '',
  description_ur text NOT NULL DEFAULT '',
  unit_type text NOT NULL DEFAULT 'piece',
  spec_note_en text NOT NULL DEFAULT '',
  spec_note_ur text NOT NULL DEFAULT '',
  price_retail numeric NOT NULL DEFAULT 0,
  price_wholesale numeric,
  video_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products
  FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- product_variants
-- ============================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_en text NOT NULL DEFAULT '',
  name_ur text NOT NULL DEFAULT '',
  hex_swatch text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_variants" ON product_variants;
CREATE POLICY "anon_select_variants" ON product_variants
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_variants" ON product_variants;
CREATE POLICY "anon_insert_variants" ON product_variants
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_variants" ON product_variants;
CREATE POLICY "anon_update_variants" ON product_variants
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_variants" ON product_variants;
CREATE POLICY "anon_delete_variants" ON product_variants
  FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- site_settings (single-row)
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  whatsapp_number text NOT NULL DEFAULT '',
  about_en text NOT NULL DEFAULT '',
  about_ur text NOT NULL DEFAULT '',
  contact_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  home_banners jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON site_settings;
CREATE POLICY "anon_select_settings" ON site_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON site_settings;
CREATE POLICY "anon_insert_settings" ON site_settings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON site_settings;
CREATE POLICY "anon_update_settings" ON site_settings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON site_settings;
CREATE POLICY "anon_delete_settings" ON site_settings
  FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);

-- Trigger to auto-update updated_at on products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();