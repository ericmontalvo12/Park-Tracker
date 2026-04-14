import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Visit } from '../types';
import {
  getVisit,
  addVisit,
  removeVisit,
  updateVisitNotes,
  updateVisitRating,
  getAllVisits,
} from '../db/visits';
import { evaluateBadges } from '../services/badgeEvaluator';
import { useBadgeNotifier } from '../context/BadgeContext';

export function useVisit(parkId: string) {
  const db = useSQLiteContext();
  const { notify } = useBadgeNotifier();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const v = await getVisit(db, parkId);
    setVisit(v);
    setLoading(false);
  }, [db, parkId]);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async () => {
    if (visit) {
      await removeVisit(db, parkId);
      setVisit(null);
    } else {
      const newVisit = await addVisit(db, parkId);
      setVisit(newVisit);
      // Check for newly earned badges whenever a park is marked visited
      try {
        const newBadges = await evaluateBadges(db);
        if (newBadges.length > 0) notify(newBadges);
      } catch (err) {
        console.warn('Badge evaluation failed:', err);
      }
    }
  }, [db, parkId, visit, notify]);

  const saveNotes = useCallback(async (notes: string) => {
    await updateVisitNotes(db, parkId, notes);
    setVisit(prev => prev ? { ...prev, notes } : prev);
  }, [db, parkId]);

  const saveRating = useCallback(async (rating: number) => {
    await updateVisitRating(db, parkId, rating);
    setVisit(prev => prev ? { ...prev, rating } : prev);
    // Rating badges (e.g. Critic) — check after each rating saved
    try {
      const newBadges = await evaluateBadges(db);
      if (newBadges.length > 0) notify(newBadges);
    } catch (err) {
      console.warn('Badge evaluation failed:', err);
    }
  }, [db, parkId, notify]);

  return { visit, loading, toggle, saveNotes, saveRating };
}

export function useAllVisits() {
  const db = useSQLiteContext();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllVisits(db);
    setVisits(all);
    setLoading(false);
  }, [db]);

  useEffect(() => { load(); }, [load]);

  return { visits, loading, refresh: load };
}
