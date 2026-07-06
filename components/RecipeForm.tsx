import { useMemo, useState } from 'react';
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

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '@/db/client';
import { brewers, type RecipeStep } from '@/db/schema';
import { METHOD_LIST, METHODS, type BrewMethod } from '@/lib/methods';
import { Colors, Radii, Spacing } from '@/lib/theme';

export interface RecipeFormValues {
  name: string;
  method: BrewMethod;
  brewerId: number | null;
  steps: RecipeStep[];
  notes: string;
}

export interface RecipeFormProps {
  initial?: RecipeFormValues;
  /** Editing an existing recipe keeps its method fixed. */
  lockMethod?: boolean;
  submitLabel: string;
  onSubmit: (values: RecipeFormValues) => Promise<void> | void;
}

/** Editable step row state: durations kept as text while typing. */
type StepRow = { label: string; durationText: string; instruction: string };

function toRows(steps: RecipeStep[]): StepRow[] {
  return steps.map((s) => ({
    label: s.label,
    durationText: s.durationSec != null ? String(s.durationSec) : '',
    instruction: s.instruction ?? '',
  }));
}

function toSteps(rows: StepRow[]): RecipeStep[] {
  return rows
    .filter((r) => r.label.trim().length > 0)
    .map((r) => {
      const parsed = parseInt(r.durationText.trim(), 10);
      return {
        label: r.label.trim(),
        durationSec: Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
        instruction: r.instruction.trim() || undefined,
      };
    });
}

export function RecipeForm({ initial, lockMethod = false, submitLabel, onSubmit }: RecipeFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [method, setMethod] = useState<BrewMethod>(initial?.method ?? 'aeropress');
  const [brewerId, setBrewerId] = useState<number | null>(initial?.brewerId ?? null);
  const [rows, setRows] = useState<StepRow[]>(
    toRows(initial?.steps ?? METHODS[initial?.method ?? 'aeropress'].defaultSteps),
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const { data: brewerList } = useLiveQuery(db.select().from(brewers).orderBy(brewers.name));
  const methodBrewers = useMemo(
    () => brewerList?.filter((b) => b.method === method) ?? [],
    [brewerList, method],
  );

  function switchMethod(m: BrewMethod) {
    if (m === method) return;
    setMethod(m);
    setBrewerId(null); // pinned brewer no longer matches
    setRows(toRows(METHODS[m].defaultSteps)); // re-seed steps from the new method
  }

  function updateRow(idx: number, patch: Partial<StepRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function moveRow(idx: number, dir: -1 | 1) {
    setRows((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function addRow() {
    setRows((prev) => [...prev, { label: '', durationText: '', instruction: '' }]);
  }

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Give this recipe a name.');
      return;
    }
    const steps = toSteps(rows);
    if (steps.length === 0) {
      Alert.alert('Steps required', 'A recipe needs at least one step with a label.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ name: trimmedName, method, brewerId, steps, notes: notes.trim() });
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Name */}
      <Text style={styles.sectionHeader}>Name</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder='e.g. Slow bloom V60'
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* Method */}
      {!lockMethod && (
        <>
          <Text style={styles.sectionHeader}>Method</Text>
          <View style={styles.card}>
            <View style={styles.chipRow}>
              {METHOD_LIST.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => switchMethod(m.id)}
                  style={[styles.chip, method === m.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, method === m.id && styles.chipTextActive]}>
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Brewer pin */}
      <Text style={styles.sectionHeader}>Machine (optional)</Text>
      <View style={styles.card}>
        {methodBrewers.length > 0 ? (
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => setBrewerId(null)}
              style={[styles.chip, brewerId === null && styles.chipActive]}
            >
              <Text style={[styles.chipText, brewerId === null && styles.chipTextActive]}>
                Any {METHODS[method].label}
              </Text>
            </Pressable>
            {methodBrewers.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => setBrewerId(b.id)}
                style={[styles.chip, brewerId === b.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, brewerId === b.id && styles.chipTextActive]}>
                  {b.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.muted}>
            No {METHODS[method].label} brewers yet — recipe applies to the method.
          </Text>
        )}
      </View>

      {/* Steps */}
      <Text style={styles.sectionHeader}>Steps</Text>
      {rows.map((row, idx) => (
        <View key={idx} style={styles.stepCard}>
          <View style={styles.stepHeaderRow}>
            <Text style={styles.stepIndex}>{idx + 1}</Text>
            <View style={styles.stepHeaderActions}>
              <Pressable
                onPress={() => moveRow(idx, -1)}
                disabled={idx === 0}
                style={styles.stepActionBtn}
              >
                <Text style={[styles.stepAction, idx === 0 && styles.stepActionDisabled]}>↑</Text>
              </Pressable>
              <Pressable
                onPress={() => moveRow(idx, 1)}
                disabled={idx === rows.length - 1}
                style={styles.stepActionBtn}
              >
                <Text
                  style={[
                    styles.stepAction,
                    idx === rows.length - 1 && styles.stepActionDisabled,
                  ]}
                >
                  ↓
                </Text>
              </Pressable>
              <Pressable onPress={() => removeRow(idx)} style={styles.stepActionBtn}>
                <Text style={styles.stepRemove}>✕</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.stepFieldRow}>
            <TextInput
              style={[styles.textInput, styles.stepLabelInput]}
              value={row.label}
              onChangeText={(t) => updateRow(idx, { label: t })}
              placeholder='Step name (e.g. Bloom)'
              placeholderTextColor={Colors.textTertiary}
            />
            <View style={styles.durationBox}>
              <TextInput
                style={styles.durationInput}
                value={row.durationText}
                onChangeText={(t) => updateRow(idx, { durationText: t })}
                keyboardType='numeric'
                placeholder='–'
                placeholderTextColor={Colors.textTertiary}
              />
              <Text style={styles.durationUnit}>s</Text>
            </View>
          </View>
          <TextInput
            style={[styles.textInput, styles.instructionInput]}
            value={row.instruction}
            onChangeText={(t) => updateRow(idx, { instruction: t })}
            placeholder='Instruction, e.g. Pour {bloomWaterG}g of water'
            placeholderTextColor={Colors.textTertiary}
            multiline
          />
        </View>
      ))}
      <Pressable style={styles.addStepBtn} onPress={addRow}>
        <Text style={styles.addStepText}>+ Add step</Text>
      </Pressable>
      <Text style={styles.templateHint}>
        Instructions may use {'{paramKey}'} placeholders (e.g. {'{doseG}'}, {'{waterTempC}'},
        {' {bloomWaterG}'}) — filled in from the brew’s parameters during the timer.
      </Text>

      {/* Notes */}
      <Text style={styles.sectionHeader}>Notes</Text>
      <View style={styles.card}>
        <TextInput
          style={[styles.textInput, styles.notesInput]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder='Source, tips, when to use this recipe…'
          placeholderTextColor={Colors.textTertiary}
          textAlignVertical='top'
        />
      </View>

      <Pressable
        style={[styles.primaryBtn, saving && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={Colors.bgSurface} />
        ) : (
          <Text style={styles.primaryBtnText}>{submitLabel}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bgPage },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
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
  muted: { color: Colors.textSecondary, fontSize: 14 },
  textInput: { fontSize: 15, color: Colors.textPrimary },
  notesInput: { minHeight: 80, lineHeight: 22 },
  // Steps
  stepCard: {
    backgroundColor: Colors.bgSurface, borderRadius: Radii.card, padding: Spacing.base,
    marginBottom: Spacing.sm, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  stepHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepIndex: { fontSize: 13, fontWeight: '700', color: Colors.textTertiary, fontVariant: ['tabular-nums'] },
  stepHeaderActions: { flexDirection: 'row', gap: 4 },
  stepActionBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  stepAction: { fontSize: 16, color: Colors.accent, fontWeight: '600' },
  stepActionDisabled: { color: Colors.border },
  stepRemove: { fontSize: 14, color: Colors.destructive, fontWeight: '600' },
  stepFieldRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  stepLabelInput: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.input,
    paddingHorizontal: 12, paddingVertical: 8, fontWeight: '600',
  },
  durationBox: {
    flexDirection: 'row', alignItems: 'baseline', gap: 3, borderWidth: 1,
    borderColor: Colors.border, borderRadius: Radii.input, paddingHorizontal: 12, paddingVertical: 8,
  },
  durationInput: {
    fontSize: 15, fontWeight: '600', color: Colors.textPrimary,
    fontVariant: ['tabular-nums'], minWidth: 36, textAlign: 'right', padding: 0,
  },
  durationUnit: { fontSize: 12, color: Colors.textTertiary },
  instructionInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.input,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, minHeight: 40,
  },
  addStepBtn: {
    borderWidth: 1.5, borderColor: Colors.accent, borderRadius: Radii.button,
    borderStyle: 'dashed', paddingVertical: 12, alignItems: 'center', marginBottom: Spacing.sm,
  },
  addStepText: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  templateHint: { fontSize: 12, color: Colors.textTertiary, lineHeight: 17, paddingHorizontal: 4 },
  primaryBtn: {
    marginTop: Spacing.xxl, backgroundColor: Colors.accent, borderRadius: Radii.button,
    paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnText: { color: Colors.bgSurface, fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  btnDisabled: { opacity: 0.4 },
});
