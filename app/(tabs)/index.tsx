import { desc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Link, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import { brews } from '@/db/schema';
import { METHODS, type BrewMethod } from '@/lib/methods';
import { Colors, Radii, Spacing } from '@/lib/theme';

export default function BrewsScreen() {
  const router = useRouter();
  const { data } = useLiveQuery(
    db.query.brews.findMany({
      with: { bean: true, grinder: true },
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
                ) : null}
              </Text>
              <Text style={styles.dateText}>
                {item.brewedAt.toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.paramsRow}>
              {item.doseG ?? '–'} g · {item.waterG ?? '–'} g · {item.waterTempC ?? '–'} °C
              {' · '}grind {item.grindSetting ?? '–'}
              {item.grinder ? ` (${item.grinder.name})` : ''}
            </Text>
            {item.isPass === false && (
              <Text style={styles.fail}>Failed</Text>
            )}
            {item.isPass === true && item.overallRating != null && (
              <Text style={styles.score}>{item.overallRating}</Text>
            )}
            {item.isPass === null && (
              <Text style={styles.unrated}>Tap to rate</Text>
            )}
          </Pressable>
        )}
      />

      <Link href="/brew/new" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>New brew</Text>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bgPage },
  list: { padding: Spacing.base, gap: Spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  muted: { color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radii.card,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1, flexShrink: 1 },
  beanName: { color: Colors.textSecondary, fontWeight: '400' },
  dateText: { fontSize: 12, color: Colors.textTertiary, marginLeft: 8, fontVariant: ['tabular-nums'] },
  paramsRow: { color: Colors.textSecondary, fontSize: 13, fontVariant: ['tabular-nums'], marginBottom: 2 },
  score:   { marginTop: 4, color: Colors.accent, fontWeight: '600', fontSize: 15, fontVariant: ['tabular-nums'] },
  fail:    { marginTop: 4, color: Colors.destructive, fontWeight: '500', fontSize: 13 },
  unrated: { marginTop: 4, color: Colors.textTertiary, fontSize: 12 },
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
