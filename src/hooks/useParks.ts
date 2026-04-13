import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Park } from '../types';
import { searchParks } from '../db/parks';

export type SourceFilter = 'all' | 'nps' | 'state';

export function useParks(
  query: string,
  source: SourceFilter,
  stateFilter: string | null
) {
  const db = useSQLiteContext();
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 30;

  const load = useCallback(
    async (pageNum: number, reset: boolean) => {
      if (reset) setLoading(true);
      try {
        const results = await searchParks(
          db, query, source, stateFilter, PAGE_SIZE, pageNum * PAGE_SIZE
        );
        if (reset) {
          setParks(results);
        } else {
          setParks(prev => [...prev, ...results]);
        }
        setHasMore(results.length === PAGE_SIZE);
        setPage(pageNum);
      } finally {
        if (reset) setLoading(false);
      }
    },
    [db, query, source, stateFilter]
  );

  useEffect(() => {
    load(0, true);
  }, [load]);

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    load(page + 1, false);
  }, [hasMore, page, load]);

  const refresh = useCallback(() => load(0, true), [load]);

  return { parks, loading, loadMore, hasMore, refresh };
}
