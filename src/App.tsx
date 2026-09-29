import { lazy, Suspense } from 'react';
import { LanguageProvider } from '@/context/LanguageContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import { StoreDataProvider } from '@/context/StoreDataContext';
import { Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { HomePage } from '@/pages/HomePage';
import { CategoryPage } from '@/pages/CategoryPage';
import { ProductPage } from '@/pages/ProductPage';
import { SearchPage } from '@/pages/SearchPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminResetPasswordPage from '@/pages/admin/AdminResetPasswordPage';

// Admin pages are lazy-loaded so customers never download admin code
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminProductsPage = lazy(() =>
  import('@/pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage }))
);
const AdminProductFormPage = lazy(() =>
  import('@/pages/admin/AdminProductFormPage').then((m) => ({ default: m.AdminProductFormPage }))
);
const AdminCategoriesPage = lazy(() =>
  import('@/pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage }))
);
const AdminSettingsPage = lazy(() =>
  import('@/pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage }))
);

function AdminRoute() {
  const { path } = useRouter();
  const { status } = useAdminAuth();

  if (path === '/admin/reset-password') return <AdminResetPasswordPage />;
  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner /></div>;
  }
  if (status === 'signed_out') return <AdminLoginPage />;
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <ErrorBoundary>
        {path === '/admin' || path === '/admin/' || path === '/admin/dashboard' ? <AdminDashboardPage /> :
        path === '/admin/products' ? <AdminProductsPage /> :
        path === '/admin/products/new' ? <AdminProductFormPage /> :
        path.startsWith('/admin/products/') && path.endsWith('/edit') ? <AdminProductFormPage productId={path.split('/')[3]} /> :
        path === '/admin/categories' || path === '/admin/categories/new' || path.startsWith('/admin/categories/') ? <AdminCategoriesPage /> :
        path === '/admin/settings' ? <AdminSettingsPage /> :
        <AdminDashboardPage />}
      </ErrorBoundary>
    </Suspense>
  );
}

function CustomerRoutes() {
  const { path } = useRouter();
  const safeSegment = (value: string | undefined) => {
    try { return value ? decodeURIComponent(value) : ''; } catch { return ''; }
  };

  return (
    <ErrorBoundary>
      {path.startsWith('/category/') && safeSegment(path.split('/')[2]) ? <CategoryPage slug={safeSegment(path.split('/')[2])} /> :
      path.startsWith('/product/') && safeSegment(path.split('/')[2]) ? <ProductPage slug={safeSegment(path.split('/')[2])} /> :
      path === '/search' ? <SearchPage /> :
      path === '/about' ? <AboutPage /> :
      path === '/contact' ? <ContactPage /> :
      path === '/' ? <HomePage /> : <NotFoundPage />}
    </ErrorBoundary>
  );
}

function AppRoutes() {
  const { path } = useRouter();
  const isAdminRoute = path === '/admin' || path.startsWith('/admin/');

  if (isAdminRoute) return <AdminRoute />;
  return <Layout><CustomerRoutes /></Layout>;
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <RouterProvider>
          <StoreDataProvider>
            <AdminAuthProvider>
              <AppRoutes />
            </AdminAuthProvider>
          </StoreDataProvider>
        </RouterProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
