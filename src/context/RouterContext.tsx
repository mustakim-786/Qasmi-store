import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

interface RouterContextValue {
  path: string;
  navigate: (to: string) => void;
  query: URLSearchParams;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

function normalizePath(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname || '/';
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search));

  useEffect(() => {
    const normalized = normalizePath(window.location.pathname);
    if (normalized !== window.location.pathname) window.history.replaceState({}, '', `${normalized}${window.location.search}`);
    const onPop = () => {
      setPath(normalizePath(window.location.pathname));
      setQuery(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (to: string) => {
    const [rawPath, rawQuery = ''] = to.split('?');
    const path = normalizePath(rawPath);
    const destination = `${path}${rawQuery ? `?${rawQuery}` : ''}`;
    if (destination === window.location.pathname + window.location.search) return;
    window.history.pushState({}, '', destination);
    setPath(path);
    setQuery(new URLSearchParams(rawQuery));
    window.scrollTo(0, 0);
  };

  return (
    <RouterContext.Provider value={{ path, navigate, query }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

export function Link({
  to,
  children,
  className,
  onClick,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
