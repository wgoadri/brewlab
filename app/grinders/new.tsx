import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { db } from '@/db/client';
import { grinders } from '@/db/schema';
import { Colors, Radii, Spacing } from '@/lib/theme';

const GRINDER_TYPES = [
  { id: 'burr', label: 'Burr' },
  { id: 'blade', label: 'Blade' },
  { id: 'hand', label: 'Hand' },
] as const;

type GrinderType = (typeof GRINDER_TYPES)[number]['id'];

const UNIT_PRESETS = ['clicks', 'number', 'μm', 'steps'];

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['burr', 'blade', 'hand']).optional(),
  minSetting: z.number().optional(),
  maxSetting: z.number().optional(),
  stepSize: z.number().optional(),
  settingUnit: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewGrinderScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, setValue, watch, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', settingUnit: '', notes: '' },
  });

  const selectedType = watch('type');
  const settingUnitValue = watch('settingUnit');

  const onSave = handleSubmit(async (values: FormValues) => {
    setSaving(true);
    try {
      await db.insert(grinders).values({
        name: values.name,
        type: values.type ?? undefined,
        minSetting: values.minSetting ?? undefined,
        maxSetting: values.maxSetting ?? undefined,
        stepSize: values.stepSize ?? undefined,
        settingUnit: values.settingUnit?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      });
      router.back();
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>Name</Text>
      <View style={styles.card}>
        <Controller control={control} name="name" render={({ field }) => (
          <TextInput style={styles.input} value={field.value} onChangeText={field.onChange}
            placeholder="e.g. Comandante C40" placeholderTextColor={Colors.textTertiary} />
        )} />
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
      </View>

      <Text style={styles.sectionHeader}>Type</Text>
      <View style={styles.card}>
        <View style={styles.chipRow}>
          {GRINDER_TYPES.map((t) => (
            <Pressable key={t.id} onPress={() => setValue('type', t.id as GrinderType)}
              style={[styles.chip, selectedType === t.id && styles.chipActive]}>
              <Text style={[styles.chipText, selectedType === t.id && styles.chipTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.sectionHeader}>Dial Scale (optional)</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>
          The optimizer uses these bounds when suggesting grind settings. Leave blank if your grinder has no numbered scale.
        </Text>
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Min</Text>
            <Controller control={control} name="minSetting" render={({ field }) => (
              <TextInput style={styles.input} keyboardType="decimal-pad"
                value={field.value != null ? String(field.value) : ''}
                onChangeText={(t) => field.onChange(t === '' ? undefined : Number(t))}
                placeholder="0" placeholderTextColor={Colors.textTertiary} />
            )} />
          </View>
          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Max</Text>
            <Controller control={control} name="maxSetting" render={({ field }) => (
              <TextInput style={styles.input} keyboardType="decimal-pad"
                value={field.value != null ? String(field.value) : ''}
                onChangeText={(t) => field.onChange(t === '' ? undefined : Number(t))}
                placeholder="40" placeholderTextColor={Colors.textTertiary} />
            )} />
          </View>
          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Step</Text>
            <Controller control={control} name="stepSize" render={({ field }) => (
              <TextInput style={styles.input} keyboardType="decimal-pad"
                value={field.value != null ? String(field.value) : ''}
                onChangeText={(t) => field.onChange(t === '' ? undefined : Number(t))}
                placeholder="1" placeholderTextColor={Colors.textTertiary} />
            )} />
          </View>
        </View>
        <View>
          <Text style={styles.fieldLabel}>Unit</Text>
          <View style={styles.chipRow}>
            {UNIT_PRESETS.map((u) => (
              <Pressable key={u} onPress={() => setValue('settingUnit', u)}
                style={[styles.chip, settingUnitValue === u && styles.chipActive]}>
                <Text style={[styles.chipText, settingUnitValue === u && styles.chipTextActive]}>{u}</Text>
              </Pressable>
            ))}
          </View>
          <Controller control={control} name="settingUnit" render={({ field }) => (
            <TextInput style={[styles.input, { marginTop: 6 }]}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              placeholder="or type your own…"
              placeholderTextColor={Colors.textTertiary} />
          )} />
        </View>
      </View>

      <Text style={styles.sectionHeader}>Notes</Text>
      <View style={styles.card}>
        <Controller control={control} name="notes" render={({ field }) => (
          <TextInput style={styles.notesInput} multiline numberOfLines={4}
            value={field.value} onChangeText={field.onChange}
            placeholder="Any notes about this grinder…" placeholderTextColor={Colors.textTertiary}
            textAlignVertical="top" />
        )} />
      </View>

      <Pressable style={[styles.primaryBtn, saving && styles.btnDisabled]} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color={Colors.bgSurface} /> : <Text style={styles.primaryBtnText}>Save grinder</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bgPage },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxxl, gap: 0 },
  sectionHeader: {
    fontSize: 11, fontWeight: '500', color: Colors.textTertiary, letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: Spacing.sm, marginTop: Spacing.lg, paddingHorizontal: 4,
  },
  card: { backgroundColor: Colors.bgSurface, borderRadius: Radii.card, padding: Spacing.base, gap: Spacing.sm },
  input: { fontSize: 15, color: Colors.textPrimary, paddingVertical: 4 },
  hint: { fontSize: 12, fontStyle: 'italic', color: Colors.textTertiary },
  row: { flexDirection: 'row', gap: Spacing.md },
  rowField: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, letterSpacing: 0.1, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radii.chip, backgroundColor: Colors.accentSubtle },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontWeight: '500', fontSize: 13 },
  chipTextActive: { color: Colors.bgSurface, fontWeight: '600', fontSize: 13 },
  notesInput: { minHeight: 80, fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  errorText: { color: Colors.destructive, fontSize: 12 },
  primaryBtn: {
    marginTop: Spacing.xxl, backgroundColor: Colors.accent, borderRadius: Radii.button,
    paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnText: { color: Colors.bgSurface, fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  btnDisabled: { opacity: 0.4 },
});
