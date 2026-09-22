/*
  Production security hardening. Apply this forward migration after rotating
  Cloudinary credentials outside the database. No application secret belongs
  in Postgres or in a browser bundle.
*/

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_public_id text;

CREATE OR REPLACE FUNCTION public.valid_media_assets(value jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT jsonb_typeof(value) = 'array' AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(value) AS asset
    WHERE jsonb_typeof(asset) <> 'object'
      OR COALESCE(asset ->> 'url', '') !~ '^https://'
      OR COALESCE(asset ->> 'resourceType', '') NOT IN ('image', 'video')
  );
$$;

-- Convert legacy image URL arrays into structured media records.
UPDATE public.product_variants
SET images = COALESCE((
  SELECT jsonb_agg(
    CASE WHEN jsonb_typeof(asset) = 'string'
      THEN jsonb_build_object('url', trim(both '"' from asset::text), 'resourceType', 'image')
      ELSE asset
    END
  )
  FROM jsonb_array_elements(images) AS asset
), '[]'::jsonb)
WHERE jsonb_typeof(images) = 'array';

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products ADD CONSTRAINT products_status_check
  CHECK (status IN ('active', 'draft', 'out_of_stock'));
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_unit_type_check;
ALTER TABLE public.products ADD CONSTRAINT products_unit_type_check
  CHECK (unit_type IN ('meter', 'piece', 'ml', 'bottle', 'custom'));
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_price_retail_check;
ALTER TABLE public.products ADD CONSTRAINT products_price_retail_check CHECK (price_retail >= 0);
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_price_wholesale_check;
ALTER TABLE public.products ADD CONSTRAINT products_price_wholesale_check CHECK (price_wholesale IS NULL OR price_wholesale >= 0);
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_slug_check;
ALTER TABLE public.products ADD CONSTRAINT products_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_slug_check;
ALTER TABLE public.categories ADD CONSTRAINT categories_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_display_order_check;
ALTER TABLE public.categories ADD CONSTRAINT categories_display_order_check CHECK (display_order >= 0);
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_display_order_check;
ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_display_order_check CHECK (display_order >= 0);
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_images_array_check;
ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_images_array_check CHECK (public.valid_media_assets(images));
ALTER TABLE public.site_settings DROP CONSTRAINT IF EXISTS site_settings_singleton_check;
ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_singleton_check CHECK (id = 1);

CREATE INDEX IF NOT EXISTS idx_products_catalog ON public.products(status, category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_variants_product_color ON public.product_variants(product_id, name_en);

-- Remove legacy broad policies before replacing them with role- and MFA-aware policies.
DROP POLICY IF EXISTS "anon_select_categories" ON public.categories;
DROP POLICY IF EXISTS "anon_insert_categories" ON public.categories;
DROP POLICY IF EXISTS "anon_update_categories" ON public.categories;
DROP POLICY IF EXISTS "anon_delete_categories" ON public.categories;
DROP POLICY IF EXISTS "anon_select_products" ON public.products;
DROP POLICY IF EXISTS "anon_insert_products" ON public.products;
DROP POLICY IF EXISTS "anon_update_products" ON public.products;
DROP POLICY IF EXISTS "anon_delete_products" ON public.products;
DROP POLICY IF EXISTS "anon_select_variants" ON public.product_variants;
DROP POLICY IF EXISTS "anon_insert_variants" ON public.product_variants;
DROP POLICY IF EXISTS "anon_update_variants" ON public.product_variants;
DROP POLICY IF EXISTS "anon_delete_variants" ON public.product_variants;
DROP POLICY IF EXISTS "anon_select_settings" ON public.site_settings;
DROP POLICY IF EXISTS "anon_insert_settings" ON public.site_settings;
DROP POLICY IF EXISTS "anon_update_settings" ON public.site_settings;
DROP POLICY IF EXISTS "anon_delete_settings" ON public.site_settings;
DROP POLICY IF EXISTS "admin users read their own membership" ON public.admin_users;

REVOKE ALL ON TABLE public.categories, public.products, public.product_variants, public.site_settings, public.admin_users FROM anon, authenticated;
GRANT SELECT ON TABLE public.categories, public.products, public.product_variants, public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.categories, public.products, public.product_variants TO authenticated;
GRANT UPDATE ON TABLE public.site_settings TO authenticated;
GRANT SELECT ON TABLE public.admin_users TO authenticated;

CREATE POLICY "admin users read their own membership" ON public.admin_users
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY "public categories read" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "aal2 admins manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
    AND COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
    AND COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
  );

CREATE POLICY "public visible products read" ON public.products
  FOR SELECT TO anon, authenticated USING (status IN ('active', 'out_of_stock'));
CREATE POLICY "aal2 admins read all products" ON public.products
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
    AND COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
  );
CREATE POLICY "aal2 admins manage products" ON public.products
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
    AND COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
    AND COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
  );

CREATE POLICY "public variants for visible products read" ON public.product_variants
  FOR SELECT TO anon, authenticated USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.status IN ('active', 'out_of_stock')
    )
  );
CREATE POLICY "aal2 admins read all variants" ON public.product_variants
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
    AND COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
  );
CREATE POLICY "aal2 admins manage variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
    AND COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
    AND COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
  );

CREATE POLICY "public settings read" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (id = 1);
CREATE POLICY "aal2 admins update settings" ON public.site_settings
  FOR UPDATE TO authenticated
  USING (
    id = 1
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
    AND COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
  )
  WITH CHECK (
    id = 1
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
    AND COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
  );

CREATE OR REPLACE FUNCTION public.save_product(p_product_id uuid, p_product jsonb, p_variants jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_product_id uuid;
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
    AND COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
  ) THEN
    RAISE EXCEPTION 'admin MFA assurance level 2 is required' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_product) <> 'object' OR jsonb_typeof(p_variants) <> 'array' THEN
    RAISE EXCEPTION 'invalid product payload' USING ERRCODE = '22023';
  END IF;

  IF p_product_id IS NULL THEN
    INSERT INTO public.products (
      slug, name_en, name_ur, category_id, description_en, description_ur, unit_type,
      spec_note_en, spec_note_ur, price_retail, price_wholesale, video_url, video_public_id, status, featured
    ) VALUES (
      p_product ->> 'slug', p_product ->> 'name_en', p_product ->> 'name_ur', (p_product ->> 'category_id')::uuid,
      COALESCE(p_product ->> 'description_en', ''), COALESCE(p_product ->> 'description_ur', ''), p_product ->> 'unit_type',
      COALESCE(p_product ->> 'spec_note_en', ''), COALESCE(p_product ->> 'spec_note_ur', ''),
      (p_product ->> 'price_retail')::numeric, NULLIF(p_product ->> 'price_wholesale', '')::numeric,
      NULLIF(p_product -> 'video' ->> 'url', ''), NULLIF(p_product -> 'video' ->> 'publicId', ''),
      p_product ->> 'status', COALESCE((p_product ->> 'featured')::boolean, false)
    ) RETURNING id INTO v_product_id;
  ELSE
    UPDATE public.products SET
      slug = p_product ->> 'slug', name_en = p_product ->> 'name_en', name_ur = p_product ->> 'name_ur',
      category_id = (p_product ->> 'category_id')::uuid, description_en = COALESCE(p_product ->> 'description_en', ''),
      description_ur = COALESCE(p_product ->> 'description_ur', ''), unit_type = p_product ->> 'unit_type',
      spec_note_en = COALESCE(p_product ->> 'spec_note_en', ''), spec_note_ur = COALESCE(p_product ->> 'spec_note_ur', ''),
      price_retail = (p_product ->> 'price_retail')::numeric, price_wholesale = NULLIF(p_product ->> 'price_wholesale', '')::numeric,
      video_url = NULLIF(p_product -> 'video' ->> 'url', ''), video_public_id = NULLIF(p_product -> 'video' ->> 'publicId', ''),
      status = p_product ->> 'status', featured = COALESCE((p_product ->> 'featured')::boolean, false)
    WHERE id = p_product_id
    RETURNING id INTO v_product_id;
    IF v_product_id IS NULL THEN RAISE EXCEPTION 'product not found' USING ERRCODE = 'P0002'; END IF;
  END IF;

  DELETE FROM public.product_variants WHERE product_id = v_product_id;
  INSERT INTO public.product_variants (product_id, name_en, name_ur, hex_swatch, images, display_order)
  SELECT v_product_id, v.name_en, v.name_ur, COALESCE(v.hex_swatch, ''), COALESCE(v.images, '[]'::jsonb), v.ordinality
  FROM jsonb_to_recordset(p_variants) WITH ORDINALITY AS v(name_en text, name_ur text, hex_swatch text, images jsonb, ordinality integer);
  RETURN v_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.products),
    'outOfStock', (SELECT count(*) FROM public.products WHERE status = 'out_of_stock'),
    'featured', (SELECT count(*) FROM public.products WHERE featured),
    'perCategory', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('category', to_jsonb(c), 'count', COALESCE(pc.count, 0)) ORDER BY c.display_order)
      FROM public.categories c
      LEFT JOIN (SELECT category_id, count(*) FROM public.products GROUP BY category_id) pc ON pc.category_id = c.id
    ), '[]'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION public.catalog_product_ids(
  p_category_id uuid DEFAULT NULL,
  p_query text DEFAULT NULL,
  p_colors text[] DEFAULT ARRAY[]::text[],
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_sort text DEFAULT 'newest',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 12
)
RETURNS TABLE(product_id uuid, total_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH filtered AS (
    SELECT p.id, p.price_retail, p.price_wholesale, p.created_at
    FROM public.products p
    WHERE p.status IN ('active', 'out_of_stock')
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_query IS NULL OR p_query = '' OR p.search_vector @@ websearch_to_tsquery('simple', p_query))
      AND (p_min_price IS NULL OR COALESCE(p.price_wholesale, p.price_retail) >= p_min_price)
      AND (p_max_price IS NULL OR COALESCE(p.price_wholesale, p.price_retail) <= p_max_price)
      AND (cardinality(p_colors) = 0 OR EXISTS (
        SELECT 1 FROM public.product_variants v
        WHERE v.product_id = p.id AND v.name_en = ANY(p_colors)
      ))
  )
  SELECT id, count(*) OVER()
  FROM filtered
  ORDER BY
    CASE WHEN p_sort = 'price_asc' THEN COALESCE(price_wholesale, price_retail) END ASC,
    CASE WHEN p_sort = 'price_desc' THEN COALESCE(price_wholesale, price_retail) END DESC,
    created_at DESC, id
  LIMIT LEAST(GREATEST(p_page_size, 1), 48)
  OFFSET (GREATEST(p_page, 1) - 1) * LEAST(GREATEST(p_page_size, 1), 48);
$$;

-- Dashboard aggregates reveal drafts, so they are explicitly admin-only as well.
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
    AND COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
  ) THEN
    RAISE EXCEPTION 'admin MFA assurance level 2 is required' USING ERRCODE = '42501';
  END IF;
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.products),
    'outOfStock', (SELECT count(*) FROM public.products WHERE status = 'out_of_stock'),
    'featured', (SELECT count(*) FROM public.products WHERE featured),
    'perCategory', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('category', to_jsonb(c), 'count', COALESCE(pc.count, 0)) ORDER BY c.display_order)
      FROM public.categories c
      LEFT JOIN (SELECT category_id, count(*) FROM public.products GROUP BY category_id) pc ON pc.category_id = c.id
    ), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_product(uuid, jsonb, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.catalog_product_ids(uuid, text, text[], numeric, numeric, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_product(uuid, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.catalog_product_ids(uuid, text, text[], numeric, numeric, text, integer, integer) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.products_search_vector_update() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.valid_media_assets(jsonb) FROM PUBLIC;

-- This table contained a historical credential and is no longer part of the runtime design.
DROP TABLE IF EXISTS public.app_secrets;
