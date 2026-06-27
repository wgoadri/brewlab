import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { db } from '@/db/client';
import { brews } from '@/db/schema';
import { METHODS, type BrewMethod, type ParamSpec } from '@/lib/methods';
import type { Brew } from '@/db/schema';

function getParamValue(brew: Brew, spec: ParamSpec): string {
  const raw = spec.column != null
    ? (brew[spec.column] as number | string | boolean | null | undefined)
    : (brew.paramsJson?.[spec.key] as number | string | boolean | null | undefined);
  return raw != null ? String(raw) : '–';
}

export default function BrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: brew, updatedAt } = useLiveQuery(
    db.query.brews.findFirst({
      where: eq(brews.id, Number(id)),
      with: { bean: true },
    })
  );

  if (updatedAt === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7a4a2b" />
      </View>
    );
  }

  if (!brew) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Brew not found</Text>
      </View>
    );
  }

  const methodDef = METHODS[brew.method as BrewMethod];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header card */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.card}>
        <Text style={styles.methodLabel}>{methodDef?.label ?? brew.method}</Text>
        <Text style={styles.beanName}>
          {brew.bean ? brew.bean.name : 'No bean selected'}
        </Text>
        <Text style={styles.muted}>{brew.brewedAt.toLocaleDateString()}</Text>
      </View>

      {/* Parameters card */}
      {methodDef && (
        <>
          <Text style={styles.sectionTitle}>Parameters</Text>
          <View style={styles.card}>
            {methodDef.params.map((spec, idx) => (
              <View key={spec.key} style={[styles.paramRow, idx > 0 && styles.paramSep]}>
                <Text style={styles.paramLabel}>{spec.label}</Text>
                <Text style={styles.paramValue}>
                  {getParamValue(brew, spec)}{spec.unit ? ` ${spec.unit}` : ''}
                </Text>
              </View>
            ))}
            {brew.ratio != null && (
              <View style={[styles.paramRow, styles.paramSep]}>
                <Text style={styles.paramLabel}>Ratio</Text>
                <Text style={styles.paramValue}>1 : {brew.ratio.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* Notes card */}
      {brew.notes != null && brew.notes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>{brew.notes}</Text>
          </View>
        </>
      )}

      {/* Rating card */}
      <Text style={styles.sectionTitle}>Rating</Text>
      <View style={styles.card}>
        {brew.isPass === null || brew.isPass === undefined ? (
          <>
            <Text style={styles.muted}>Not rated yet</Text>
            <Pressable
              style={styles.rateBtn}
              onPress={() => router.push({ pathname: '/brew/rate', params: { id: brew.id } })}
            >
              <Text style={styles.rateBtnText}>Rate this brew →</Text>
            </Pressable>
          </>
        ) : brew.isPass === false ? (
          <>
            <Text style={{ color: '#c62828', fontWeight: '700', fontSize: 16 }}>❌ Failed</Text>
            {brew.failReasonsJson?.map(r => (
              <Text key={r} style={styles.muted}>• {r}</Text>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.ratingText}>★ {brew.overallRating} / 10</Text>
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
                    style={{ backgroundColor: '#eaded2', borderRadius: 12,
                             paddingHorizontal: 10, paddingVertical: 4 }}
                  >
                    <Text style={{ fontSize: 12, color: '#5a4636' }}>{d}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fbf7f2' },
  content: { padding: 16, paddingBottom: 40, gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fbf7f2' },
  notFoundText: { fontSize: 16, color: '#8a7a6c' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3a2a1c',
    marginTop: 12,
    marginBottom: 4,
  },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 6 },
  methodLabel: { fontSize: 20, fontWeight: '700', color: '#3a2a1c' },
  beanName: { fontSize: 15, color: '#8a7a6c' },
  muted: { color: '#8a7a6c', fontSize: 14 },
  paramRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paramSep: { borderTopWidth: 1, borderTopColor: '#f0e8de', paddingTop: 8, marginTop: 2 },
  paramLabel: { fontSize: 14, color: '#8a7a6c', flex: 1 },
  paramValue: { fontSize: 14, fontWeight: '600', color: '#3a2a1c', textAlign: 'right' },
  notesText: { fontSize: 14, color: '#3a2a1c', lineHeight: 21 },
  ratingText: { fontSize: 18, fontWeight: '700', color: '#7a4a2b' },
  rateBtn: {
    marginTop: 8, backgroundColor: '#7a4a2b', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start',
  },
  rateBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
