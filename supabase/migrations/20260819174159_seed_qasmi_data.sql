/*
# Seed Qasmi Store with existing catalog data

Inserts the 3 existing categories, 10 products with their variants,
and the single site_settings row — mirroring the previous mock data
so the storefront looks identical after the migration to Supabase.

1. Inserts 3 categories (Unstitched Fabrics, Ittar & Perfumes, Desi Medicines)
2. Inserts 10 products across those categories
3. Inserts all product variants with color swatches and image arrays
4. Inserts the single site_settings row (store name, WhatsApp, about, contact, banners)
5. All inserts use fixed UUIDs so foreign key relationships are preserved
*/

-- ============================================================
-- Categories (fixed UUIDs for FK references)
-- ============================================================
INSERT INTO categories (id, slug, name_en, name_ur, cover_image, display_order)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'unstitched-fabrics', 'Unstitched Fabrics', 'ان سلجھے کپڑے', 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800', 1),
  ('a0000000-0000-0000-0000-000000000002', 'ittar-perfumes', 'Ittar & Perfumes', 'عطر اور خوشبو', 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=800', 2),
  ('a0000000-0000-0000-0000-000000000003', 'desi-medicines', 'Desi Medicines', 'دیسی دوائیاں', 'https://images.pexels.com/photos/13787562/pexels-photo-13787562.jpeg?auto=compress&cs=tinysrgb&w=800', 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Products
-- ============================================================
INSERT INTO products (id, slug, name_en, name_ur, category_id, description_en, description_ur, unit_type, spec_note_en, spec_note_ur, price_retail, price_wholesale, video_url, status, featured, created_at, updated_at)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'burj-khalifa-fabric', 'Burj Khalifa Fabric', 'برج خلیفہ فیبرک', 'a0000000-0000-0000-0000-000000000001',
   'A fabric that is unparalleled in its grandeur and refinement — premium quality, exceptionally soft, perfect for Eid, Friday prayers, and weddings.',
   'ایک ایسا کپڑا جو اپنی شان و شوکت اور نفاست میں بے مثال ہو — اعلیٰ معیار، نہایت نرم، عید، جمعہ اور شادی کے لیے موزوں۔',
   'meter', '58 inch width panna. 3.5 meters makes a complete kurta pajama.', 'چوڑائی: 58 انچ پَنّا۔ صرف 3.50 میٹر میں مکمل کُرتا پاجامہ تیار۔',
   220, 170, '', 'active', true, '2025-01-15T10:00:00Z', '2025-01-20T14:30:00Z'),

  ('b0000000-0000-0000-0000-000000000002', 'royal-silk-fabric', 'Royal Silk Fabric', 'شاہی ریشم فیبرک', 'a0000000-0000-0000-0000-000000000001',
   'Luxurious silk fabric with a smooth finish and rich sheen. Ideal for special occasions and formal wear.',
   'پُرشکت ریشم کپڑا، نرم مکمل اور شاندار چمک کے ساتھ۔ خاص مواقع اور رسمی لباس کے لیے بہترین۔',
   'meter', '44 inch width. 2.5 meters per outfit.', 'چوڑائی: 44 انچ۔ فی لباس 2.5 میٹر۔',
   350, 280, '', 'active', true, '2025-02-01T09:00:00Z', '2025-02-05T16:00:00Z'),

  ('b0000000-0000-0000-0000-000000000003', 'oud-royale-ittar', 'Oud Royale Ittar', 'عود رائل عطر', 'a0000000-0000-0000-0000-000000000002',
   'A rich, woody attar crafted from premium oud oils. Long-lasting fragrance that deepens with wear. Perfect for evenings and special gatherings.',
   'پریمیم عود تیل سے تیار کردہ ایک بھاری، لکڑی والا عطر۔ لمبے عرصے تک خوشبو جو پہننے سے گہری ہوتی ہے۔ شامیں اور خاص محفلوں کے لیے بہترین۔',
   'ml', 'Available in 6ml and 12ml bottles. Alcohol-free, pure oil base.', '6ml اور 12ml کی بوتلوں میں دستیاب۔ الکحل سے پاک، خالص تیل بیس۔',
   450, 350, '', 'active', true, '2025-02-10T11:00:00Z', '2025-02-12T13:00:00Z'),

  ('b0000000-0000-0000-0000-000000000004', 'rose-dew-ittar', 'Rose Dew Ittar', 'گلاب شبنم عطر', 'a0000000-0000-0000-0000-000000000002',
   'A delicate floral attar capturing the fresh essence of morning roses. Light, sweet, and uplifting — perfect for daily wear.',
   'صبح کے گلاب کی تازگی کو قائم کرنے والا ایک نازک پھولوں والا عطر۔ ہلکا، میٹھا اور خوشگوار — روزانہ پہننے کے لیے بہترین۔',
   'ml', 'Available in 6ml roll-on bottle. Alcohol-free.', '6ml رول آن بوتل میں دستیاب۔ الکحل سے پاک۔',
   280, NULL, '', 'active', false, '2025-02-15T10:30:00Z', '2025-02-18T09:00:00Z'),

  ('b0000000-0000-0000-0000-000000000005', 'cotton-lawn-fabric', 'Premium Cotton Lawn', 'پریمیم کاٹن لان', 'a0000000-0000-0000-0000-000000000001',
   'Breathable cotton lawn fabric, perfect for summer wear. Soft texture with a crisp finish that stays comfortable all day.',
   'سانس لینے والا کاٹن لان کپڑا، گرمیوں کے لباس کے لیے بہترین۔ نرم ساخت اور صاف مکمل جو سارا دن آرام دہ رہتا ہے۔',
   'meter', '60 inch width. 3.5 meters per outfit.', 'چوڑائی: 60 انچ۔ فی لباس 3.5 میٹر۔',
   180, 130, '', 'active', false, '2025-03-01T08:00:00Z', '2025-03-02T12:00:00Z'),

  ('b0000000-0000-0000-0000-000000000006', 'musk-amber-ittar', 'Musk & Amber Ittar', 'مشک اور عنبر عطر', 'a0000000-0000-0000-0000-000000000002',
   'A warm, sensual blend of musk and amber notes. Deep, grounding fragrance that lasts throughout the day.',
   'مشک اور عنبر کی نوٹس کا گرم، حسین امتزاج۔ گہری، قائم کرنے والی خوشبو جو سارا دن رہتی ہے۔',
   'ml', 'Available in 6ml and 12ml bottles. Alcohol-free.', '6ml اور 12ml بوتلوں میں دستیاب۔ الکحل سے پاک۔',
   520, 400, '', 'out_of_stock', false, '2025-03-05T10:00:00Z', '2025-03-10T15:00:00Z'),

  ('b0000000-0000-0000-0000-000000000007', 'jadibuti-body-pain-relief', 'Jadibuti Body Pain Relief', 'جڑی بوٹی بدن درد رلیف', 'a0000000-0000-0000-0000-000000000003',
   'A traditional herbal remedy prepared from natural jadi buti (roots and herbs). Commonly used for relief from general body pain and muscle soreness. Made with time-honored Desi methods.',
   'قدرتی جڑی بوٹیوں سے تیار کردہ روایتی جڑی بوٹی دوا۔ عام بدن درد اور پٹھوں کے درد میں آرام کے لیے استعمال ہوتا ہے۔ دیسی طریقوں سے تیار۔',
   'piece', 'Natural herbal preparation. Use as directed by the herbalist.', 'قدرتی جڑی بوٹی تیاری۔ جڑی بوٹی ماہر کی ہدایت کے مطابق استعمال کریں۔',
   180, 130, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'active', true, '2025-03-08T09:00:00Z', '2025-03-08T09:00:00Z'),

  ('b0000000-0000-0000-0000-000000000008', 'jodo-dard-relief-oil', 'Jodo Ke Dard Relief Oil', 'جوڑوں کے درد رلیف آل', 'a0000000-0000-0000-0000-000000000003',
   'A herbal oil blend traditionally used for relief from joint pain (jodo ke dard). Massaged into affected areas for soothing comfort. Prepared from natural ingredients.',
   'جوڑوں کے درد میں آرام کے لیے روایتی جڑی بوٹی آل۔ متاثرہ حصوں پر مل کر سکون ملتی ہے۔ قدرتی اجزاء سے تیار۔',
   'piece', 'For external use only. Massage gently on affected joints.', 'صرف بیرونی استعمال کے لیے۔ متاثرہ جوڑوں پر آہستہ سے ملیں۔',
   250, 190, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'active', true, '2025-03-12T11:00:00Z', '2025-03-12T11:00:00Z'),

  ('b0000000-0000-0000-0000-000000000009', 'jismani-kamzori-tonic', 'Jismani Kamzori Tonic', 'جسمانی کمزوری ٹانک', 'a0000000-0000-0000-0000-000000000003',
   'A traditional herbal tonic prepared from natural jadi buti, commonly used to support relief from physical weakness (jismani kamzori). Helps restore strength and vitality.',
   'قدرتی جڑی بوٹیوں سے تیار کردہ روایتی ٹانک، جسمانی کمزوری میں آرام کے لیے استعمال ہوتا ہے۔ طاقت اور توانائی بحال کرنے میں مددگار۔',
   'piece', 'Herbal tonic preparation. Use as directed.', 'جڑی بوٹی ٹانک تیاری۔ ہدایت کے مطابق استعمال کریں۔',
   320, 240, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'active', false, '2025-03-15T10:00:00Z', '2025-03-15T10:00:00Z'),

  ('b0000000-0000-0000-0000-000000000010', 'bachpan-ghalti-kamzori-capsules', 'Bachpan Ki Ghalti Kamzori Capsules', 'بچپن کی غلطی کمزوری کیپسول', 'a0000000-0000-0000-0000-000000000003',
   'A herbal preparation traditionally used to support relief from weakness caused by childhood habits (bachpan ki galtiyo ki wajah se badan me kamzori). Made from natural jadi buti to help restore strength.',
   'بچپن کی غلطیوں کی وجہ سے بدن میں کمزوری میں آرام کے لیے روایتی جڑی بوٹی تیاری۔ قدرتی اجزاء سے تیار، طاقت بحال کرنے میں مددگار۔',
   'piece', 'Herbal capsules. Use as directed by the herbalist.', 'جڑی بوٹی کیپسول۔ جڑی بوٹی ماہر کی ہدایت کے مطابق استعمال کریں۔',
   290, 220, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'active', false, '2025-03-18T08:00:00Z', '2025-03-18T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Product Variants
-- ============================================================
INSERT INTO product_variants (id, product_id, name_en, name_ur, hex_swatch, images, display_order)
VALUES
  -- Product 1: Burj Khalifa Fabric
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Sea Green', 'سبز', '#CFE9DA',
   '["https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/7679665/pexels-photo-7679665.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/7679712/pexels-photo-7679712.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 1),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Beige', 'بیج', '#E8DCC8',
   '["https://images.pexels.com/photos/7679665/pexels-photo-7679665.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/7679712/pexels-photo-7679712.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 2),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Sage Green', 'زیتونی سبز', '#9CAF88',
   '["https://images.pexels.com/photos/7679712/pexels-photo-7679712.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 3),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Brown', 'بھورا', '#8B6F5E',
   '["https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/7679665/pexels-photo-7679665.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 4),

  -- Product 2: Royal Silk Fabric
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'Maroon', 'مرون', '#800000',
   '["https://images.pexels.com/photos/7679665/pexels-photo-7679665.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 1),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'Navy Blue', 'نیوی بلیو', '#1B2A4A',
   '["https://images.pexels.com/photos/7679712/pexels-photo-7679712.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/7679665/pexels-photo-7679665.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 2),

  -- Product 3: Oud Royale Ittar
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003', '6ml Bottle', '6ml بوتل', '#D4AF37',
   '["https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 1),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', '12ml Bottle', '12ml بوتل', '#C0A062',
   '["https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 2),

  -- Product 4: Rose Dew Ittar
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000004', 'Standard', 'معیاری', '#FF6B6B',
   '["https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 1),

  -- Product 5: Premium Cotton Lawn
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000005', 'White', 'سفید', '#FFFFFF',
   '["https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 1),
  ('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000005', 'Sky Blue', 'آسمانی نیلا', '#87CEEB',
   '["https://images.pexels.com/photos/7679665/pexels-photo-7679665.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 2),

  -- Product 6: Musk & Amber Ittar
  ('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000006', '6ml Bottle', '6ml بوتل', '#8B4513',
   '["https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 1),

  -- Product 7: Jadibuti Body Pain Relief
  ('c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000007', 'Standard Pack', 'معیاری پیک', '#9CAF88',
   '["https://images.pexels.com/photos/13779102/pexels-photo-13779102.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/13779105/pexels-photo-13779105.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/13779107/pexels-photo-13779107.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/13779115/pexels-photo-13779115.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 1),

  -- Product 8: Jodo Ke Dard Relief Oil
  ('c0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000008', '100ml Bottle', '100ml بوتل', '#D4A574',
   '["https://images.pexels.com/photos/30801235/pexels-photo-30801235.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/30801240/pexels-photo-30801240.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/30801239/pexels-photo-30801239.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/29612818/pexels-photo-29612818.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 1),

  -- Product 9: Jismani Kamzori Tonic
  ('c0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000009', '200ml Bottle', '200ml بوتل', '#8B4513',
   '["https://images.pexels.com/photos/13787562/pexels-photo-13787562.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/13787561/pexels-photo-13787561.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/13779110/pexels-photo-13779110.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/13779111/pexels-photo-13779111.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 1),

  -- Product 10: Bachpan Ki Ghalti Kamzori Capsules
  ('c0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000010', '30 Capsules', '30 کیپسول', '#6B8E5A',
   '["https://images.pexels.com/photos/13779106/pexels-photo-13779106.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/13779104/pexels-photo-13779104.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/13779112/pexels-photo-13779112.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/14029290/pexels-photo-14029290.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Site Settings (single row, id = 1)
-- ============================================================
INSERT INTO site_settings (id, store_name, logo_url, whatsapp_number, about_en, about_ur, contact_info, social_links, home_banners, updated_at)
VALUES (
  1,
  'Qasmi General Store',
  '',
  '919876543210',
  'Qasmi General Store is a family-run business bringing you premium unstitched fabrics, handcrafted ittars, and quality products. We take pride in offering carefully selected materials at fair prices, serving our community with honesty and care.',
  'قاسمی جنرل سٹور ایک خاندانی کاروبار ہے جو آپ کو پریمیم ان سلجھے کپڑے، ہاتھ سے بنے عطر، اور معیاری مصنوعات پیش کرتا ہے۔ ہم مناسب قیمتوں پر منتخب کردہ مواد پیش کرنے پر فخر محسوس کرتے ہیں، اور ایمانداری اور خیال کے ساتھ اپنی کمیونٹی کی خدمت کرتے ہیں۔',
  '{"address":"Main Bazaar Road, Old Town","phone":"+91 98765 43210","email":"contact@qasmistore.com"}'::jsonb,
  '{"facebook":"","instagram":""}'::jsonb,
  '[
    {"image":"https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=1200","caption_en":"Premium Fabrics for Every Occasion","caption_ur":"ہر مواقع کے لیے پریمیم کپڑے"},
    {"image":"https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=1200","caption_en":"Handcrafted Ittars & Perfumes","caption_ur":"ہاتھ سے بنے عطر اور خوشبو"}
  ]'::jsonb,
  now()
)
ON CONFLICT (id) DO NOTHING;