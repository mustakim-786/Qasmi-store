import { useState, useEffect, useMemo } from 'react';
import { Package, FolderTree, AlertCircle, Star, Plus, Settings, TrendingUp, IndianRupee } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { Link } from '@/context/RouterContext';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { dataService } from '@/data/dataService';
import { DonutChart, BarChart, AreaChart } from '@/components/Charts';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Product } from '@/types';
import { getErrorMessage } from '@/lib/errorMessage';

const CHART_COLORS = ['#2D7D5A', '#C9A96E', '#5B8DBF', '#D4736E', '#8B7AB8', '#6B9B6B'];

export function AdminDashboardPage() {
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<{ total: number; perCategory: { category: import('@/types').Category; count: number }[]; outOfStock: number; featured: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    (async () => {
      try {
        const [prods, s] = await Promise.all([
          dataService.getProducts(),
          dataService.getStats(),
        ]);
        if (cancelled) return;
        setProducts(prods);
        setStats(s);
      } catch (error) {
        if (!cancelled) {
          setLoadError(getErrorMessage(error, 'Could not load dashboard data.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [retryKey]);

  const timelineData = useMemo(() => {
    const months: Record<string, number> = {};
    products.forEach((p) => {
      const date = new Date(p.created_at);
      const key = date.toLocaleDateString('en-US', { month: 'short' });
      months[key] = (months[key] || 0) + 1;
    });
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = monthOrder.filter((month) => months[month]).map((month) => ({ label: month, value: months[month] }));
    return result.length > 0 ? result : [{ label: 'No data', value: 0 }];
  }, [products]);

  if (loading) {
    return (
      <AdminLayout active="dashboard">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (loadError || !stats) {
    return (
      <AdminLayout active="dashboard">
        <div className="rounded-xl bg-red-50 p-5 text-red-700" role="alert">
          <p>{loadError || 'Could not load dashboard data.'}</p>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-3 font-semibold underline">
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  const cards = [
    { label: t('Total Products', 'کل مصنوعات'), value: stats.total, icon: Package, color: 'bg-brand-500' },
    { label: t('Categories', 'اقسام'), value: stats.perCategory.length, icon: FolderTree, color: 'bg-accent' },
    { label: t('Out of Stock', 'نمبرد نہیں'), value: stats.outOfStock, icon: AlertCircle, color: 'bg-red-500' },
    { label: t('Featured', 'نمایاں'), value: stats.featured, icon: Star, color: 'bg-brand-400' },
  ];

  const donutData = stats.perCategory.map((pc, i) => ({
    label: pc.category.name_en,
    value: pc.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const barData = stats.perCategory.map((pc, i) => ({
    label: pc.category.name_en,
    value: pc.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const avgPrice = products.length > 0
    ? Math.round(products.reduce((sum, p) => sum + (p.price_wholesale ?? p.price_retail), 0) / products.length)
    : 0;

  return (
    <AdminLayout active="dashboard">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{t('Dashboard', 'ڈیش بورڈ')}</h1>
      <p className="mt-1 text-muted">{t('Overview of your store', 'اپنے اسٹور کا جائزہ')}</p>

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-5 shadow-card transition-all hover:shadow-lift">
            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${card.color} text-white`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-ink">{card.value}</p>
            <p className="text-sm text-muted">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Average price card */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-card transition-all hover:shadow-lift">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-500">
            <IndianRupee className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-ink">₹{avgPrice}</p>
          <p className="text-sm text-muted">{t('Average Price', 'اوسط قیمت')}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card transition-all hover:shadow-lift">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-ink">
            {products.length > 0 ? Math.round((stats.featured / products.length) * 100) : 0}%
          </p>
          <p className="text-sm text-muted">{t('Featured Rate', 'نمایاں شرح')}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-ink">{t('Quick Actions', 'فوری اقدامات')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link to="/admin/products/new" className="flex items-center gap-3 rounded-2xl bg-brand-500 p-4 text-white transition-all hover:bg-brand-600 active:scale-95">
            <Plus className="h-5 w-5" />
            <span className="font-semibold">{t('Add Product', 'مصنوعہ شامل کریں')}</span>
          </Link>
          <Link to="/admin/categories/new" className="flex items-center gap-3 rounded-2xl bg-accent p-4 text-deep transition-all hover:brightness-95 active:scale-95">
            <Plus className="h-5 w-5" />
            <span className="font-semibold">{t('Add Category', 'قسم شامل کریں')}</span>
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 rounded-2xl bg-deep p-4 text-white transition-all hover:bg-brand-700 active:scale-95">
            <Settings className="h-5 w-5" />
            <span className="font-semibold">{t('Edit Settings', 'ترتیبات میں ترمیم')}</span>
          </Link>
        </div>
      </div>

      {/* Charts section */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Donut chart - product distribution */}
        <div className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-1 text-lg font-bold text-ink">{t('Product Distribution', 'مصنوعات کی تقسیم')}</h2>
          <p className="mb-5 text-sm text-muted">{t('Products per category', 'ہر قسم میں مصنوعات')}</p>
          <DonutChart data={donutData} />
        </div>

        {/* Area chart - products over time */}
        <div className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-1 text-lg font-bold text-ink">{t('Products Over Time', 'وقت کے ساتھ مصنوعات')}</h2>
          <p className="mb-5 text-sm text-muted">{t('Products added per month', 'ہر ماہ شامل کی گئی مصنوعات')}</p>
          <AreaChart data={timelineData} height={160} />
        </div>
      </div>

      {/* Bar chart - full width */}
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-card sm:p-6">
        <h2 className="mb-1 text-lg font-bold text-ink">{t('Products by Category', 'اقسام کے لحاظ سے مصنوعات')}</h2>
        <p className="mb-5 text-sm text-muted">{t('Detailed breakdown of inventory', 'انوینٹری کی تفصیلی تقسیم')}</p>
        <BarChart data={barData} />
      </div>
    </AdminLayout>
  );
}
