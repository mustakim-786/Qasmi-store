import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft, Settings2, Zap, Crop } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useRouter } from '@/context/RouterContext';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { dataService } from '@/data/dataService';
import { FileUploadArea, type UploadedFile, type OptimizationSettings, type CropSettings } from '@/components/FileUploadArea';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Category, MediaAsset, Product, ProductVariant, ProductStatus, UnitType } from '@/types';

const emptyVariant = (): ProductVariant => ({
  id: `draft-${Date.now()}-${Math.random()}`,
  product_id: '',
  name_en: '',
  name_ur: '',
  hex_swatch: '#CFE9DA',
  images: [],
});

export function AdminProductFormPage({ productId }: { productId?: string }) {
  const { t } = useLang();
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(!!productId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existing, setExisting] = useState<Product | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionUr, setDescriptionUr] = useState('');
  const [unitType, setUnitType] = useState<UnitType>('piece');
  const [specEn, setSpecEn] = useState('');
  const [specUr, setSpecUr] = useState('');
  const [priceRetail, setPriceRetail] = useState('');
  const [priceWholesale, setPriceWholesale] = useState('');
  const [status, setStatus] = useState<ProductStatus>('active');
  const [featured, setFeatured] = useState(false);

  const [videoFiles, setVideoFiles] = useState<UploadedFile[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([emptyVariant()]);
  const [variantImageFiles, setVariantImageFiles] = useState<Record<string, UploadedFile[]>>({});

  // Optimization settings
  const [optimizeImages, setOptimizeImages] = useState(true);
  const [optimizeVideos, setOptimizeVideos] = useState(true);
  const [imageCrop, setImageCrop] = useState<CropSettings>({
    enabled: false,
    width: 800,
    height: 1000,
    mode: 'fill',
  });
  const [showOptSettings, setShowOptSettings] = useState(false);

  const optimizationSettings: OptimizationSettings = {
    optimizeImages,
    optimizeVideos,
    imageCrop,
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await dataService.getCategories();
        if (cancelled) return;
        setCategories(cats);
        if (productId) {
          const p = await dataService.getProductById(productId);
          if (cancelled) return;
          if (p) {
          setExisting(p);
          setNameEn(p.name_en);
          setNameUr(p.name_ur);
          setCategoryId(p.category_id);
          setDescriptionEn(p.description_en);
          setDescriptionUr(p.description_ur);
          setUnitType(p.unit_type);
          setSpecEn(p.spec_note_en || '');
          setSpecUr(p.spec_note_ur || '');
          setPriceRetail(String(p.price_retail));
          setPriceWholesale(p.price_wholesale ? String(p.price_wholesale) : '');
          setStatus(p.status);
          setFeatured(p.featured);
          setVariants(p.variants.length > 0 ? p.variants : [emptyVariant()]);
          }
        } else {
          setCategoryId(cats[0]?.id || '');
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load this product.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [productId]);

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    setVariants((prev) => prev.map((variant, i) => i === index ? { ...variant, ...updates } : variant));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !nameUr || !priceRetail || !categoryId) {
      setError(t('Please fill all required fields.', 'براہ کرم تمام مطلوبہ فیلڈز پُر کریں۔'));
      return;
    }

    // Check all uploads are done
    const allImageFiles = Object.values(variantImageFiles).flat();
    const pendingUploads = [...videoFiles, ...allImageFiles].filter(
      (f) => f.uploadStatus === 'uploading'
    );
    if (pendingUploads.length > 0) {
      setError(t('Please wait for uploads to finish.', 'براہ کرم اپ لوڈ مکمل ہونے تک انتظار کریں۔'));
      return;
    }

    const failedUploads = [...videoFiles, ...allImageFiles].filter(
      (f) => f.uploadStatus === 'error'
    );
    if (failedUploads.length > 0) {
      setError(t('Some uploads failed. Please remove failed files and try again.', 'کچھ اپ لوڈ ناکام ہوئے۔ ناکام فائلیں ہٹا کر دوبارہ کوشش کریں۔'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      const cleanedVariants = variants.map((variant) => {
        const uploadedImages: MediaAsset[] = (variantImageFiles[variant.id] || [])
          .filter((file) => Boolean(file.cloudinaryUrl))
          .map((file) => ({
            url: file.cloudinaryUrl!,
            publicId: file.cloudinaryPublicId,
            resourceType: 'image' as const,
          }));
        const existingImages = variant.images || [];
        return {
          name_en: variant.name_en,
          name_ur: variant.name_ur,
          hex_swatch: variant.hex_swatch,
          images: [...existingImages, ...uploadedImages],
        };
      });

      const uploadedVideo = videoFiles.find((file) => file.cloudinaryUrl);
      const video: MediaAsset | undefined = uploadedVideo?.cloudinaryUrl
        ? { url: uploadedVideo.cloudinaryUrl, publicId: uploadedVideo.cloudinaryPublicId, resourceType: 'video' }
        : existing?.video;

      const payload = {
        slug: existing?.slug || dataService.slugify(nameEn),
        name_en: nameEn,
        name_ur: nameUr,
        category_id: categoryId,
        description_en: descriptionEn,
        description_ur: descriptionUr,
        unit_type: unitType,
        spec_note_en: specEn,
        spec_note_ur: specUr,
        price_retail: Number(priceRetail),
        price_wholesale: priceWholesale ? Number(priceWholesale) : undefined,
        video,
        status,
        featured,
        variants: existing ? cleanedVariants.map((v) => ({ ...v, id: '', product_id: existing.id })) as ProductVariant[] : cleanedVariants,
      };

      if (existing) {
        await dataService.updateProduct(existing.id, payload);
      } else {
        await dataService.createProduct(payload);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to save product.', 'مصنوعہ محفوظ کرنے میں ناکامی۔'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout active="products">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="products">
      <button onClick={() => navigate('/admin/products')} className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-brand-500">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('Back to Products', 'مصنوعات پر واپس')}
      </button>
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">
        {existing ? t('Edit Product', 'مصنوعہ میں ترمیم') : t('Add Product', 'مصنوعہ شامل کریں')}
      </h1>

      <form onSubmit={save} className="mt-6 space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-bold text-ink">{t('Basic Information', 'بنیادی معلومات')}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className="label-field">{t('Name (English) *', 'نام (انگریزی) *')}</label><input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="input-field" required /></div>
            <div><label className="label-field">{t('Name (Urdu) *', 'نام (اردو) *')}</label><input value={nameUr} onChange={(e) => setNameUr(e.target.value)} dir="rtl" className="input-field font-urdu" required /></div>
            <div><label className="label-field">{t('Category *', 'قسم *')}</label><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field" required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name_en}</option>)}</select></div>
            <div><label className="label-field">{t('Unit Type', 'یونٹ کی قسم')}</label><select value={unitType} onChange={(e) => setUnitType(e.target.value as UnitType)} className="input-field"><option value="meter">Meter</option><option value="piece">Piece</option><option value="ml">ML</option><option value="bottle">Bottle</option><option value="custom">Custom</option></select></div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className="label-field">{t('Description (English)', 'تفصیل (انگریزی)')}</label><textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className="input-field min-h-32" /></div>
            <div><label className="label-field">{t('Description (Urdu)', 'تفصیل (اردو)')}</label><textarea value={descriptionUr} onChange={(e) => setDescriptionUr(e.target.value)} dir="rtl" className="input-field min-h-32 font-urdu" /></div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-bold text-ink">{t('Pricing & Specifications', 'قیمت اور تفصیلات')}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className="label-field">{t('Retail Price *', 'خوردہ قیمت *')}</label><input type="number" min="0" value={priceRetail} onChange={(e) => setPriceRetail(e.target.value)} className="input-field" required /></div>
            <div><label className="label-field">{t('Wholesale Price', 'تھوک قیمت')}</label><input type="number" min="0" value={priceWholesale} onChange={(e) => setPriceWholesale(e.target.value)} className="input-field" /></div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className="label-field">{t('Specifications (English)', 'تفصیلات (انگریزی)')}</label><textarea value={specEn} onChange={(e) => setSpecEn(e.target.value)} className="input-field min-h-24" /></div>
            <div><label className="label-field">{t('Specifications (Urdu)', 'تفصیلات (اردو)')}</label><textarea value={specUr} onChange={(e) => setSpecUr(e.target.value)} dir="rtl" className="input-field min-h-24 font-urdu" /></div>
          </div>
        </section>

        {/* Media Optimization Settings */}
        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
          <button
            type="button"
            onClick={() => setShowOptSettings(!showOptSettings)}
            className="flex w-full items-center justify-between"
          >
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <Settings2 className="h-5 w-5 text-brand-500" />
              {t('Media Optimization Settings', 'میڈیا آپٹمائزیشن ترتیبات')}
            </h2>
            <span className="text-sm text-muted">{showOptSettings ? '−' : '+'}</span>
          </button>

          {showOptSettings && (
            <div className="mt-4 space-y-4 border-t border-brand-100 pt-4">
              {/* Image optimization toggle */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Zap className="mt-0.5 h-5 w-5 text-brand-500" />
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-ink">
                      <input
                        type="checkbox"
                        checked={optimizeImages}
                        onChange={(e) => setOptimizeImages(e.target.checked)}
                        className="h-5 w-5 rounded accent-brand-500"
                      />
                      {t('Optimize Images', 'تصاویر کو آپٹمائز کریں')}
                    </label>
                    <p className="mt-1 text-xs text-muted">
                      {t('Auto-formats to WebP/AVIF and reduces file size smartly', 'خودکار WebP/AVIF میں تبدیل اور فائل سائز ذہین طریقے سے کم')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Image cropping controls */}
              {optimizeImages && (
                <div className="ms-8 rounded-xl bg-brand-50 p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      checked={imageCrop.enabled}
                      onChange={(e) => setImageCrop(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="h-5 w-5 rounded accent-brand-500"
                    />
                    <Crop className="h-4 w-4 text-brand-500" />
                    {t('Enable Smart Cropping', 'اسمارٹ کراپنگ فعال کریں')}
                  </label>

                  {imageCrop.enabled && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="label-field">{t('Width (px)', 'چوڑائی (px)')}</label>
                        <input
                          type="number"
                          min="50"
                          max="3000"
                          value={imageCrop.width || ''}
                          onChange={(e) => setImageCrop(prev => ({ ...prev, width: Number(e.target.value) }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="label-field">{t('Height (px)', 'اونچائی (px)')}</label>
                        <input
                          type="number"
                          min="50"
                          max="3000"
                          value={imageCrop.height || ''}
                          onChange={(e) => setImageCrop(prev => ({ ...prev, height: Number(e.target.value) }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="label-field">{t('Crop Mode', 'کcrop موڈ')}</label>
                        <select
                          value={imageCrop.mode}
                          onChange={(e) => setImageCrop(prev => ({ ...prev, mode: e.target.value as CropSettings['mode'] }))}
                          className="input-field"
                        >
                          <option value="fill">{t('Fill (crop to fit)', 'بھریں (فٹ کرنے کے لیے کراپ)')}</option>
                          <option value="fit">{t('Fit (no crop)', 'فٹ (کcrop نہیں)')}</option>
                          <option value="scale">{t('Scale (stretch)', 'سکیل (کھینچیں)')}</option>
                          <option value="limit">{t('Limit (downscale only)', 'حد (صرف کم سکیل)')}</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Video optimization toggle */}
              <div className="flex items-start gap-3">
                <Zap className="mt-0.5 h-5 w-5 text-brand-500" />
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      checked={optimizeVideos}
                      onChange={(e) => setOptimizeVideos(e.target.checked)}
                      className="h-5 w-5 rounded accent-brand-500"
                    />
                    {t('Optimize Videos', 'ویڈیوز کو آپٹمائز کریں')}
                  </label>
                  <p className="mt-1 text-xs text-muted">
                    {t('Auto-formats and compresses video for faster streaming', 'تیز اسٹریمنگ کے لیے خودکار فارمیٹ اور کمپریس ویڈیو')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Product Video Upload */}
        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-bold text-ink">{t('Product Video', 'مصنوعہ ویڈیو')}</h2>
          <p className="mt-1 text-sm text-muted">{t('Upload a product video from your device.', 'اپنے ڈیوائس سے مصنوعہ ویڈیو اپ لوڈ کریں۔')}</p>
          <div className="mt-4">
            <FileUploadArea
              label={t('Video File', 'ویڈیو فائل')}
              accept="video/*"
              multiple={false}
              onFilesChange={setVideoFiles}
              files={videoFiles}
              type="video"
              optimizationSettings={optimizationSettings}
            />
            {existing?.video && videoFiles.length === 0 && (
              <p className="mt-2 text-xs text-muted">
                {t('Existing video will be kept if no new file is uploaded.', 'اگر کوئی نئی فائل اپ لوڈ نہیں کی گئی تو موجودہ ویڈیو برقرار رہے گی۔')}
              </p>
            )}
          </div>
        </section>

        {/* Variants with image uploads */}
        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">{t('Color Variants', 'رنگ کی اقسام')}</h2>
            <button type="button" onClick={() => setVariants((prev) => [...prev, emptyVariant()])} className="btn-ghost text-sm">
              <Plus className="h-4 w-4" />
              {t('Add Variant', 'قسم شامل کریں')}
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {variants.map((variant, index) => (
              <div key={variant.id} className="rounded-xl border border-brand-100 bg-brand-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-muted">{t('Variant', 'قسم')} {index + 1}</p>
                  {variants.length > 1 && (
                    <button type="button" onClick={() => {
                      setVariants((prev) => prev.filter((_, i) => i !== index));
                      setVariantImageFiles((prev) => {
                        const next = { ...prev };
                        delete next[variant.id];
                        return next;
                      });
                    }} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <input value={variant.name_en} onChange={(e) => updateVariant(index, { name_en: e.target.value })} placeholder={t('Name (English)', 'نام (انگریزی)')} className="input-field" />
                  <input value={variant.name_ur} onChange={(e) => updateVariant(index, { name_ur: e.target.value })} placeholder="نام (اردو)" dir="rtl" className="input-field font-urdu" />
                  <div className="flex items-center gap-2">
                    <input type="color" value={variant.hex_swatch || '#CFE9DA'} onChange={(e) => updateVariant(index, { hex_swatch: e.target.value })} className="h-11 w-12 rounded-lg border border-brand-200 bg-white p-1" />
                    <input value={variant.hex_swatch || ''} onChange={(e) => updateVariant(index, { hex_swatch: e.target.value })} placeholder="#CFE9DA" className="input-field" />
                  </div>
                </div>
                <div className="mt-4">
                  <FileUploadArea
                    label={t('Product Images (multiple angles)', 'مصنوعہ تصاویر (متعدد زاویے)')}
                    accept="image/*"
                    multiple={true}
                    onFilesChange={(nextFiles) => setVariantImageFiles((prev) => {
                      const current = prev[variant.id] || [];
                      const files = typeof nextFiles === 'function' ? nextFiles(current) : nextFiles;
                      return { ...prev, [variant.id]: files };
                    })}
                    files={variantImageFiles[variant.id] || []}
                    type="image"
                    optimizationSettings={optimizationSettings}
                  />
                  {variant.images.length > 0 && (variantImageFiles[variant.id] || []).length === 0 && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs text-muted">{t('Existing images:', 'موجودہ تصاویر:')}</p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {variant.images.map((img, imgIdx) => (
                          <div key={imgIdx} className="relative">
                            <img src={img.url} alt={`Existing ${imgIdx + 1}`} className="h-24 w-full rounded-lg border border-brand-200 object-cover" />
                            <button
                              type="button"
                              onClick={() => updateVariant(index, { images: variant.images.filter((_, i) => i !== imgIdx) })}
                              className="absolute -top-1.5 -end-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-soft"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-bold text-ink">{t('Status & Visibility', 'حالت اور نمائش')}</h2>
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <div>
              <label className="label-field">{t('Status', 'حالت')}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)} className="input-field">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm font-medium text-ink">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-5 w-5 rounded accent-brand-500" />
              {t('Featured product', 'نمایاں مصنوعہ')}
            </label>
          </div>
        </section>

        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-outline" disabled={saving}>{t('Cancel', 'منسوخ')}</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t('Saving...', 'محفوظ کیا جا رہا ہے...') : t('Save Product', 'مصنوعہ محفوظ کریں')}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
