import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { initDatabase } from '../db/client';
import { syncNpsParks } from '../services/npsApi';
import { syncStateParksfromWikidata } from '../services/wikidataApi';
import { Colors } from '../constants/colors';
import { BadgeProvider } from '../context/BadgeContext';

SplashScreen.preventAutoHideAsync();

// ── Sync signal — increments after each sync so screens auto-refresh ──────────
export const SyncSignalContext = createContext(0);
export function useSyncSignal() { return useContext(SyncSignalContext); }

function AppInitializer({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncSignal, setSyncSignal] = useState(0);

  return (
    <SQLiteProvider
      databaseName="parktracker.db"
      onInit={async (db) => {
        await initDatabase(db);

        await syncNpsParks(db).catch(console.warn);
        setSyncSignal(s => s + 1);

        syncStateParksfromWikidata(db, (msg) => setSyncMessage(msg))
          .catch(console.warn)
          .finally(() => { setSyncMessage(null); setSyncSignal(s => s + 1); });
      }}
    >
      <BadgeProvider>
        <SyncSignalContext.Provider value={syncSignal}>
          {children}
        </SyncSignalContext.Provider>
      </BadgeProvider>

      {syncMessage && (
        <View style={[styles.syncBanner, { backgroundColor: colors.tint }]}>
          <Text style={styles.syncText}>{syncMessage}</Text>
        </View>
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
