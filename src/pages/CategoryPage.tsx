import { useState, useMemo, useEffect, useCallback } from 'react';
import { SlidersHorizontal, ChevronDown, ArrowLeft, Loader2 } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { Link, useRouter } from '@/context/RouterContext';
import { ProductCard } from '@/components/ProductCard';
import { dataService } from '@/data/dataService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Category, Product } from '@/types';

type SortOption = 'newest' | 'price_asc' | 'price_desc';

const PAGE_SIZE = 12;

export function CategoryPage({ slug }: { slug: string }) {
  const { lang, t } = useLang();
  const { navigate } = useRouter();
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const [sort, setSort] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [priceLimit, setPriceLimit] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      setAllProducts([]);
      setPage(1);
      try {
        const cat = await dataService.getCategoryBySlug(slug);
        if (!cat) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (cancelled) return;
        setCategory(cat);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    const load = async () => {
      if (page === 1) setLoading(true); else setLoadingMore(true);
      setError(null);
      try {
        const result = await dataService.getCatalog({
          categoryId: category.id,
          colors: selectedColors,
          minPrice: priceRange[0] || undefined,
          maxPrice: priceRange[1] || undefined,
          sort,
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setAllProducts((previous) => page === 1 ? result.items : [...previous, ...result.items]);
        setHasMore(result.hasMore);
        setTotal(result.total);
        const observedMax = Math.max(0, ...result.items.map((product) => product.price_wholesale ?? product.price_retail));
        setPriceLimit((previous) => Math.max(previous, observedMax));
        setPriceRange((previous) => previous[1] === 0 && observedMax > 0 ? [0, observedMax] : previous);
      } catch {
        if (!cancelled) setError('Products could not be loaded. Please try again.');
      } finally {
        if (!cancelled) { setLoading(false); setLoadingMore(false); }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [category, page, priceRange, retryKey, selectedColors, sort]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setPage((current) => current + 1);
  }, [loadingMore, hasMore]);

  const allColors = useMemo(() => {
    const colors = new Map<string, string>();
    allProducts.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.hex_swatch) colors.set(v.name_en, v.hex_swatch);
      });
    });
    return Array.from(colors.entries()).map(([name, hex]) => ({ name, hex }));
  }, [allProducts]);

  const filtered = allProducts;

  if (loading) {
    return (
      <div className="container-padding section-padding">
        <LoadingSpinner />
      </div>
    );
  }

  if (notFound || !category) {
    return (
      <div className="container-padding section-padding py-20 text-center">
        <p className="text-muted">{t('Category not found.', 'قسم نہیں ملی۔')}</p>
        <Link to="/" className="btn-primary mt-4">{t('Back to Home', 'ہوم پر واپس')}</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Category header */}
      <div className="relative h-40 overflow-hidden sm:h-56">
        <img src={category.cover_image} alt={lang === 'en' ? category.name_en : category.name_ur} className="h-full w-full object-cover" loading="eager" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep/80 to-deep/20" />
        <div className="absolute bottom-0 start-0 end-0 section-padding pb-5">
          <div className="container-padding">
            <button
              onClick={() => navigate('/')}
              className="mb-2 flex items-center gap-1 text-sm text-white/80 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t('Back', 'واپس')}
            </button>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {lang === 'en' ? category.name_en : category.name_ur}
            </h1>
          </div>
        </div>
      </div>

      <div className="container-padding section-padding py-6">
        {/* Toolbar */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-all hover:bg-brand-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('Filters', 'فلٹرز')}
            {selectedColors.length > 0 && (
              <span className="badge bg-brand-500 text-white">{selectedColors.length}</span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted hidden sm:inline">{t('Sort by:', 'ترتیب دیں:')}</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as SortOption); setPage(1); }}
                className="appearance-none rounded-xl border border-brand-200 bg-white py-2.5 ps-4 pe-10 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="newest">{t('Newest', 'تازہ ترین')}</option>
                <option value="price_asc">{t('Price: Low to High', 'قیمت: کم سے زیادہ')}</option>
                <option value="price_desc">{t('Price: High to Low', 'قیمت: زیادہ سے کم')}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mb-5 rounded-2xl border border-brand-100 bg-soft p-4">
            {allColors.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-semibold text-muted">{t('Colors', 'رنگ')}</h4>
                <div className="flex flex-wrap gap-2">
                  {allColors.map((color) => {
                    const isActive = selectedColors.includes(color.name);
                    return (
                      <button
                        key={color.name}
                        onClick={() => {
                          setSelectedColors((prev) => isActive ? prev.filter((c) => c !== color.name) : [...prev, color.name]);
                          setPage(1);
                        }}
                        className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm transition-all ${
                          isActive ? 'border-brand-500 bg-white' : 'border-brand-200 bg-white/50'
                        }`}
                      >
                        <span className="h-4 w-4 rounded-full border border-brand-200" style={{ backgroundColor: color.hex }} />
                        {color.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-2 text-sm font-semibold text-muted">
                {t('Price Range', 'قیمت کی حد')}: ₹{priceRange[0]} - ₹{priceRange[1] || priceLimit}
              </h4>
              <input
                type="range"
                min={0}
                max={Math.max(priceLimit, 1)}
                step={50}
                value={priceRange[1]}
                onChange={(e) => { setPriceRange([priceRange[0], Number(e.target.value)]); setPage(1); }}
                className="w-full accent-brand-500"
              />
            </div>

            {(selectedColors.length > 0 || (priceRange[1] > 0 && priceRange[1] !== priceLimit)) && (
              <button
                onClick={() => {
                  setSelectedColors([]);
                  setPriceRange([0, priceLimit]);
                  setPage(1);
                }}
                className="mt-3 text-sm font-medium text-brand-500 hover:underline"
              >
                {t('Clear all filters', 'تمام فلٹرز صاف کریں')}
              </button>
            )}
          </div>
        )}

        {/* Product grid */}
        {error ? <div className="py-16 text-center"><p className="text-red-600">{error}</p><button onClick={() => setRetryKey((current) => current + 1)} className="btn-outline mt-4">Retry</button></div> : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted">{t('No products found matching your filters.', 'آپ کے فلٹرز سے ملتے جلتے کوئی مصنوعات نہیں ملیں۔')}</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">{total} product{total === 1 ? '' : 's'}</p><div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product, i) => (
                <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(i * 0.06, 0.4)}s` }}>
                  <ProductCard
                    product={product}
                    category={category}
                  />
                </div>
              ))}
            </div>

            {/* Load more button */}
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn-outline"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t('Loading...', 'لوڈ ہو رہا ہے...')}
                    </>
                  ) : (
                    t('Load More', 'مزید لوڈ کریں')
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
