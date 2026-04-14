import * as SQLite from 'expo-sqlite';
import {
  BADGES,
  BadgeDefinition,
  BIG_FIVE_IDS,
  GRAND_SLAM_IDS,
  DESERT_QUAD_IDS,
  ALASKA_PACK_IDS,
  ALASKA_WILD_IDS,
  NPS_PARK_CODES,
  EAST_COAST_STATES,
  WEST_COAST_STATES,
  US_REGIONS,
  ALL_50_STATES,
} from '../constants/badges';
import { getEarnedBadges, saveBadge } from '../db/badges';

interface VisitRow {
  park_id: string;
  source: string;
  designation: string;
  state_codes: string;
  notes: string | null;
  rating: number | null;
}

function allIn(ids: Set<string>, visited: Set<string>): boolean {
  for (const id of ids) if (!visited.has(id)) return false;
  return true;
}

function checkBadge(
  id: string,
  visitedIds: Set<string>,
  rows: VisitRow[],
  visitedStates: Set<string>,
  ratedCount: number,
  notedCount: number,
  parksWithPhotos: number
): boolean {
  const total = visitedIds.size;
  const npsCount = rows.filter(r => r.source === 'nps').length;

  switch (id) {
    // ── Milestones ──────────────────────────────────────────────────────────
    case 'first_steps':   return total >= 1;
    case 'explorer':      return total >= 5;
    case 'trailblazer':   return total >= 15;
    case 'adventurer':    return total >= 30;
    case 'enthusiast':    return total >= 50;
    case 'park_ranger':   return total >= 63;
    case 'legend':        return total >= 100;

    // ── National Parks ───────────────────────────────────────────────────────
    case 'national_debut': return npsCount >= 1;
    case 'big_five':       return allIn(BIG_FIVE_IDS, visitedIds);
    case 'grand_slam':     return allIn(GRAND_SLAM_IDS, visitedIds);
    case 'desert_quad':    return allIn(DESERT_QUAD_IDS, visitedIds);
    case 'alaska_pack':    return allIn(ALASKA_PACK_IDS, visitedIds);
    case 'alaska_wild':    return allIn(ALASKA_WILD_IDS, visitedIds);
    case 'nps_complete':   return allIn(NPS_PARK_CODES, visitedIds);

    // ── Geographic ───────────────────────────────────────────────────────────
    case 'state_hopper': return visitedStates.size >= 5;
    case 'bicoastal': {
      const hasEast = [...visitedStates].some(s => EAST_COAST_STATES.has(s));
      const hasWest = [...visitedStates].some(s => WEST_COAST_STATES.has(s));
      return hasEast && hasWest;
    }
    case 'all_regions': {
      return Object.values(US_REGIONS).every(regionStates =>
        [...visitedStates].some(s => regionStates.has(s))
      );
    }
    case 'fifty_states': {
      return [...ALL_50_STATES].every(s => visitedStates.has(s));
    }

    // ── Designation ──────────────────────────────────────────────────────────
    case 'beach_bum':
      return rows.filter(r => r.designation === 'State Beach').length >= 5;
    case 'forest_dweller':
      return rows.filter(r => r.designation === 'State Forest').length >= 5;
    case 'type_collector': {
      const desigs = new Set(rows.map(r => r.designation));
      return (
        desigs.has('National Park') &&
        desigs.has('State Park') &&
        desigs.has('State Forest') &&
        desigs.has('State Beach') &&
        desigs.has('State Recreation Area')
      );
    }

    // ── Engagement ───────────────────────────────────────────────────────────
    case 'critic':       return ratedCount >= 10;
    case 'storyteller':  return notedCount >= 10;
    case 'photographer': return parksWithPhotos >= 5;

    default: return false;
  }
}

// Evaluates all badge criteria against current DB state.
// Saves any newly earned badges and returns their definitions.
export async function evaluateBadges(db: SQLite.SQLiteDatabase): Promise<BadgeDefinition[]> {
  const earned = new Set((await getEarnedBadges(db)).map(b => b.badgeId));

  const rows = await db.getAllAsync<VisitRow>(`
    SELECT v.park_id, p.source, p.designation, p.state_codes, v.notes, v.rating
    FROM visits v
    JOIN parks p ON p.id = v.park_id
  `);

  const visitedIds = new Set(rows.map(r => r.park_id));

  const visitedStates = new Set<string>();
  let ratedCount = 0;
  let notedCount = 0;

  for (const row of rows) {
    if (row.state_codes) {
      row.state_codes.split(',').forEach(s => { const t = s.trim(); if (t) visitedStates.add(t); });
    }
    if (row.rating != null) ratedCount++;
    if (row.notes?.trim()) notedCount++;
  }

  const photoRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(DISTINCT park_id) as count FROM photos'
  );
  const parksWithPhotos = photoRow?.count ?? 0;

  const newlyEarned: BadgeDefinition[] = [];
  for (const badge of BADGES) {
    if (earned.has(badge.id)) continue;
    if (checkBadge(badge.id, visitedIds, rows, visitedStates, ratedCount, notedCount, parksWithPhotos)) {
      await saveBadge(db, badge.id);
      newlyEarned.push(badge);
    }
  }

  return newlyEarned;
}
