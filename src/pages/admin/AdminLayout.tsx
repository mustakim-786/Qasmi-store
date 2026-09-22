import type { ReactNode } from 'react';
import { LogOut, LayoutDashboard, Package, FolderTree, Settings, Store } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useLang } from '@/context/LanguageContext';
import { Link, useRouter } from '@/context/RouterContext';

export function AdminLayout({ children, active }: { children: ReactNode; active: string }) {
  const { signOut } = useAdminAuth();
  const { t } = useLang();
  const { navigate } = useRouter();

  const navItems = [
    { key: 'dashboard', label: t('Dashboard', 'ڈیش بورڈ'), icon: LayoutDashboard, path: '/admin/dashboard' },
    { key: 'products', label: t('Products', 'مصنوعات'), icon: Package, path: '/admin/products' },
    { key: 'categories', label: t('Categories', 'اقسام'), icon: FolderTree, path: '/admin/categories' },
    { key: 'settings', label: t('Settings', 'ترتیبات'), icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col bg-deep text-white lg:flex">
          <div className="flex items-center gap-2 border-b border-white/10 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold font-serif">Qasmi Store</p>
              <p className="text-xs text-white/50">{t('Admin Panel', 'ایڈمن پینل')}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    active === item.key
                      ? 'bg-brand-500 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-3">
            <Link to="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white">
              <Store className="h-5 w-5" />
              {t('View Store', 'اسٹور دیکھیں')}
            </Link>
            <button
              onClick={() => {
                void signOut().finally(() => navigate('/admin'));
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              {t('Logout', 'لاگ آؤٹ')}
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="flex-1">
          <div className="sticky top-0 z-40 flex items-center justify-between border-b border-brand-100 bg-white px-4 py-3 lg:hidden">
            <span className="font-bold text-brand-500 font-serif">Admin Panel</span>
            <div className="flex items-center gap-2">
              <Link to="/" className="text-sm text-muted">{t('Store', 'اسٹور')}</Link>
              <button
                onClick={() => {
                  void signOut().finally(() => navigate('/admin'));
                }}
                className="text-sm text-red-500"
              >
                {t('Logout', 'لاگ آؤٹ')}
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          <div className="flex gap-1 border-b border-brand-100 bg-white px-2 py-2 overflow-x-auto no-scrollbar lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                  active === item.key ? 'bg-brand-500 text-white' : 'text-muted hover:bg-brand-50'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
