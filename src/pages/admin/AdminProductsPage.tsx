import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { Link, useRouter } from '@/context/RouterContext';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { dataService } from '@/data/dataService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Category, Product, ProductStatus } from '@/types';
import { getErrorMessage } from '@/lib/errorMessage';

export function AdminProductsPage() {
  const { lang, t } = useLang();
  const { navigate } = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [categoryMap, setCategoryMap] = useState<Record<string, Category>>({});

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [prods, cats] = await Promise.all([
        dataService.getProducts(),
        dataService.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
      const map: Record<string, Category> = {};
      cats.forEach((c) => { map[c.id] = c; });
      setCategoryMap(map);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not load products.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filterCategory !== 'all' && p.category_id !== filterCategory) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (search && !p.name_en.toLowerCase().includes(search.toLowerCase()) && !p.name_ur.includes(search)) return false;
      return true;
    });
  }, [products, filterCategory, filterStatus, search]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await dataService.deleteProduct(id);
      setDeleteId(null);
      await loadProducts();
    } catch {
      // keep dialog so user sees something went wrong
    } finally {
      setDeleting(false);
    }
  };

  const statusBadge = (status: ProductStatus) => {
    const styles: Record<ProductStatus, string> = {
      active: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-600',
      out_of_stock: 'bg-red-100 text-red-700',
    };
    const labels: Record<ProductStatus, { en: string; ur: string }> = {
      active: { en: 'Active', ur: 'فعال' },
      draft: { en: 'Draft', ur: 'مسودہ' },
      out_of_stock: { en: 'Out of Stock', ur: 'نمبرد نہیں' },
    };
    return (
      <span className={`badge ${styles[status]}`}>
        {lang === 'en' ? labels[status].en : labels[status].ur}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout active="products">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout active="products">
        <div className="rounded-xl bg-red-50 p-5 text-red-700" role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={() => void loadProducts()} className="mt-3 font-semibold underline">
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="products">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{t('Products', 'مصنوعات')}</h1>
          <p className="mt-1 text-muted">{t('Manage your product catalog', 'اپنی مصنوعات کی فہرست منظم کریں')}</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">{t('Add Product', 'مصنوعہ شامل کریں')}</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-xl bg-soft px-3 flex-1">
          <Search className="h-5 w-5 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search products...', 'مصنوعات تلاش کریں...')}
            className="w-full bg-transparent py-2.5 text-ink placeholder:text-muted/60 focus:outline-none"
          />
        </div>
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none rounded-xl border border-brand-200 bg-white py-2.5 ps-4 pe-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="all">{t('All Categories', 'تمام اقسام')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_en}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none rounded-xl border border-brand-200 bg-white py-2.5 ps-4 pe-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="all">{t('All Status', 'تمام حالتیں')}</option>
            <option value="active">{t('Active', 'فعال')}</option>
            <option value="draft">{t('Draft', 'مسودہ')}</option>
            <option value="out_of_stock">{t('Out of Stock', 'نمبرد نہیں')}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </div>

      {/* Product table */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-card">
        {/* Desktop table */}
        <table className="hidden w-full sm:table">
          <thead className="border-b border-brand-100 bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-muted">{t('Product', 'مصنوعہ')}</th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-muted">{t('Category', 'قسم')}</th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-muted">{t('Price', 'قیمت')}</th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-muted">{t('Status', 'حالت')}</th>
              <th className="px-4 py-3 text-end text-xs font-semibold uppercase text-muted">{t('Actions', 'اقدامات')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {filtered.map((p) => {
              const cat = categoryMap[p.category_id];
              return (
                <tr key={p.id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.variants[0]?.images?.[0]?.url || cat?.cover_image || ''}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-ink">{p.name_en}</p>
                        <p className="text-xs text-muted">{p.name_ur}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{cat?.name_en || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-ink">₹{p.price_retail}</td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                        className="rounded-lg p-2 text-brand-500 hover:bg-brand-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="divide-y divide-brand-50 sm:hidden">
          {filtered.map((p) => {
            const cat = categoryMap[p.category_id];
            return (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <img
                  src={p.variants[0]?.images?.[0]?.url || cat?.cover_image || ''}
                  alt=""
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="flex-1 min-h-0">
                  <p className="font-medium text-ink text-sm">{p.name_en}</p>
                  <p className="text-xs text-muted">{cat?.name_en}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-500">₹{p.price_retail}</span>
                    {statusBadge(p.status)}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                    className="rounded-lg p-2 text-brand-500 hover:bg-brand-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-muted">{t('No products found.', 'کوئی مصنوعات نہیں ملیں۔')}</p>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => !deleting && setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">{t('Delete Product?', 'مصنوعہ حذف کریں؟')}</h3>
            <p className="mt-2 text-sm text-muted">{t('This action cannot be undone.', 'یہ عمل واپس نہیں کیا جا سکتا۔')}</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-outline flex-1" disabled={deleting}>{t('Cancel', 'منسوخ')}</button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 rounded-2xl bg-red-500 px-6 py-3.5 font-semibold text-white transition-all hover:bg-red-600 active:scale-95 disabled:opacity-50"
              >
                {deleting ? t('Deleting...', 'حذف کیا جا رہا ہے...') : t('Delete', 'حذف کریں')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
