import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'qasmi-recently-viewed';
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  const [viewedIds, setViewedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) as string[] : [];
    } catch {
      return [];
    }
  });

  const addViewed = useCallback((id: string) => {
    setViewedIds((prev) => {
      const filtered = prev.filter((v) => v !== id);
      const updated = [id, ...filtered].slice(0, MAX_ITEMS);
      return updated;
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(viewedIds));
    } catch {
      // ignore
    }
  }, [viewedIds]);

  return { viewedIds, addViewed };
}
