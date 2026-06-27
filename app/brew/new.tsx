import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as z from 'zod';

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '@/db/client';
import { beans, brews } from '@/db/schema';
import { METHOD_LIST, METHODS, type BrewMethod, type ParamSpec } from '@/lib/methods';
import { setPendingBrew } from '@/lib/brewDraft';
import { ParamInput } from '@/components/ParamInput';

// ── Zod schema builder ──────────────────────────────────────────────────────

function buildSchema(params: ParamSpec[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const spec of params) {
    if (spec.type === 'number' || spec.type === 'int') {
      let s = z.number();
      if (spec.min != null) s = s.min(spec.min);
      if (spec.max != null) s = s.max(spec.max);
      shape[spec.key] = s.optional();
    } else if (spec.type === 'enum' && spec.options && spec.options.length > 0) {
      shape[spec.key] = z
        .enum(spec.options as [string, ...string[]])
        .optional();
    } else if (spec.type === 'boolean') {
      shape[spec.key] = z.boolean().optional();
    } else {
      shape[spec.key] = z.string().optional();
    }
  }
  return z.object(shape);
}

function buildDefaults(params: ParamSpec[]): Record<string, number | string | boolean | undefined> {
  const out: Record<string, number | string | boolean | undefined> = {};
  for (const spec of params) {
    out[spec.key] = spec.default;
  }
  return out;
}

// ── Screen ──────────────────────────────────────────────────────────────────

export default function NewBrewScreen() {
  const router = useRouter();
  const [method, setMethod] = useState<BrewMethod>('aeropress');
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedBeanId, setSelectedBeanId] = useState<number | null>(null);

  const { data: beanList } = useLiveQuery(db.select().from(beans).orderBy(beans.name));

  const params = METHODS[method].params;

  const schema = useMemo(() => buildSchema(params), [params]);
  const defaultValues = useMemo(() => buildDefaults(params), [params]);

  type FormValues = z.infer<typeof schema>;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    reset(buildDefaults(METHODS[method].params));
  }, [method, reset]);

  function buildColumnsAndParams(values: FormValues): {
    columns: Record<string, number | string | boolean | undefined>;
    paramsJson: Record<string, number | string | boolean>;
    doseG: number | undefined;
    waterG: number | undefined;
    ratio: number | undefined;
  } {
    const columns: Record<string, number | string | boolean | undefined> = {};
    const paramsJson: Record<string, number | string | boolean> = {};

    for (const spec of params) {
      const val = values[spec.key];
      if (val == null) continue;
      if (spec.column) {
        columns[spec.column] = val;
      } else {
        paramsJson[spec.key] = val as number | string | boolean;
      }
    }

    const doseG = typeof columns['doseG'] === 'number' ? columns['doseG'] : undefined;
    const waterG = typeof columns['waterG'] === 'number' ? columns['waterG'] : undefined;
    const ratio = doseG != null && waterG != null && doseG > 0 ? waterG / doseG : undefined;

    return { columns, paramsJson, doseG, waterG, ratio };
  }

  const onSaveNow = handleSubmit(async (values: FormValues) => {
    setSaving(true);
    try {
      const { columns, paramsJson, doseG, waterG, ratio } = buildColumnsAndParams(values);

      await db.insert(brews).values({
        method,
        beanId: selectedBeanId ?? undefined,
        doseG,
        waterG,
        ratio,
        grindSetting:
          typeof columns['grindSetting'] === 'number' ? columns['grindSetting'] : undefined,
        waterTempC:
          typeof columns['waterTempC'] === 'number' ? columns['waterTempC'] : undefined,
        totalTimeS:
          typeof columns['totalTimeS'] === 'number' ? Math.round(columns['totalTimeS']) : undefined,
        bloomWaterG:
          typeof columns['bloomWaterG'] === 'number' ? columns['bloomWaterG'] : undefined,
        bloomTimeS:
          typeof columns['bloomTimeS'] === 'number' ? Math.round(columns['bloomTimeS']) : undefined,
        paramsJson: Object.keys(paramsJson).length > 0 ? paramsJson : undefined,
        notes: notes.trim() || undefined,
      });

      router.back();
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  });

  const onStart = handleSubmit(async (values: FormValues) => {
    const { columns, paramsJson, doseG, waterG, ratio } = buildColumnsAndParams(values);

    setPendingBrew({
      method,
      beanId: selectedBeanId ?? undefined,
      doseG,
      waterG,
      ratio,
      grindSetting:
        typeof columns['grindSetting'] === 'number' ? columns['grindSetting'] : undefined,
      waterTempC:
        typeof columns['waterTempC'] === 'number' ? columns['waterTempC'] : undefined,
      totalTimeS:
        typeof columns['totalTimeS'] === 'number' ? Math.round(columns['totalTimeS']) : undefined,
      bloomWaterG:
        typeof columns['bloomWaterG'] === 'number' ? columns['bloomWaterG'] : undefined,
      bloomTimeS:
        typeof columns['bloomTimeS'] === 'number' ? Math.round(columns['bloomTimeS']) : undefined,
      paramsJson: Object.keys(paramsJson).length > 0 ? paramsJson : undefined,
      notes: notes.trim() || undefined,
    });

    router.push('/brew/timer');
  });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Method */}
      <Text style={styles.sectionTitle}>Method</Text>
      <View style={styles.card}>
        <View style={styles.chipRow}>
          {METHOD_LIST.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setMethod(m.id)}
              style={[styles.chip, method === m.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, method === m.id && styles.chipTextActive]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Bean */}
      <Text style={styles.sectionTitle}>Bean</Text>
      <View style={styles.card}>
        {beanList && beanList.length > 0 ? (
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => setSelectedBeanId(null)}
              style={[styles.chip, selectedBeanId === null && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedBeanId === null && styles.chipTextActive]}>
                None
              </Text>
            </Pressable>
            {beanList.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => setSelectedBeanId(b.id)}
                style={[styles.chip, selectedBeanId === b.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedBeanId === b.id && styles.chipTextActive]}>
                  {b.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.muted}>No beans yet — add some in the Beans tab.</Text>
        )}
      </View>

      {/* Parameters */}
      <Text style={styles.sectionTitle}>Parameters</Text>
      <View style={styles.card}>
        {params.map((spec, idx) => (
          <View key={spec.key} style={idx > 0 ? styles.paramSep : undefined}>
            <Controller
              control={control}
              name={spec.key}
              render={({ field }) => (
                <ParamInput
                  spec={spec}
                  value={field.value as string | number | boolean | undefined}
                  onChange={field.onChange}
                  error={errors[spec.key]?.message as string | undefined}
                />
              )}
            />
          </View>
        ))}
      </View>

      {/* Notes */}
      <Text style={styles.sectionTitle}>Notes</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.notesInput}
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          placeholder='Any observations about this brew…'
          placeholderTextColor='#bbb'
          textAlignVertical='top'
        />
      </View>

      {/* Primary CTA */}
      <Pressable style={styles.saveBtn} onPress={onStart} disabled={saving}>
        {saving ? (
          <ActivityIndicator color='#fff' />
        ) : (
          <Text style={styles.saveBtnText}>Start brew →</Text>
        )}
      </Pressable>

      {/* Secondary fallback */}
      <Pressable onPress={onSaveNow} disabled={saving} style={styles.skipTimerBtn}>
        <Text style={styles.skipTimerText}>Save without timer</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fbf7f2' },
  content: { padding: 16, paddingBottom: 40, gap: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3a2a1c',
    marginTop: 12,
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eaded2',
  },
  chipActive: { backgroundColor: '#7a4a2b' },
  chipText: { color: '#5a4636', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  paramSep: { borderTopWidth: 1, borderTopColor: '#f0e8de', paddingTop: 14 },
  muted: { color: '#8a7a6c', fontSize: 14 },
  notesInput: {
    minHeight: 80,
    fontSize: 15,
    color: '#3a2a1c',
    lineHeight: 22,
  },
  saveBtn: {
    marginTop: 16,
    backgroundColor: '#7a4a2b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipTimerBtn: { alignItems: 'center', paddingVertical: 12 },
  skipTimerText: { color: '#8a7a6c', fontSize: 14 },
});
