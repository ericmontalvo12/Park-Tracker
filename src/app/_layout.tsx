import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { initDatabase } from '../db/client';
import { syncNpsParks } from '../services/npsApi';
import { BadgeProvider } from '../context/BadgeContext';

SplashScreen.preventAutoHideAsync();

// ── Sync signal — increments after each sync so screens auto-refresh ──────────
export const SyncSignalContext = createContext(0);
export function useSyncSignal() { return useContext(SyncSignalContext); }

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [syncSignal, setSyncSignal] = useState(0);

  return (
    <SQLiteProvider
      databaseName="parktracker.db"
      onInit={async (db) => {
        await initDatabase(db);

        // Sync National Parks from NPS API
        await syncNpsParks(db).catch(console.warn);
        setSyncSignal(s => s + 1);
      }}
    >
      <BadgeProvider>
        <SyncSignalContext.Provider value={syncSignal}>
          {children}
        </SyncSignalContext.Provider>
      </BadgeProvider>
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
