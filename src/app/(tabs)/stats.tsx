import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../../constants/colors';
import { useStats } from '../../hooks/useStats';
import { US_STATES } from '../../constants/designations';
import { BADGES, BADGE_MAP } from '../../constants/badges';
import { getEarnedBadges, EarnedBadge } from '../../db/badges';

function ProgressBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(value / total, 1) : 0;
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
});

export default function StatsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const db = useSQLiteContext();
  const { stats, loading, refresh } = useStats();
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);

  const loadBadges = useCallback(async () => {
    const badges = await getEarnedBadges(db);
    setEarnedBadges(badges);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadBadges();
    }, [refresh, loadBadges])
  );

  const resetAllData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all visits, badges, and photos. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await db.runAsync('DELETE FROM visits');
            await db.runAsync('DELETE FROM earned_badges');
            await db.runAsync('DELETE FROM photos');
            refresh();
            loadBadges();
            Alert.alert('Done', 'All data cleared.');
          },
        },
      ]
    );
  };

  const exportToConsole = async () => {
    const rows = await db.getAllAsync<{ full_name: string; state_codes: string; designation: string }>(
      "SELECT full_name, state_codes, designation FROM parks WHERE source='state' ORDER BY state_codes, full_name"
    );
    console.log('=== STATE PARKS EXPORT ===');
    console.log(`Total: ${rows.length}`);
    console.log(JSON.stringify(rows, null, 2));
    console.log('=== END EXPORT ===');
    Alert.alert('Exported!', `${rows.length} state parks logged to Metro console.`);
  };

  if (loading || !stats) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading stats…</Text>
      </View>
    );
  }

  const totalVisited = stats.visitedNps + stats.visitedState;
  const totalParks = stats.totalNps + stats.totalState;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Hero stat */}
      <View style={[styles.heroCard, { backgroundColor: colors.tintLight }]}>
        <Text style={[styles.heroNumber, { color: colors.tintDark }]}>{totalVisited}</Text>
        <Text style={[styles.heroLabel, { color: colors.tintDark }]}>
          parks visited out of {totalParks.toLocaleString()}
        </Text>
        <ProgressBar value={totalVisited} total={totalParks} color={colors.tint} />
      </View>

      {/* National vs State */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>By Type</Text>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>National Parks</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.visitedNps} / {stats.totalNps}
          </Text>
        </View>
        <ProgressBar value={stats.visitedNps} total={stats.totalNps} color={colors.tint} />

        <View style={[styles.statRow, { marginTop: 14 }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>State Parks</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.visitedState} / {stats.totalState}
          </Text>
        </View>
        <ProgressBar value={stats.visitedState} total={stats.totalState} color={colors.accent} />
      </View>

      {/* States explored */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          States Explored ({stats.visitedStates.length})
        </Text>
        <View style={styles.stateChips}>
          {stats.visitedStates.map(code => (
            <View
              key={code}
              style={[styles.stateChip, { backgroundColor: colors.tintLight }]}
            >
              <Text style={[styles.stateCode, { color: colors.tintDark }]}>{code}</Text>
              <Text style={[styles.stateName, { color: colors.tintDark }]}>
                {US_STATES[code] ?? code}
              </Text>
            </View>
          ))}
          {stats.visitedStates.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Visit parks to see states explored
            </Text>
          )}
        </View>
      </View>

      {/* Most recent visit */}
      {stats.mostRecentParkId && (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push(`/park/${stats.mostRecentParkId}`)}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Most Recent Visit</Text>
          <Text style={[styles.recentName, { color: colors.tint }]} numberOfLines={2}>
            {stats.mostRecentParkName}
          </Text>
          {stats.mostRecentVisitedAt && (
            <Text style={[styles.recentDate, { color: colors.textSecondary }]}>
              {new Date(stats.mostRecentVisitedAt).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Badges */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Badges ({earnedBadges.length}/{BADGES.length})
        </Text>
        <View style={styles.badgeGrid}>
          {BADGES.map(badge => {
            const earned = earnedBadges.find(e => e.badgeId === badge.id);
            return (
              <TouchableOpacity
                key={badge.id}
                style={[
                  styles.badgeCell,
                  {
                    backgroundColor: earned ? colors.tintLight : colors.surface,
                    borderColor: earned ? colors.tint : colors.border,
                    opacity: badge.secret && !earned ? 0 : 1,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  if (badge.secret && !earned) return;
                  Alert.alert(
                    `${badge.emoji} ${badge.name}`,
                    badge.description + (earned
                      ? `\n\nEarned ${new Date(earned.earnedAt).toLocaleDateString()}`
                      : '\n\nNot yet earned')
                  );
                }}
              >
                <Text style={[styles.badgeEmoji, { opacity: earned ? 1 : 0.3 }]}>
                  {badge.secret && !earned ? '🔒' : badge.emoji}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* DEV ONLY — tap to dump all state parks to Metro console */}
      <TouchableOpacity
        style={[styles.exportBtn, { borderColor: colors.border }]}
        onPress={exportToConsole}
      >
        <Text style={[styles.exportText, { color: colors.textMuted }]}>
          Export State Parks to Console
        </Text>
      </TouchableOpacity>

      {/* DEV ONLY — wipe all user data */}
      <TouchableOpacity
        style={[styles.exportBtn, { borderColor: '#FF3B30' }]}
        onPress={resetAllData}
      >
        <Text style={[styles.exportText, { color: '#FF3B30' }]}>
          Reset All Data
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
  },
  heroCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  heroNumber: {
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 72,
  },
  heroLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 8,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  stateChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stateChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stateCode: {
    fontSize: 11,
    fontWeight: '700',
  },
  stateName: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 13,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recentDate: {
    fontSize: 13,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeCell: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 26,
  },
  exportBtn: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  exportText: {
    fontSize: 13,
  },
});
