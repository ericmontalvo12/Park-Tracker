import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../../constants/colors';
import { PhotoGrid } from '../../components/PhotoGrid';
import { useVisit } from '../../hooks/useVisits';
import { usePhotos } from '../../hooks/usePhotos';
import { getParkById } from '../../db/parks';
import { Park } from '../../types';

function StarRating({ rating, onRate }: { rating: number | null; onRate: (r: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onRate(n)}>
          <Text style={{ fontSize: 24 }}>{n <= (rating ?? 0) ? '★' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ParkDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  // useLocalSearchParams can return string | string[] — normalise to string
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const db = useSQLiteContext();
  const navigation = useNavigation();

  const [park, setPark] = useState<Park | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [notes, setNotes] = useState('');

  const { visit, loading: visitLoading, toggle, saveNotes, saveRating } = useVisit(id);
  const { photos, addNewPhoto, removePhoto } = usePhotos(id);

  useEffect(() => {
    if (!id) return;
    getParkById(db, id)
      .then(p => {
        setPark(p);
        if (p) navigation.setOptions({ title: p.fullName });
      })
      .catch(err => console.warn('Failed to load park:', err));
  }, [db, id]);

  useEffect(() => {
    if (visit?.notes) setNotes(visit.notes);
  }, [visit]);

  const handleToggleVisited = async () => {
    if (visit) {
      Alert.alert(
        'Remove Visit',
        'Remove this park from your visited list?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: toggle },
        ]
      );
    } else {
      await toggle();
    }
  };

  if (!park) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textMuted }}>Loading…</Text>
      </View>
    );
  }

  const rawData = (() => {
    try { return JSON.parse(park.rawJson); } catch { return {}; }
  })();

  const entranceFees: Array<{ cost: string; title: string }> = rawData.entranceFees ?? [];
  const operatingHours: Array<{ name: string; standardHours: Record<string, string> }> = rawData.operatingHours ?? [];

  const stateList = park.stateCodes
    ? park.stateCodes.split(',').map(s => s.trim()).join(' · ')
    : '';

  const descPreview = park.description.slice(0, 280);
  const hasLongDesc = park.description.length > 280;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Hero image */}
      {park.imageUrl ? (
        <Image
          source={{ uri: park.imageUrl }}
          style={styles.heroImage}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.heroPlaceholder, { backgroundColor: colors.surface }]}>
          <Text style={styles.heroEmoji}>{park.source === 'nps' ? '🏔️' : '🌲'}</Text>
        </View>
      )}

      <View style={styles.body}>
        {/* Header */}
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.parkName, { color: colors.text }]}>{park.fullName}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: park.source === 'nps' ? colors.tintLight : colors.surface }]}>
                <Text style={[styles.badgeText, { color: park.source === 'nps' ? colors.tintDark : colors.textSecondary }]}>
                  {park.source === 'nps' ? 'National' : 'State'}
                </Text>
              </View>
              {park.designation ? (
                <Text style={[styles.designation, { color: colors.textSecondary }]}>
                  {park.designation}
                </Text>
              ) : null}
            </View>
            {stateList ? (
              <Text style={[styles.states, { color: colors.textMuted }]}>{stateList}</Text>
            ) : null}
          </View>
        </View>

        {/* Visited toggle */}
        <TouchableOpacity
          style={[
            styles.visitBtn,
            { backgroundColor: visit ? colors.tint : colors.surface, borderColor: visit ? colors.tint : colors.border },
          ]}
          onPress={handleToggleVisited}
          disabled={visitLoading}
        >
          <Text style={[styles.visitBtnText, { color: visit ? '#fff' : colors.text }]}>
            {visit ? '✓ Visited' : 'Mark as Visited'}
          </Text>
        </TouchableOpacity>

        {/* Rating (only when visited) */}
        {visit && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Rating</Text>
            <StarRating rating={visit.rating} onRate={r => saveRating(r)} />
          </View>
        )}

        {/* Description */}
        {park.description ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {descExpanded || !hasLongDesc ? park.description : descPreview + '…'}
            </Text>
            {hasLongDesc && (
              <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)}>
                <Text style={[styles.readMore, { color: colors.tint }]}>
                  {descExpanded ? 'Show less' : 'Read more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Entrance fees */}
        {entranceFees.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Entrance Fees</Text>
            {entranceFees.slice(0, 3).map((fee, i) => (
              <View key={i} style={[styles.feeRow, { borderColor: colors.border }]}>
                <Text style={[styles.feeTitle, { color: colors.text }]}>{fee.title}</Text>
                <Text style={[styles.feeCost, { color: colors.tint }]}>
                  {fee.cost === '0.00' ? 'Free' : `$${fee.cost}`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Mini map */}
        {park.latitude && park.longitude && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            <MapView
              style={styles.miniMap}
              region={{
                latitude: park.latitude,
                longitude: park.longitude,
                latitudeDelta: 1.5,
                longitudeDelta: 1.5,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={{ latitude: park.latitude, longitude: park.longitude }}
                pinColor={colors.tint}
              />
            </MapView>
          </View>
        )}

        {/* Notes (only when visited) */}
        {visit && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={notes}
              onChangeText={setNotes}
              onBlur={() => saveNotes(notes)}
              placeholder="Add notes about your visit…"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Photos */}
        <View style={styles.photosSection}>
          <PhotoGrid
            photos={photos}
            onAddPhoto={(uri) => addNewPhoto(uri)}
            onDeletePhoto={removePhoto}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: 240,
  },
  heroPlaceholder: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 64,
  },
  body: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  titleBlock: {
    flex: 1,
  },
  parkName: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  designation: {
    fontSize: 13,
  },
  states: {
    fontSize: 13,
    marginTop: 2,
  },
  visitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 20,
  },
  visitBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  readMore: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  feeTitle: {
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  feeCost: {
    fontSize: 14,
    fontWeight: '600',
  },
  miniMap: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 100,
  },
  photosSection: {
    marginHorizontal: -16,
  },
});
