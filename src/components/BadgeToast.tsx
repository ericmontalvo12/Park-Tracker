import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Colors } from '../constants/colors';
import { BadgeDefinition } from '../constants/badges';

interface Props {
  badge: BadgeDefinition;
  onDismiss: () => void;
}

export function BadgeToast({ badge, onDismiss }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pop in
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 200 }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss after 4s
    const timer = setTimeout(dismiss, 4000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.8, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={dismiss}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.card, transform: [{ scale }], opacity },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.tintLight }]}>
            <Text style={styles.emoji}>{badge.emoji}</Text>
          </View>
          <Text style={[styles.earned, { color: colors.tint }]}>Badge Earned!</Text>
          <Text style={[styles.name, { color: colors.text }]}>{badge.name}</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{badge.description}</Text>
          <Pressable style={[styles.btn, { backgroundColor: colors.tint }]} onPress={dismiss}>
            <Text style={styles.btnText}>Awesome!</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 48,
  },
  earned: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  btn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
