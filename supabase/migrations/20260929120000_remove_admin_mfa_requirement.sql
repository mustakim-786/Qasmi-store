-- Admin access remains limited to authenticated users listed in admin_users.
-- This removes the AAL2 requirement while preserving those membership checks.

DROP POLICY IF EXISTS "aal2 admins manage categories" ON public.categories;
CREATE POLICY "admins manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "aal2 admins read all products" ON public.products;
CREATE POLICY "admins read all products" ON public.products
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "aal2 admins manage products" ON public.products;
CREATE POLICY "admins manage products" ON public.products
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "aal2 admins read all variants" ON public.product_variants;
CREATE POLICY "admins read all variants" ON public.product_variants
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "aal2 admins manage variants" ON public.product_variants;
CREATE POLICY "admins manage variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "aal2 admins update settings" ON public.site_settings;
CREATE POLICY "admins update settings" ON public.site_settings
  FOR UPDATE TO authenticated
  USING (
    id = 1
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    id = 1
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid()))
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
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
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
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
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
