import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { initDatabase } from '../db/client';
import { syncNpsParks } from '../services/npsApi';
import { seedStateParks } from '../services/seedStateParks';

SplashScreen.preventAutoHideAsync();

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  return (
    <SQLiteProvider
      databaseName="parktracker.db"
      onInit={async (db) => {
        await initDatabase(db);
        // Seed and sync in background after DB is ready
        setReady(true);
        seedStateParks(db).catch(console.warn);
        syncNpsParks(db).catch(console.warn);
      }}
    >
      {children}
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
