import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../../constants/colors';
import { Park } from '../../types';
import { getVisitedParkIds } from '../../db/visits';
import { searchParks } from '../../db/parks';

const INITIAL_REGION: Region = {
  latitude: 39.5,
  longitude: -98.35,
  latitudeDelta: 60,
  longitudeDelta: 60,
};

export default function MapScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const db = useSQLiteContext();
  const mapRef = useRef<MapView>(null);

  const [visitedParks, setVisitedParks] = useState<Park[]>([]);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [region, setRegion] = useState<Region>(INITIAL_REGION);

  const load = useCallback(async () => {
    const ids = await getVisitedParkIds(db);
    setVisitedIds(new Set(ids));
    if (ids.length > 0) {
      const parks = await searchParks(db, '', 'all', null, 500, 0);
      setVisitedParks(parks.filter(p => ids.includes(p.id) && p.latitude && p.longitude));
    } else {
      setVisitedParks([]);
    }
  }, [db]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  const goToMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Location access is needed to show your position.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 5,
      longitudeDelta: 5,
    }, 500);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsCompass
      >
        {visitedParks.map(park => (
          <Marker
            key={park.id}
            coordinate={{ latitude: park.latitude!, longitude: park.longitude! }}
            pinColor={colors.mapVisited}
          >
            <Callout onPress={() => router.push(`/park/${park.id}`)}>
              <View style={styles.callout}>
                <Text style={styles.calloutName} numberOfLines={2}>{park.fullName}</Text>
                <Text style={styles.calloutAction}>Tap to view →</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {visitedParks.length === 0 && (
        <View style={[styles.emptyBanner, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Mark parks as visited to see them on the map
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.locationBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={goToMyLocation}
      >
        <Text style={{ fontSize: 20 }}>📍</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  callout: {
    width: 180,
    padding: 8,
  },
  calloutName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  calloutAction: {
    fontSize: 12,
    color: '#2D7D46',
  },
  emptyBanner: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  locationBtn: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
