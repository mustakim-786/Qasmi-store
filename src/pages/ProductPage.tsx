import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Star, Ruler, TrendingDown } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { Link, useRouter } from '@/context/RouterContext';
import { MediaGallery, type MediaItem } from '@/components/MediaGallery';
import { VariantSelector } from '@/components/VariantSelector';
import { QuantitySelector } from '@/components/QuantitySelector';
import { OrderButton } from '@/components/OrderButton';
import { ProductCard } from '@/components/ProductCard';
import { dataService } from '@/data/dataService';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { getUnitLabel } from '@/lib/whatsapp';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { isSupportedVideoUrl } from '@/lib/urls';
import type { Category, Product } from '@/types';

export function ProductPage({ slug }: { slug: string }) {
  const { lang, t } = useLang();
  const { navigate } = useRouter();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { addViewed } = useRecentlyViewed();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      setProduct(undefined);
      try {
        const p = await dataService.getProductBySlug(slug);
        if (!p) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (cancelled) return;
        setProduct(p);
        addViewed(p.id);

        // Fetch category and related products in parallel — no waterfall
        const [cat, related] = await Promise.all([
          dataService.getCategoryById(p.category_id),
          dataService.getRelatedProducts(p.id, p.category_id, 4),
        ]);
        if (cancelled) return;
        setCategory(cat);
        setRelatedProducts(related);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, addViewed]);

  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showWholesale, setShowWholesale] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedVariantId(product.variants[0]?.id || '');
      setQuantity(1);
      setShowWholesale(false);
    }
  }, [product]);

  const selectedVariant = useMemo(
    () => product?.variants.find((v) => v.id === selectedVariantId),
    [product, selectedVariantId]
  );

  const mediaItems: MediaItem[] = useMemo(() => {
    if (!product) return [];
    const images = selectedVariant?.images || product.variants[0]?.images || [];
    const items: MediaItem[] = [];
    if (isSupportedVideoUrl(product.video?.url)) items.push({ type: 'video', url: product.video.url });
    images.forEach((asset) => items.push({ type: 'image', url: asset.url }));
    return items;
  }, [product, selectedVariant]);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (category) {
      navigate(`/category/${category.slug}`);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="container-padding section-padding">
        <LoadingSpinner />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="container-padding section-padding py-20 text-center">
        <p className="text-muted">{t('Product not found.', 'مصنوعہ نہیں ملا۔')}</p>
        <Link to="/" className="btn-primary mt-4">{t('Back to Home', 'ہوم پر واپس')}</Link>
      </div>
    );
  }

  const isOutOfStock = product.status === 'out_of_stock';
  const currentPrice = showWholesale && product.price_wholesale ? product.price_wholesale : product.price_retail;
  const priceType = showWholesale && product.price_wholesale ? 'wholesale' : 'retail';
  const step = product.unit_type === 'meter' ? 0.5 : 1;

  return (
    <div className="pb-20 lg:pb-0 animate-fade-in">
      {/* Breadcrumb */}
      <div className="container-padding section-padding py-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Link to="/" className="hover:text-brand-500">{t('Home', 'ہوم')}</Link>
          <span>/</span>
          {category && (
            <>
              <Link to={`/category/${category.slug}`} className="hover:text-brand-500">
                {lang === 'en' ? category.name_en : category.name_ur}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-ink font-medium">{lang === 'en' ? product.name_en : product.name_ur}</span>
        </div>
      </div>

      <div className="container-padding section-padding pb-6">
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-1 text-sm text-muted transition-colors hover:text-brand-500 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Back', 'واپس')}
        </button>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          {/* Media: video first, then gallery */}
          <div className="space-y-4 animate-slide-up">
            <MediaGallery items={mediaItems} alt={lang === 'en' ? product.name_en : product.name_ur} />
          </div>

          {/* Product info */}
          <div className="space-y-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div>
              {product.featured && (
                <span className="badge badge-featured mb-2">
                  <Star className="h-3 w-3" />
                  {t('Featured', 'نمایاں')}
                </span>
              )}
              <h1 className="text-2xl font-bold text-ink sm:text-3xl">
                {lang === 'en' ? product.name_en : product.name_ur}
              </h1>
              {category && (
                <p className="mt-1 text-sm text-muted">
                  {lang === 'en' ? category.name_en : category.name_ur}
                </p>
              )}
            </div>

            {/* Pricing */}
            <div className="rounded-2xl bg-soft p-4 transition-all hover:shadow-soft">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-brand-500">₹{currentPrice}</span>
                <span className="text-sm text-muted">/{getUnitLabel(product.unit_type, lang)}</span>
              </div>

              {product.price_wholesale && (
                <div className="mt-3 border-t border-brand-200 pt-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showWholesale}
                      onChange={(e) => setShowWholesale(e.target.checked)}
                      className="h-5 w-5 rounded accent-brand-500 transition-transform hover:scale-110"
                    />
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4 text-brand-500" />
                      <span className="text-sm text-muted">
                        {t('Wholesale price', 'تھوک قیمت')}: <span className="font-semibold text-brand-500">₹{product.price_wholesale}/{getUnitLabel(product.unit_type, lang)}</span>
                      </span>
                    </div>
                  </label>
                  <p className="mt-1 text-xs text-muted/70 ps-7">
                    {t('Available on bulk orders', 'بلک آرڈر پر دستیاب')}
                  </p>
                </div>
              )}
            </div>

            {/* Variant selector */}
            <VariantSelector
              variants={product.variants}
              selectedId={selectedVariantId}
              onSelect={setSelectedVariantId}
            />

            {/* Quantity */}
            <QuantitySelector
              quantity={quantity}
              onChange={setQuantity}
              unitType={product.unit_type}
              step={step}
            />

            {/* Description */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted">{t('Description', 'تفصیل')}</h3>
              <p className="whitespace-pre-line text-ink leading-relaxed">
                {lang === 'en' ? product.description_en : product.description_ur}
              </p>
            </div>

            {/* Specs */}
            {(product.spec_note_en || product.spec_note_ur) && (
              <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted">
                  <Ruler className="h-4 w-4" />
                  {t('Specifications', 'تفصیلات')}
                </h3>
                <p className="text-sm text-ink leading-relaxed">
                  {lang === 'en' ? product.spec_note_en : product.spec_note_ur}
                </p>
              </div>
            )}

            {/* Status badge */}
            {isOutOfStock && (
              <div className="badge badge-stock text-sm">
                {t('Out of Stock', 'نمبرد نہیں')}
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 animate-fade-in">
            <h2 className="mb-5 text-xl font-bold text-ink sm:text-2xl">
              {t('You May Also Like', 'آپ کو یہ بھی پسند آئے گا')}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.id} product={rp} category={category} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky bottom CTA bar (mobile) */}
      <div className="fixed bottom-0 start-0 end-0 z-40 border-t border-brand-100 bg-white/95 px-4 py-3 backdrop-blur-md shadow-lift lg:hidden animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted">{t('Total', 'کل')}</p>
            <p className="text-lg font-bold text-brand-500">
              ₹{(currentPrice * quantity).toFixed(0)}
            </p>
          </div>
          <OrderButton
            product={product}
            category={category}
            variant={selectedVariant}
            quantity={quantity}
            price={currentPrice}
            priceType={priceType}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
