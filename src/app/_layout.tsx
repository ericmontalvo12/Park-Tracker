import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { initDatabase } from '../db/client';
import { syncNpsParks } from '../services/npsApi';
import { syncRecGovStateParks } from '../services/recGovApi';
import { Colors } from '../constants/colors';

SplashScreen.preventAutoHideAsync();

function AppInitializer({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  return (
    <SQLiteProvider
      databaseName="parktracker.db"
      onInit={async (db) => {
        await initDatabase(db);

        // Run syncs in background — NPS is fast, RecGov takes longer on first run
        syncNpsParks(db).catch(console.warn);
        syncRecGovStateParks(db, (state, index, total) => {
          setSyncMessage(`Loading state parks… ${state} (${index + 1}/${total})`);
          if (index + 1 === total) {
            setTimeout(() => setSyncMessage(null), 1500);
          }
        }).catch(console.warn);
      }}
    >
      {children}
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
