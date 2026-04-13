import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useColorScheme } from '../hooks/use-color-scheme';
import { Colors } from '../constants/colors';
import { Park, Visit } from '../types';

interface Props {
  park: Park;
  visit: Visit | null;
  onPress: () => void;
}

const CARD_HEIGHT = 100;

export function ParkCard({ park, visit, onPress }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const stateList = park.stateCodes
    ? park.stateCodes.split(',').slice(0, 3).join(', ')
    : '';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {park.imageUrl ? (
          <Image
            source={{ uri: park.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface }]}>
            <Text style={styles.placeholderEmoji}>
              {park.source === 'nps' ? '🏔️' : '🌲'}
            </Text>
          </View>
        )}
        {visit && (
          <View style={[styles.visitedBadge, { backgroundColor: colors.tint }]}>
            <Text style={styles.visitedCheck}>✓</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {park.fullName}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.typePill, { backgroundColor: park.source === 'nps' ? colors.tintLight : colors.surface }]}>
            <Text style={[styles.typeLabel, { color: park.source === 'nps' ? colors.tintDark : colors.textSecondary }]}>
              {park.source === 'nps' ? 'National' : 'State'}
            </Text>
          </View>
          {stateList ? (
            <Text style={[styles.states, { color: colors.textSecondary }]} numberOfLines={1}>
              {stateList}
            </Text>
          ) : null}
        </View>
        {visit && (
          <Text style={[styles.visitDate, { color: colors.tint }]}>
            Visited {new Date(visit.visitedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    height: CARD_HEIGHT,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 100,
    position: 'relative',
  },
  image: {
    width: 100,
    height: CARD_HEIGHT,
  },
  imagePlaceholder: {
    width: 100,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  visitedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitedCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  states: {
    fontSize: 12,
    flex: 1,
  },
  visitDate: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});
