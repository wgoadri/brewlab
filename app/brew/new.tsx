import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { METHOD_LIST, METHODS, type BrewMethod } from '@/lib/methods';

/**
 * PLACEHOLDER. This screen shows that the method → params system is wired up.
 * Next step (great first task for Claude Code): turn `params` into a real form
 * with react-hook-form + zod, persist a row into `brews`, and offer the
 * optimizer's suggestNextBrew() as "prefill suggested parameters".
 */
export default function NewBrewScreen() {
  const [method, setMethod] = useState<BrewMethod>('aeropress');
  const def = METHODS[method];

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Text style={styles.h2}>Method</Text>
      <View style={styles.row}>
        {METHOD_LIST.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setMethod(m.id)}
            style={[styles.chip, method === m.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, method === m.id && styles.chipTextActive]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.h2}>Parameters ({def.params.length})</Text>
      {def.params.map((p) => (
        <View key={p.key} style={styles.param}>
          <Text style={styles.paramLabel}>
            {p.label}
            {p.unit ? ` (${p.unit})` : ''}
          </Text>
          <Text style={styles.muted}>
            {p.type}
            {p.optimizable ? ' · optimizable' : ''}
            {p.options ? ` · ${p.options.join(' / ')}` : ''}
            {p.min != null ? ` · ${p.min}–${p.max}` : ''}
          </Text>
        </View>
      ))}

      <Text style={styles.h2}>Default timer steps</Text>
      {def.defaultSteps.map((s, i) => (
        <Text key={i} style={styles.muted}>
          {i + 1}. {s.label}
          {s.durationSec ? ` — ${s.durationSec}s` : ''}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fbf7f2' },
  content: { padding: 16, gap: 8 },
  h2: { fontSize: 16, fontWeight: '700', color: '#3a2a1c', marginTop: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eaded2' },
  chipActive: { backgroundColor: '#7a4a2b' },
  chipText: { color: '#5a4636', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  param: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginTop: 6 },
  paramLabel: { fontWeight: '600', color: '#3a2a1c' },
  muted: { color: '#8a7a6c' },
});
