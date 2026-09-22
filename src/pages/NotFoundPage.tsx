import { Link } from '@/context/RouterContext';

export function NotFoundPage() {
  return (
    <main className="container-padding section-padding py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">404</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">Page not found</h1>
      <p className="mt-3 text-muted">The page you requested does not exist or has moved.</p>
      <Link to="/" className="btn-primary mt-6">Return to the store</Link>
    </main>
  );
}
