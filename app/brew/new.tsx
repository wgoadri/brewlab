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
import { beans, brews, grinders } from '@/db/schema';
import { METHOD_LIST, METHODS, type BrewMethod, type ParamSpec } from '@/lib/methods';
import { setPendingBrew } from '@/lib/brewDraft';
import { ParamInput } from '@/components/ParamInput';
import { Colors, Radii, Spacing } from '@/lib/theme';

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
      shape[spec.key] = z.enum(spec.options as [string, ...string[]]).optional();
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
  const [selectedGrinderId, setSelectedGrinderId] = useState<number | null>(null);

  const { data: beanList } = useLiveQuery(db.select().from(beans).orderBy(beans.name));
  const { data: grinderList } = useLiveQuery(db.select().from(grinders).orderBy(grinders.name));

  const params = METHODS[method].params;

  const selectedGrinder = useMemo(
    () => grinderList?.find((g) => g.id === selectedGrinderId) ?? null,
    [grinderList, selectedGrinderId],
  );

  // Override the grindSetting spec with the selected grinder's own scale + unit.
  const effectiveParams = useMemo((): ParamSpec[] => {
    if (!selectedGrinder) return params;
    return params.map((spec) => {
      if (spec.key !== 'grindSetting') return spec;
      return {
        ...spec,
        min: selectedGrinder.minSetting ?? spec.min,
        max: selectedGrinder.maxSetting ?? spec.max,
        step: selectedGrinder.stepSize ?? spec.step,
        unit: selectedGrinder.settingUnit ?? spec.unit,
      };
    });
  }, [params, selectedGrinder]);

  const schema = useMemo(() => buildSchema(effectiveParams), [effectiveParams]);
  const defaultValues = useMemo(() => buildDefaults(effectiveParams), [effectiveParams]);

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

      const result = await db.insert(brews).values({
        method,
        beanId: selectedBeanId ?? undefined,
        grinderId: selectedGrinderId ?? undefined,
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

      router.replace(`/brew/${result.lastInsertRowId}`);
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
      grinderId: selectedGrinderId ?? undefined,
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

    router.replace('/brew/timer');
  });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Method */}
      <Text style={styles.sectionHeader}>Method</Text>
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
      <Text style={styles.sectionHeader}>Bean</Text>
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

      {/* Grinder */}
      <Text style={styles.sectionHeader}>Grinder</Text>
      <View style={styles.card}>
        {grinderList && grinderList.length > 0 ? (
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => setSelectedGrinderId(null)}
              style={[styles.chip, selectedGrinderId === null && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedGrinderId === null && styles.chipTextActive]}>
                None
              </Text>
            </Pressable>
            {grinderList.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => setSelectedGrinderId(g.id)}
                style={[styles.chip, selectedGrinderId === g.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedGrinderId === g.id && styles.chipTextActive]}>
                  {g.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.muted}>No grinders yet — add some in the Gear tab.</Text>
        )}
      </View>

      {/* Parameters */}
      <Text style={styles.sectionHeader}>Parameters</Text>
      <View style={[styles.card, { gap: 0 }]}>
        {effectiveParams.map((spec, idx) => (
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
      <Text style={styles.sectionHeader}>Notes</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.notesInput}
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          placeholder='Any observations about this brew…'
          placeholderTextColor={Colors.textTertiary}
          textAlignVertical='top'
        />
      </View>

      {/* CTAs */}
      <Pressable style={[styles.primaryBtn, saving && styles.btnDisabled]} onPress={onStart} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={Colors.bgSurface} />
        ) : (
          <Text style={styles.primaryBtnText}>Start brew</Text>
        )}
      </Pressable>

      <Pressable onPress={onSaveNow} disabled={saving} style={[styles.secondaryBtn, { marginTop: Spacing.md }]}>
        <Text style={styles.secondaryBtnText}>Save without timer</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bgPage },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxxl, gap: 0 },
  sectionHeader: {
    fontSize: 11, fontWeight: '500', color: Colors.textTertiary,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: Spacing.sm, marginTop: Spacing.lg, paddingHorizontal: 4,
  },
  card: { backgroundColor: Colors.bgSurface, borderRadius: Radii.card, padding: Spacing.base, gap: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radii.chip, backgroundColor: Colors.accentSubtle },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontWeight: '500', fontSize: 13 },
  chipTextActive: { color: Colors.bgSurface, fontWeight: '600', fontSize: 13 },
  paramSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, paddingTop: Spacing.md, marginTop: Spacing.md },
  muted: { color: Colors.textSecondary, fontSize: 14 },
  notesInput: { minHeight: 80, fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  primaryBtn: {
    marginTop: Spacing.xxl, backgroundColor: Colors.accent, borderRadius: Radii.button,
    paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnText: { color: Colors.bgSurface, fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: Colors.accent, borderRadius: Radii.button,
    paddingVertical: 16, alignItems: 'center', backgroundColor: 'transparent',
  },
  secondaryBtnText: { color: Colors.accent, fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  btnDisabled: { opacity: 0.4 },
});
