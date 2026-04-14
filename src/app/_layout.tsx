import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { initDatabase } from '../db/client';
import { syncNpsParks } from '../services/npsApi';
import { syncStateParksfromWikidata } from '../services/wikidataApi';
import { Colors } from '../constants/colors';
import { BadgeToast } from '../components/BadgeToast';
import { BadgeDefinition } from '../constants/badges';

SplashScreen.preventAutoHideAsync();

// ── Sync signal — increments after each sync so screens auto-refresh ──────────
export const SyncSignalContext = createContext(0);
export function useSyncSignal() { return useContext(SyncSignalContext); }

// ── Badge context — queue of newly earned badges to show as toasts ────────────
interface BadgeContextValue {
  notify: (badges: BadgeDefinition[]) => void;
}
export const BadgeContext = createContext<BadgeContextValue>({ notify: () => {} });
export function useBadgeNotifier() { return useContext(BadgeContext); }

function AppInitializer({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncSignal, setSyncSignal] = useState(0);

  // Badge toast queue
  const [badgeQueue, setBadgeQueue] = useState<BadgeDefinition[]>([]);
  const notify = useCallback((badges: BadgeDefinition[]) => {
    setBadgeQueue(prev => [...prev, ...badges]);
  }, []);
  const dismissFirst = useCallback(() => {
    setBadgeQueue(prev => prev.slice(1));
  }, []);

  return (
    <SQLiteProvider
      databaseName="parktracker.db"
      onInit={async (db) => {
        await initDatabase(db);

        // Await NPS sync so the 63 national parks are in the DB
        // before the UI renders — it's a single fast network call.
        await syncNpsParks(db).catch(console.warn);
        setSyncSignal(s => s + 1);

        // Wikidata queries run per-type so keep them in the background.
        syncStateParksfromWikidata(db, (msg) => {
          setSyncMessage(msg);
        })
          .catch(console.warn)
          .finally(() => {
            setSyncMessage(null);
            setSyncSignal(s => s + 1);
          });
      }}
    >
      <BadgeContext.Provider value={{ notify }}>
        <SyncSignalContext.Provider value={syncSignal}>
          {children}
        </SyncSignalContext.Provider>
      </BadgeContext.Provider>

      {syncMessage && (
        <View style={[styles.syncBanner, { backgroundColor: colors.tint }]}>
          <Text style={styles.syncText}>{syncMessage}</Text>
        </View>
      )}

      {/* Show one badge toast at a time from the queue */}
      {badgeQueue.length > 0 && (
        <BadgeToast badge={badgeQueue[0]} onDismiss={dismissFirst} />
      )}
    </SQLiteProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AppInitializer>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="park/[id]"
            options={{ headerShown: true, title: '', headerBackTitle: 'Back' }}
          />
        </Stack>
      </ThemeProvider>
    </AppInitializer>
  );
}

const styles = StyleSheet.create({
  syncBanner: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  syncText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
