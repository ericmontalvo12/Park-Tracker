import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, useColorScheme, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../../constants/colors';
import { ParkCard } from '../../components/ParkCard';
import { EmptyState } from '../../components/EmptyState';
import { getVisitedParks } from '../../db/parks';
import { getAllVisits } from '../../db/visits';
import { Park, Visit } from '../../types';

export default function VisitedScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const db = useSQLiteContext();

  const [parks, setParks] = useState<Park[]>([]);
  const [visitMap, setVisitMap] = useState<Record<string, Visit>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [visitedParks, allVisits] = await Promise.all([
      getVisitedParks(db),
      getAllVisits(db),
    ]);
    const map: Record<string, Visit> = {};
    for (const v of allVisits) map[v.parkId] = v;
    setParks(visitedParks);
    setVisitMap(map);
    setLoading(false);
  };

  // Reload whenever this tab comes into focus (e.g. after marking visited on detail screen)
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [db])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={parks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ParkCard
            park={item}
            visit={visitMap[item.id] ?? null}
            onPress={() => router.push(`/park/${item.id}`)}
          />
        )}
        onRefresh={load}
        refreshing={loading && parks.length === 0}
        contentContainerStyle={loading && parks.length === 0 ? styles.centerContent : styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              emoji="🗺️"
              title="No parks visited yet"
              subtitle="Mark parks as visited on their detail page and they'll appear here"
            />
          ) : null
        }
        getItemLayout={(_, index) => ({ length: 112, offset: 112 * index, index })}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  centerContent: {
    flex: 1,
  },
});
