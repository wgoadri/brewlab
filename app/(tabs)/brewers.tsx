import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc } from 'drizzle-orm';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import { brewers, grinders, recipes } from '@/db/schema';
import { exportData, importData } from '@/lib/exportImport';
import { METHODS, type BrewMethod } from '@/lib/methods';
import { Colors, Radii, Spacing } from '@/lib/theme';

export default function GearScreen() {
  const router = useRouter();
  const { data: brewerList } = useLiveQuery(db.select().from(brewers).orderBy(desc(brewers.createdAt)));
  const { data: grinderList } = useLiveQuery(db.select().from(grinders).orderBy(desc(grinders.createdAt)));
  const { data: recipeList } = useLiveQuery(
    db.query.recipes.findMany({ with: { brewer: true }, orderBy: [desc(recipes.createdAt)] })
  );
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await exportData();
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    try {
      const result = await importData();
      if (result.canceled) return;
      if (result.error) {
        Alert.alert('Import failed', result.error);
        return;
      }
      const { counts } = result;
      Alert.alert(
        'Import complete',
        `Added ${counts!.beans} bean${counts!.beans !== 1 ? 's' : ''}, ` +
        `${counts!.brewers} brewer${counts!.brewers !== 1 ? 's' : ''}, ` +
        `${counts!.grinders} grinder${counts!.grinders !== 1 ? 's' : ''}, ` +
        `${counts!.brews} brew${counts!.brews !== 1 ? 's' : ''}.`,
      );
    } catch (e) {
      Alert.alert('Import failed', e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
    }
  }

  return (
    <SafeAreaView style={styles.flex} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Brewers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Brewers</Text>
          <Link href="/brewers/new" asChild>
            <Pressable><Text style={styles.addLink}>Add</Text></Pressable>
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
        <View style={[styles.sectionHeader, { marginTop: Spacing.xxl }]}>
          <Text style={styles.sectionLabel}>Grinders</Text>
          <Link href="/grinders/new" asChild>
            <Pressable><Text style={styles.addLink}>Add</Text></Pressable>
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
        {/* Recipes */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xxl }]}>
          <Text style={styles.sectionLabel}>Recipes</Text>
          <Link href="/recipes/new" asChild>
            <Pressable><Text style={styles.addLink}>Add</Text></Pressable>
          </Link>
        </View>
        {recipeList && recipeList.length > 0 ? (
          recipeList.map((item) => (
            <Pressable key={item.id} style={styles.card} onPress={() => router.push(`/recipes/${item.id}`)}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.muted}>
                {METHODS[item.method as BrewMethod]?.label ?? item.method}
                {item.brewer ? ` · ${item.brewer.name}` : ''}
                {` · ${item.stepsJson.length} step${item.stepsJson.length !== 1 ? 's' : ''}`}
              </Text>
            </Pressable>
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.muted}>No recipes yet — the timer uses each method’s default steps.</Text>
          </View>
        )}

        {/* Data */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xxl }]}>
          <Text style={styles.sectionLabel}>Data</Text>
        </View>
        <Text style={styles.dataHint}>
          Import adds to existing data — it never deletes.
        </Text>
        <View style={styles.dataRow}>
          <Pressable
            style={[styles.dataBtn, exporting && styles.dataBtnDisabled]}
            onPress={handleExport}
            disabled={exporting || importing}
          >
            {exporting ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <Text style={styles.dataBtnText}>Export backup</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.dataBtn, importing && styles.dataBtnDisabled]}
            onPress={handleImport}
            disabled={exporting || importing}
          >
            {importing ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <Text style={styles.dataBtnText}>Import backup</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bgPage },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  addLink: { fontSize: 14, fontWeight: '500', color: Colors.accent },
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
  muted: { color: Colors.textSecondary, fontSize: 13 },
  empty: { paddingVertical: Spacing.sm },
  dataHint: { fontSize: 12, color: Colors.textTertiary, marginBottom: Spacing.sm },
  dataRow: { flexDirection: 'row', gap: Spacing.sm },
  dataBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: Radii.button,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
  },
  dataBtnDisabled: { opacity: 0.4 },
  dataBtnText: { fontSize: 14, fontWeight: '600', color: Colors.accent },
});
