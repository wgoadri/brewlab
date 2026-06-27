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

const GRINDER_TYPES = [
  { id: 'burr', label: 'Burr' },
  { id: 'blade', label: 'Blade' },
  { id: 'hand', label: 'Hand' },
] as const;

type GrinderType = (typeof GRINDER_TYPES)[number]['id'];

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['burr', 'blade', 'hand']).optional(),
  minSetting: z.number().optional(),
  maxSetting: z.number().optional(),
  stepSize: z.number().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewGrinderScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', notes: '' },
  });

  const selectedType = watch('type');

  const onSave = handleSubmit(async (values: FormValues) => {
    setSaving(true);
    try {
      await db.insert(grinders).values({
        name: values.name,
        type: values.type ?? undefined,
        minSetting: values.minSetting ?? undefined,
        maxSetting: values.maxSetting ?? undefined,
        stepSize: values.stepSize ?? undefined,
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
      {/* Name */}
      <Text style={styles.sectionTitle}>Name</Text>
      <View style={styles.card}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              placeholder="e.g. Comandante C40"
              placeholderTextColor="#bbb"
            />
          )}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
      </View>

      {/* Type */}
      <Text style={styles.sectionTitle}>Type</Text>
      <View style={styles.card}>
        <View style={styles.chipRow}>
          {GRINDER_TYPES.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setValue('type', t.id as GrinderType)}
              style={[styles.chip, selectedType === t.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedType === t.id && styles.chipTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Dial scale */}
      <Text style={styles.sectionTitle}>Dial Scale (optional)</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>
          Helps the optimizer stay within valid grind settings for this grinder.
        </Text>
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Min</Text>
            <Controller
              control={control}
              name="minSetting"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  value={field.value != null ? String(field.value) : ''}
                  onChangeText={(t) => field.onChange(t === '' ? undefined : Number(t))}
                  placeholder="0"
                  placeholderTextColor="#bbb"
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>
          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Max</Text>
            <Controller
              control={control}
              name="maxSetting"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  value={field.value != null ? String(field.value) : ''}
                  onChangeText={(t) => field.onChange(t === '' ? undefined : Number(t))}
                  placeholder="40"
                  placeholderTextColor="#bbb"
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>
          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Step</Text>
            <Controller
              control={control}
              name="stepSize"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  value={field.value != null ? String(field.value) : ''}
                  onChangeText={(t) => field.onChange(t === '' ? undefined : Number(t))}
                  placeholder="1"
                  placeholderTextColor="#bbb"
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>
        </View>
      </View>

      {/* Notes */}
      <Text style={styles.sectionTitle}>Notes</Text>
      <View style={styles.card}>
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={4}
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Any notes about this grinder…"
              placeholderTextColor="#bbb"
              textAlignVertical="top"
            />
          )}
        />
      </View>

      {/* Save */}
      <Pressable style={styles.saveBtn} onPress={onSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save grinder</Text>
        )}
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
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8 },
  input: { fontSize: 15, color: '#3a2a1c', paddingVertical: 4 },
  hint: { color: '#8a7a6c', fontSize: 13 },
  row: { flexDirection: 'row', gap: 12 },
  rowField: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#8a7a6c', marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eaded2' },
  chipActive: { backgroundColor: '#7a4a2b' },
  chipText: { color: '#5a4636', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  notesInput: { minHeight: 80, fontSize: 15, color: '#3a2a1c', lineHeight: 22 },
  errorText: { color: '#b00020', fontSize: 12 },
  saveBtn: {
    marginTop: 16,
    backgroundColor: '#7a4a2b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
