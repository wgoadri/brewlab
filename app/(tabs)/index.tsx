import { Link } from 'expo-router';
import { desc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import { brews } from '@/db/schema';
import { METHODS, type BrewMethod } from '@/lib/methods';

export default function BrewsScreen() {
  const { data } = useLiveQuery(db.select().from(brews).orderBy(desc(brews.brewedAt)));

  return (
    <SafeAreaView style={styles.flex} edges={['bottom']}>
      <FlatList
        data={data}
        keyExtractor={(b) => String(b.id)}
        contentContainerStyle={data?.length ? styles.list : styles.flex}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No brews yet</Text>
            <Text style={styles.muted}>Log your first cup to start tuning your recipe.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {METHODS[item.method as BrewMethod]?.label ?? item.method}
            </Text>
            <Text style={styles.muted}>
              {item.doseG ?? '–'} g · {item.waterG ?? '–'} g water · {item.waterTempC ?? '–'} °C
            </Text>
            <Text style={styles.score}>
              {item.overallRating != null ? `★ ${item.overallRating}/10` : 'Not rated'}
            </Text>
          </View>
        )}
      />

      <Link href="/brew/new" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+  New brew</Text>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fbf7f2' },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#3a2a1c' },
  muted: { color: '#8a7a6c' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 4, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#3a2a1c' },
  score: { marginTop: 4, color: '#7a4a2b', fontWeight: '600' },
  fab: {
    position: 'absolute', right: 16, bottom: 24,
    backgroundColor: '#7a4a2b', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 28,
  },
  fabText: { color: '#fff', fontWeight: '700' },
});
