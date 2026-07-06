import { Stack } from 'expo-router';
import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from '@/db/client';
import migrations from '@/drizzle/migrations';
import { Colors } from '@/lib/theme';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Database error</Text>
        <Text style={styles.errorBody}>{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.muted}>Preparing your database…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Suspense fallback={<ActivityIndicator size="large" style={{ flex: 1 }} />}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.bgPage },
            headerShadowVisible: false,
            headerTitleStyle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
            headerTintColor: Colors.accent,
            contentStyle: { backgroundColor: Colors.bgPage },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="brew/new" options={{ title: 'New brew', presentation: 'modal' }} />
          <Stack.Screen name="beans/new" options={{ title: 'Add bean', presentation: 'modal' }} />
          <Stack.Screen name="brewers/new" options={{ title: 'Add brewer', presentation: 'modal' }} />
          <Stack.Screen name="grinders/new" options={{ title: 'Add grinder', presentation: 'modal' }} />
          <Stack.Screen name="beans/[id]" options={{ title: 'Edit bean' }} />
          <Stack.Screen name="brewers/[id]" options={{ title: 'Edit brewer' }} />
          <Stack.Screen name="grinders/[id]" options={{ title: 'Edit grinder' }} />
          <Stack.Screen name="recipes/new" options={{ title: 'New recipe', presentation: 'modal' }} />
          <Stack.Screen name="recipes/[id]" options={{ title: 'Edit recipe' }} />
          <Stack.Screen name="brew/[id]" options={{ title: 'Brew' }} />
          <Stack.Screen name="brew/edit" options={{ title: 'Edit brew', presentation: 'modal' }} />
          <Stack.Screen name="brew/timer" options={{ title: 'Timer', headerShown: false }} />
          <Stack.Screen name="brew/rate" options={{ title: 'Rate', presentation: 'modal' }} />
        </Stack>
      </Suspense>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: Colors.bgPage },
  muted: { color: Colors.textTertiary },
  errorTitle: { fontSize: 18, fontWeight: '600', color: Colors.destructive },
  errorBody: { color: Colors.textSecondary, textAlign: 'center' },
});
