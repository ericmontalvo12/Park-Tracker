import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getParkCount } from '../db/parks';
import { getVisitedCount, getVisitedStates, getAllVisits } from '../db/visits';

export interface Stats {
  totalNps: number;
  totalState: number;
  visitedNps: number;
  visitedState: number;
  visitedStates: string[];
  totalVisits: number;
  mostRecentParkId: string | null;
  mostRecentParkName: string | null;
  mostRecentVisitedAt: number | null;
}

export function useStats() {
  const db = useSQLiteContext();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [totalNps, totalState, visitedNps, visitedState, visitedStates, allVisits] = await Promise.all([
      getParkCount(db, 'nps'),
      getParkCount(db, 'state'),
      getVisitedCount(db, 'nps'),
      getVisitedCount(db, 'state'),
      getVisitedStates(db),
      getAllVisits(db),
    ]);

    let mostRecentParkId: string | null = null;
    let mostRecentParkName: string | null = null;
    let mostRecentVisitedAt: number | null = null;

    if (allVisits.length > 0) {
      const latest = allVisits[0];
      mostRecentParkId = latest.parkId;
      mostRecentVisitedAt = latest.visitedAt;
      const row = await db.getFirstAsync<{ full_name: string }>(
        'SELECT full_name FROM parks WHERE id = ?',
        [latest.parkId]
      );
      mostRecentParkName = row?.full_name ?? null;
    }

    setStats({
      totalNps,
      totalState,
      visitedNps,
      visitedState,
      visitedStates,
      totalVisits: allVisits.length,
      mostRecentParkId,
      mostRecentParkName,
      mostRecentVisitedAt,
    });
    setLoading(false);
  }, [db]);

  useEffect(() => { load(); }, [load]);

  return { stats, loading, refresh: load };
}
