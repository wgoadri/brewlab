import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { db } from '@/db/client';
import { brews } from '@/db/schema';
import { setSuggestion } from '@/lib/brewSuggestion';
import { METHODS, paramValuesFromBrew, type BrewMethod, type ParamSpec } from '@/lib/methods';
import { Colors, Radii, Spacing } from '@/lib/theme';
import type { Brew } from '@/db/schema';

function getParamValue(brew: Brew, spec: ParamSpec): { value: string; unit: string } {
  const raw = spec.column != null
    ? (brew[spec.column] as number | string | boolean | null | undefined)
    : (brew.paramsJson?.[spec.key] as number | string | boolean | null | undefined);
  return {
    value: raw != null ? String(raw) : '–',
    unit: spec.unit ?? '',
  };
}

export default function BrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: brew, updatedAt } = useLiveQuery(
    db.query.brews.findFirst({
      where: eq(brews.id, Number(id)),
      with: { bean: true, grinder: true, recipe: true },
    })
  );

  if (updatedAt === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!brew) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Brew not found.</Text>
      </View>
    );
  }

  const methodDef = METHODS[brew.method as BrewMethod];

  function onBrewAgain() {
    if (!brew || !methodDef) return;
    setSuggestion({
      method: brew.method as BrewMethod,
      beanId: brew.beanId ?? undefined,
      grinderId: brew.grinderId ?? undefined,
      params: paramValuesFromBrew(brew, brew.method as BrewMethod),
      rationale: `Copied from your brew of ${brew.brewedAt.toLocaleDateString()}`,
    });
    router.push('/brew/new');
  }

  function onDelete() {
    Alert.alert('Delete brew?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.delete(brews).where(eq(brews.id, Number(id)));
            router.back();
          } catch (err) {
            Alert.alert('Delete failed', err instanceof Error ? err.message : String(err));
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Overview */}
      <Text style={styles.sectionHeader}>Overview</Text>
      <View style={styles.card}>
        <Text style={styles.methodLabel}>{methodDef?.label ?? brew.method}</Text>
        <Text style={styles.beanName}>
          {brew.bean ? brew.bean.name : 'No bean selected'}
        </Text>
        {brew.grinder && (
          <Text style={styles.beanName}>
            {brew.grinder.name}
            {brew.grindSetting != null
              ? ` · ${brew.grindSetting}${brew.grinder.settingUnit ? ` ${brew.grinder.settingUnit}` : ''}`
              : ''}
          </Text>
        )}
        {brew.recipe && <Text style={styles.beanName}>Recipe: {brew.recipe.name}</Text>}
        <Text style={styles.dateText}>{brew.brewedAt.toLocaleDateString()}</Text>
      </View>

      {/* Parameters */}
      {methodDef && (
        <>
          <Text style={styles.sectionHeader}>Parameters</Text>
          <View style={[styles.card, { paddingVertical: 0, paddingHorizontal: Spacing.base }]}>
            {methodDef.params.map((spec, idx) => {
              const { value, unit } = getParamValue(brew, spec);
              return (
                <View key={spec.key}>
                  {idx > 0 && <View style={styles.paramSep} />}
                  <View style={styles.paramRow}>
                    <Text style={styles.paramLabel}>{spec.label}</Text>
                    <View style={styles.paramValueRow}>
                      <Text style={styles.paramValue}>{value}</Text>
                      {unit ? <Text style={styles.paramUnit}>{unit}</Text> : null}
                    </View>
                  </View>
                </View>
              );
            })}
            {brew.ratio != null && (
              <View>
                <View style={styles.paramSep} />
                <View style={styles.paramRow}>
                  <Text style={styles.paramLabel}>Ratio</Text>
                  <View style={styles.paramValueRow}>
                    <Text style={styles.paramValue}>1 : {brew.ratio.toFixed(1)}</Text>
                  </View>
                </View>
              </View>
            )}
            {brew.finalYieldG != null && (
              <View>
                <View style={styles.paramSep} />
                <View style={styles.paramRow}>
                  <Text style={styles.paramLabel}>Final yield</Text>
                  <View style={styles.paramValueRow}>
                    <Text style={styles.paramValue}>{brew.finalYieldG}</Text>
                    <Text style={styles.paramUnit}>g</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </>
      )}

      {/* Notes */}
      {brew.notes != null && brew.notes.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>{brew.notes}</Text>
          </View>
        </>
      )}

      {/* Rating */}
      <Text style={styles.sectionHeader}>Rating</Text>
      <View style={styles.card}>
        {brew.isPass === null || brew.isPass === undefined ? (
          <>
            <Text style={styles.muted}>Not rated yet.</Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push({ pathname: '/brew/rate', params: { id: brew.id } })}
            >
              <Text style={styles.primaryBtnText}>Rate this brew</Text>
            </Pressable>
          </>
        ) : brew.isPass === false ? (
          <>
            <Text style={styles.failLabel}>Failed</Text>
            {brew.failReasonsJson?.map(r => (
              <Text key={r} style={styles.muted}>· {r}</Text>
            ))}
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={styles.scoreDisplay}>{brew.overallRating}</Text>
              <Text style={styles.scoreSuffix}>/10</Text>
            </View>
            {brew.harmony != null && (
              <Text style={styles.muted}>Harmony: {brew.harmony} / 5</Text>
            )}
            {brew.brewIntent && (
              <Text style={styles.muted}>
                Brew again: {brew.brewIntent.replace('-', ' ')}
              </Text>
            )}
            {brew.tastingJson &&
              Object.entries(brew.tastingJson).map(([k, v]) => (
                <Text key={k} style={styles.muted}>{k}: {v}/10</Text>
              ))}
            {brew.descriptorsJson && brew.descriptorsJson.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {brew.descriptorsJson.map(d => (
                  <View
                    key={d}
                    style={{ backgroundColor: Colors.accentSubtle, borderRadius: Radii.chip,
                             paddingHorizontal: 10, paddingVertical: 4 }}
                  >
                    <Text style={{ fontSize: 12, color: Colors.textSecondary }}>{d}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      {/* Actions */}
      {methodDef && (
        <>
          <Pressable style={styles.brewAgainBtn} onPress={onBrewAgain}>
            <Text style={styles.brewAgainBtnText}>Brew again</Text>
          </Pressable>
          <Pressable
            style={styles.editBtn}
            onPress={() => router.push({ pathname: '/brew/edit', params: { id: brew.id } })}
          >
            <Text style={styles.editBtnText}>Edit brew</Text>
          </Pressable>
        </>
      )}
      <Pressable style={styles.destructiveBtn} onPress={onDelete}>
        <Text style={styles.destructiveBtnText}>Delete brew</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bgPage },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxxl, gap: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgPage },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: 4,
  },
  card: { backgroundColor: Colors.bgSurface, borderRadius: Radii.card, padding: Spacing.base, gap: 6 },
  methodLabel: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  beanName: { fontSize: 15, color: Colors.textSecondary },
  dateText: { fontSize: 12, color: Colors.textTertiary, fontVariant: ['tabular-nums'] },
  muted: { color: Colors.textSecondary, fontSize: 14 },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paramSep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  paramLabel: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, flex: 1, letterSpacing: 0.1 },
  paramValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  paramValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, fontVariant: ['tabular-nums'], textAlign: 'right' },
  paramUnit: { fontSize: 12, fontWeight: '400', color: Colors.textTertiary },
  notesText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
  scoreDisplay: { fontSize: 28, fontWeight: '700', color: Colors.accent, fontVariant: ['tabular-nums'] },
  scoreSuffix: { fontSize: 14, color: Colors.textTertiary },
  failLabel: { color: Colors.destructive, fontWeight: '600', fontSize: 16 },
  primaryBtn: {
    marginTop: 8, backgroundColor: Colors.accent, borderRadius: Radii.button,
    paddingVertical: 12, paddingHorizontal: 16, alignSelf: 'flex-start',
  },
  primaryBtnText: { color: Colors.bgSurface, fontWeight: '600', fontSize: 14, letterSpacing: 0.2 },
  brewAgainBtn: {
    marginTop: Spacing.lg, backgroundColor: Colors.accent, borderRadius: Radii.button,
    paddingVertical: 14, alignItems: 'center',
  },
  brewAgainBtnText: { color: Colors.bgSurface, fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  editBtn: {
    marginTop: Spacing.sm, borderRadius: Radii.button, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.accent,
  },
  editBtnText: { color: Colors.accent, fontSize: 15, fontWeight: '500' },
  destructiveBtn: {
    marginTop: Spacing.sm, borderRadius: Radii.button, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.destructive,
  },
  destructiveBtnText: { color: Colors.destructive, fontSize: 15, fontWeight: '500' },
});
