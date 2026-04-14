import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Colors } from '../constants/colors';
import { BadgeDefinition } from '../constants/badges';

interface Props {
  badge: BadgeDefinition;
  onDismiss: () => void;
}

export function BadgeToast({ badge, onDismiss }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss after 3s
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 120, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.tint, transform: [{ translateY }], opacity },
      ]}
    >
      <Text style={styles.emoji}>{badge.emoji}</Text>
      <View style={styles.text}>
        <Text style={[styles.label, { color: colors.tint }]}>Badge Earned!</Text>
        <Text style={[styles.name, { color: colors.text }]}>{badge.name}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
          {badge.description}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  emoji: {
    fontSize: 36,
  },
  text: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
