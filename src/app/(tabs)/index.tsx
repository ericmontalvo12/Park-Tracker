import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../../constants/colors';
import { ParkCard } from '../../components/ParkCard';
import { SearchBar } from '../../components/SearchBar';
import { EmptyState } from '../../components/EmptyState';
import { useParks, SourceFilter } from '../../hooks/useParks';
import { getVisit } from '../../db/visits';
import { Visit } from '../../types';

const SOURCE_FILTERS: { label: string; value: SourceFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'National', value: 'nps' },
  { label: 'State', value: 'state' },
];

export default function BrowseScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const db = useSQLiteContext();

  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [visitCache, setVisitCache] = useState<Record<string, Visit | null>>({});

  const { parks, loading, loadMore, refresh } = useParks(query, source, null);

  const loadVisit = async (parkId: string) => {
    if (parkId in visitCache) return;
    const visit = await getVisit(db, parkId);
    setVisitCache(prev => ({ ...prev, [parkId]: visit }));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.searchRow}>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>
        <View style={styles.filterRow}>
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
              onPress={() => setSource(f.value)}
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
        </View>
      </View>

      <FlatList
        data={parks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          loadVisit(item.id);
          return (
            <ParkCard
              park={item}
              visit={visitCache[item.id] ?? null}
              onPress={() => router.push(`/park/${item.id}`)}
            />
          );
        }}
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
    paddingBottom: 8,
  },
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
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
  listContent: {
    paddingVertical: 8,
  },
  centerContent: {
    flex: 1,
  },
});
