import { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useRouter } from '@/context/RouterContext';
import { ProductCard } from '@/components/ProductCard';
import { dataService } from '@/data/dataService';
import { useStoreData } from '@/context/StoreDataContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Product } from '@/types';

const PAGE_SIZE = 12;

export function SearchPage() {
  const { t } = useLang();
  const { query, navigate } = useRouter();
  const { categories } = useStoreData();
  const initialQuery = query.get('q') || '';
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!initialQuery) {
        setResults([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      setError(null);
      setPage(1);
      try {
        const r = await dataService.searchProductsPaginated(initialQuery, 1, PAGE_SIZE);
        if (!cancelled) {
          setResults(r.items);
          setHasMore(r.hasMore);
          setTotal(r.total);
        }
      } catch {
        if (!cancelled) { setResults([]); setTotal(0); setError('Search is temporarily unavailable. Please retry.'); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [initialQuery, retryKey]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const r = await dataService.searchProductsPaginated(initialQuery, nextPage, PAGE_SIZE);
      setResults((prev) => [...prev, ...r.items]);
      setHasMore(r.hasMore);
      setTotal(r.total);
      setPage(nextPage);
    } catch {
      setError('More results could not be loaded. Please retry.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div className="container-padding section-padding py-6">
      <h1 className="mb-5 text-2xl font-bold text-ink sm:text-3xl">
        {t('Search', 'تلاش')}
      </h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex items-center gap-2 rounded-2xl bg-soft px-4">
          <Search className="h-5 w-5 text-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('Search products...', 'مصنوعات تلاش کریں...')}
            className="w-full bg-transparent py-3.5 text-ink placeholder:text-muted/60 focus:outline-none"
            autoFocus
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="text-muted hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {initialQuery && (
        <p className="mb-4 text-sm text-muted">
          {loading
            ? t('Searching...', 'تلاش کیا جا رہا ہے...')
            : total > 0
              ? t(`${total} result(s) for "${initialQuery}"`, `"${initialQuery}" کے لیے ${total} نتیجہ`)
              : t(`No results for "${initialQuery}"`, `"${initialQuery}" کے لیے کوئی نتیجہ نہیں`)}
        </p>
      )}

      {!initialQuery && (
        <div className="py-16 text-center">
          <Search className="mx-auto h-12 w-12 text-brand-200" />
          <p className="mt-4 text-muted">{t('Start typing to search products', 'مصنوعات تلاش کرنے کے لیے ٹائپ کرنا شروع کریں')}</p>
        </div>
      )}

      {loading && <LoadingSpinner />}

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}<button onClick={() => setRetryKey((current) => current + 1)} className="ms-3 font-semibold underline">Retry</button></div>}

      {!loading && initialQuery && results.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-muted">{t('No products found. Try a different search term.', 'کوئی مصنوعات نہیں ملیں۔ ایک مختلف تلاش کوشش کریں۔')}</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                category={categories.find((c) => c.id === product.category_id)}
              />
            ))}
          </div>

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
  );
}
