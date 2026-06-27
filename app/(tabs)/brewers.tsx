import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc } from 'drizzle-orm';
import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import { brewers, grinders } from '@/db/schema';
import { METHODS, type BrewMethod } from '@/lib/methods';

export default function GearScreen() {
  const router = useRouter();
  const { data: brewerList } = useLiveQuery(db.select().from(brewers).orderBy(desc(brewers.createdAt)));
  const { data: grinderList } = useLiveQuery(db.select().from(grinders).orderBy(desc(grinders.createdAt)));

  return (
    <SafeAreaView style={styles.flex} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Brewers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Brewers</Text>
          <Link href="/brewers/new" asChild>
            <Pressable style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </Pressable>
          </Link>
        </View>
        {brewerList && brewerList.length > 0 ? (
          brewerList.map((item) => (
            <Pressable key={item.id} style={styles.card} onPress={() => router.push(`/brewers/${item.id}`)}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.muted}>
                {METHODS[item.method as BrewMethod]?.label ?? item.method}
                {item.model ? ` · ${item.model}` : ''}
              </Text>
            </Pressable>
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.muted}>No brewers yet.</Text>
          </View>
        )}

        {/* Grinders */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Grinders</Text>
          <Link href="/grinders/new" asChild>
            <Pressable style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </Pressable>
          </Link>
        </View>
        {grinderList && grinderList.length > 0 ? (
          grinderList.map((item) => (
            <Pressable key={item.id} style={styles.card} onPress={() => router.push(`/grinders/${item.id}`)}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.muted}>
                {item.type ?? 'Grinder'}
                {item.minSetting != null && item.maxSetting != null
                  ? ` · dial ${item.minSetting}–${item.maxSetting}`
                  : ''}
              </Text>
            </Pressable>
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.muted}>No grinders yet.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fbf7f2' },
  content: { padding: 16, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#3a2a1c' },
  addBtn: {
    backgroundColor: '#7a4a2b',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 4, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#3a2a1c' },
  muted: { color: '#8a7a6c', fontSize: 13 },
  empty: { paddingVertical: 12 },
});
