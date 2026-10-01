-- Keep product creation compatible with products.video_url NOT NULL when no
-- video is attached, and ensure Settings has its documented singleton row.

INSERT INTO public.site_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

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
      COALESCE(NULLIF(p_product -> 'video' ->> 'url', ''), ''), NULLIF(p_product -> 'video' ->> 'publicId', ''),
      p_product ->> 'status', COALESCE((p_product ->> 'featured')::boolean, false)
    ) RETURNING id INTO v_product_id;
  ELSE
    UPDATE public.products SET
      slug = p_product ->> 'slug', name_en = p_product ->> 'name_en', name_ur = p_product ->> 'name_ur',
      category_id = (p_product ->> 'category_id')::uuid, description_en = COALESCE(p_product ->> 'description_en', ''),
      description_ur = COALESCE(p_product ->> 'description_ur', ''), unit_type = p_product ->> 'unit_type',
      spec_note_en = COALESCE(p_product ->> 'spec_note_en', ''), spec_note_ur = COALESCE(p_product ->> 'spec_note_ur', ''),
      price_retail = (p_product ->> 'price_retail')::numeric, price_wholesale = NULLIF(p_product ->> 'price_wholesale', '')::numeric,
      video_url = COALESCE(NULLIF(p_product -> 'video' ->> 'url', ''), ''), video_public_id = NULLIF(p_product -> 'video' ->> 'publicId', ''),
      status = p_product ->> 'status', featured = COALESCE((p_product ->> 'featured')::boolean, false)
    WHERE id = p_product_id
    RETURNING id INTO v_product_id;
    IF v_product_id IS NULL THEN RAISE EXCEPTION 'product not found' USING ERRCODE = 'P0002'; END IF;
  END IF;

  DELETE FROM public.product_variants WHERE product_id = v_product_id;
  INSERT INTO public.product_variants (product_id, name_en, name_ur, hex_swatch, images, display_order)
  SELECT v_product_id,
         v.value ->> 'name_en',
         v.value ->> 'name_ur',
         COALESCE(v.value ->> 'hex_swatch', ''),
         COALESCE(v.value -> 'images', '[]'::jsonb),
         v.ordinality::integer
  FROM jsonb_array_elements(p_variants) WITH ORDINALITY AS v(value, ordinality);
  RETURN v_product_id;
END;
$$;
