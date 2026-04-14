import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../../constants/colors';
import { ParkCard } from '../../components/ParkCard';
import { SearchBar } from '../../components/SearchBar';
import { EmptyState } from '../../components/EmptyState';
import { useParks, SourceFilter } from '../../hooks/useParks';
import { getVisit } from '../../db/visits';
import { getStatesForSource } from '../../db/parks';
import { US_STATES } from '../../constants/designations';
import { Visit } from '../../types';

const SOURCE_FILTERS: { label: string; value: SourceFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'National Parks', value: 'nps' },
  { label: 'State Parks', value: 'state' },
];

export default function BrowseScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const db = useSQLiteContext();

  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [visitCache, setVisitCache] = useState<Record<string, Visit | null>>({});

  const { parks, loading, loadMore, refresh } = useParks(query, source, selectedState);

  // Load states when switching to state or nps filter
  useEffect(() => {
    setSelectedState(null);
    if (source === 'state' || source === 'nps') {
      getStatesForSource(db, source).then(setAvailableStates);
    } else {
      setAvailableStates([]);
    }
  }, [source, db]);

  const handleSourceChange = (value: SourceFilter) => {
    setSource(value);
    setSelectedState(null);
  };

  // Batch-load visit status for the current parks list.
  const reloadVisitCache = useCallback(async (parkList: typeof parks) => {
    if (parkList.length === 0) return;
    const results = await Promise.all(
      parkList.map(p => getVisit(db, p.id).then(v => ({ id: p.id, v })))
    );
    setVisitCache(prev => {
      const next = { ...prev };
      results.forEach(({ id, v }) => { next[id] = v; });
      return next;
    });
  }, [db]);

  // Re-fetch when the parks list changes (new search/filter results)
  useEffect(() => {
    reloadVisitCache(parks);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parks]);

  // Re-fetch when tab comes back into focus so visits marked elsewhere show up
  useFocusEffect(
    useCallback(() => {
      reloadVisitCache(parks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadVisitCache])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.searchRow}>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>

        {/* Source filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {SOURCE_FILTERS.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: source === f.value ? colors.tint : colors.surface,
                  borderColor: source === f.value ? colors.tint : colors.border,
                },
              ]}
              onPress={() => handleSourceChange(f.value)}
            >
              <Text
                style={[
                  styles.filterLabel,
                  { color: source === f.value ? '#fff' : colors.textSecondary },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* State filter row — shown when National Parks or State Parks is selected */}
        {availableStates.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stateFilterRow}
          >
            <TouchableOpacity
              style={[
                styles.stateChip,
                {
                  backgroundColor: selectedState === null ? colors.accent : colors.surface,
                  borderColor: selectedState === null ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSelectedState(null)}
            >
              <Text style={[styles.stateLabel, { color: selectedState === null ? '#fff' : colors.textSecondary }]}>
                All States
              </Text>
            </TouchableOpacity>
            {availableStates.map(code => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.stateChip,
                  {
                    backgroundColor: selectedState === code ? colors.accent : colors.surface,
                    borderColor: selectedState === code ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setSelectedState(selectedState === code ? null : code)}
              >
                <Text style={[styles.stateLabel, { color: selectedState === code ? '#fff' : colors.textSecondary }]}>
                  {US_STATES[code] ?? code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={parks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ParkCard
            park={item}
            visit={visitCache[item.id] ?? null}
            onPress={() => router.push(`/park/${item.id}`)}
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        onRefresh={refresh}
        refreshing={loading && parks.length === 0}
        contentContainerStyle={loading && parks.length === 0 ? styles.centerContent : styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              emoji="🌲"
              title="No parks found"
              subtitle={query ? `No results for "${query}"` : 'Parks will appear here once loaded'}
            />
          ) : null
        }
        getItemLayout={(_, index) => ({ length: 112, offset: 112 * index, index })}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterRow: {
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 24,
    marginBottom: 8,
  },
  stateFilterRow: {
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 24,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  stateChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  stateLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 8,
  },
  centerContent: {
    flex: 1,
  },
});
