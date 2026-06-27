import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc } from 'drizzle-orm';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import { brewers } from '@/db/schema';
import { METHODS, type BrewMethod } from '@/lib/methods';

export default function BrewersScreen() {
  const { data } = useLiveQuery(db.select().from(brewers).orderBy(desc(brewers.createdAt)));

  return (
    <SafeAreaView style={styles.flex} edges={['bottom']}>
      <FlatList
        data={data}
        keyExtractor={(b) => String(b.id)}
        contentContainerStyle={data?.length ? styles.list : styles.flex}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No gear yet</Text>
            <Text style={styles.muted}>Add your machines (AeroPress, V60, espresso…) and grinders.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.muted}>
              {METHODS[item.method as BrewMethod]?.label ?? item.method}
              {item.model ? ` · ${item.model}` : ''}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fbf7f2' },
  list: { padding: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#3a2a1c' },
  muted: { color: '#8a7a6c' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 4, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#3a2a1c' },
});
