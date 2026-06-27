import { desc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Link, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import { brews } from '@/db/schema';
import { METHODS, type BrewMethod } from '@/lib/methods';

export default function BrewsScreen() {
  const router = useRouter();
  const { data } = useLiveQuery(
    db.query.brews.findMany({
      with: { bean: true },
      orderBy: [desc(brews.brewedAt)],
    })
  );

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
          <Pressable style={styles.card} onPress={() => router.push(`/brew/${item.id}`)}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardTitle}>
                {METHODS[item.method as BrewMethod]?.label ?? item.method}
                {item.bean ? (
                  <Text style={styles.beanName}> · {item.bean.name}</Text>
                ) : (
                  <Text style={styles.muted}> · No bean</Text>
                )}
              </Text>
              <Text style={styles.dateText}>
                {item.brewedAt.toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.paramsRow}>
              {item.doseG ?? '–'} g · {item.waterG ?? '–'} g · {item.waterTempC ?? '–'} °C
              {' · '}grind {item.grindSetting ?? '–'}
            </Text>
            {item.overallRating != null && (
              <Text style={styles.score}>★ {item.overallRating} / 10</Text>
            )}
          </Pressable>
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
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#3a2a1c', flex: 1, flexShrink: 1 },
  beanName: { color: '#3a2a1c', fontWeight: '400' },
  dateText: { fontSize: 12, color: '#8a7a6c', marginLeft: 8 },
  paramsRow: { color: '#8a7a6c', fontSize: 13 },
  score: { marginTop: 2, color: '#7a4a2b', fontWeight: '600', fontSize: 13 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: '#7a4a2b',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
  },
  fabText: { color: '#fff', fontWeight: '700' },
});
