import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { dataService } from '@/data/dataService';
import type { Category, SiteSettings } from '@/types';

interface StoreDataContextValue {
  settings: SiteSettings | null;
  categories: Category[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const StoreDataContext = createContext<StoreDataContextValue | undefined>(undefined);

export function StoreDataProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [s, c] = await Promise.all([
          dataService.getSettings(),
          dataService.getCategories(),
        ]);
        if (cancelled) return;
        setSettings(s);
        setCategories(c);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load store data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadFlag]);

  const reload = () => setReloadFlag((f) => f + 1);

  return (
    <StoreDataContext.Provider value={{ settings, categories, loading, error, reload }}>
      {children}
    </StoreDataContext.Provider>
  );
}

export function useStoreData() {
  const ctx = useContext(StoreDataContext);
  if (!ctx) throw new Error('useStoreData must be used within StoreDataProvider');
  return ctx;
}
