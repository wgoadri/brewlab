import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc } from 'drizzle-orm';
import { Link, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import { beans } from '@/db/schema';
import { Colors, Radii, Spacing } from '@/lib/theme';

export default function BeansScreen() {
  const router = useRouter();
  const { data } = useLiveQuery(db.select().from(beans).orderBy(desc(beans.createdAt)));

  return (
    <SafeAreaView style={styles.flex} edges={['bottom']}>
      <FlatList
        data={data}
        keyExtractor={(b) => String(b.id)}
        contentContainerStyle={data?.length ? styles.list : styles.flex}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No beans yet</Text>
            <Text style={styles.muted}>Add the coffee you&apos;re brewing so you can compare results.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/beans/${item.id}`)}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.muted}>
              {[item.roaster, item.origin, item.process].filter(Boolean).join(' · ') || 'No details yet'}
            </Text>
            {item.rating != null && (
              <Text style={styles.score}>{item.rating}</Text>
            )}
          </Pressable>
        )}
      />

      <Link href="/beans/new" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>Add bean</Text>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bgPage },
  list: { padding: Spacing.base },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radii.card,
    padding: Spacing.base,
    gap: 4,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  score: { marginTop: 4, color: Colors.accent, fontWeight: '600', fontSize: 14, fontVariant: ['tabular-nums'] },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: Radii.fab,
  },
  fabText: { color: Colors.bgSurface, fontWeight: '600', fontSize: 15, letterSpacing: 0.2 },
});
