import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useStats } from '../../hooks/useStats';
import { US_STATES } from '../../constants/designations';

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
  const { stats, loading, refresh } = useStats();

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

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
});
