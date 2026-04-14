import * as SQLite from 'expo-sqlite';

export interface EarnedBadge {
  badgeId: string;
  earnedAt: number;
}

export async function getEarnedBadges(db: SQLite.SQLiteDatabase): Promise<EarnedBadge[]> {
  const rows = await db.getAllAsync<{ badge_id: string; earned_at: number }>(
    'SELECT badge_id, earned_at FROM earned_badges ORDER BY earned_at ASC'
  );
  return rows.map(r => ({ badgeId: r.badge_id, earnedAt: r.earned_at }));
}

export async function saveBadge(db: SQLite.SQLiteDatabase, badgeId: string): Promise<void> {
  await db.runAsync(
    'INSERT OR IGNORE INTO earned_badges (badge_id, earned_at) VALUES (?, ?)',
    [badgeId, Date.now()]
  );
}
