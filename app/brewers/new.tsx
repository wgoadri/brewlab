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
import { brewers } from '@/db/schema';
import { METHOD_LIST, type BrewMethod } from '@/lib/methods';

const METHOD_VALUES = METHOD_LIST.map((m) => m.id) as [BrewMethod, ...BrewMethod[]];

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  method: z.enum(METHOD_VALUES),
  model: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewBrewerScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', method: 'aeropress', model: '', notes: '' },
  });

  const onSave = handleSubmit(async (values: FormValues) => {
    setSaving(true);
    try {
      await db.insert(brewers).values({
        name: values.name,
        method: values.method,
        model: values.model || undefined,
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
              placeholder="e.g. My AeroPress"
              placeholderTextColor="#bbb"
            />
          )}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
      </View>

      {/* Method */}
      <Text style={styles.sectionTitle}>Method</Text>
      <View style={styles.card}>
        <Controller
          control={control}
          name="method"
          render={({ field }) => (
            <View style={styles.chipRow}>
              {METHOD_LIST.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => field.onChange(m.id)}
                  style={[styles.chip, field.value === m.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, field.value === m.id && styles.chipTextActive]}>
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />
        {errors.method && <Text style={styles.errorText}>{errors.method.message}</Text>}
      </View>

      {/* Model */}
      <Text style={styles.sectionTitle}>Model</Text>
      <View style={styles.card}>
        <Controller
          control={control}
          name="model"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              placeholder="e.g. Hario V60-02"
              placeholderTextColor="#bbb"
            />
          )}
        />
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
              placeholder="Any notes about this brewer…"
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
          <Text style={styles.saveBtnText}>Save brewer</Text>
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
