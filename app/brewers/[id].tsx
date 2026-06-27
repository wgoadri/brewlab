import { zodResolver } from '@hookform/resolvers/zod';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

export default function EditBrewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const brewerId = Number(id);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  const { data: result, updatedAt } = useLiveQuery(
    db.select().from(brewers).where(eq(brewers.id, brewerId)).limit(1)
  );
  const item = result?.[0];

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', method: 'aeropress', model: '', notes: '' },
  });

  useEffect(() => {
    if (item && !initialized.current) {
      initialized.current = true;
      reset({
        name: item.name,
        method: item.method as BrewMethod,
        model: item.model ?? '',
        notes: item.notes ?? '',
      });
    }
  }, [item, reset]);

  const onSave = handleSubmit(async (values: FormValues) => {
    setSaving(true);
    try {
      await db.update(brewers).set({
        name: values.name,
        method: values.method,
        model: values.model || undefined,
        notes: values.notes?.trim() || undefined,
      }).where(eq(brewers.id, brewerId));
      router.back();
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  });

  function onDelete() {
    Alert.alert('Delete brewer?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.delete(brewers).where(eq(brewers.id, brewerId));
            router.back();
          } catch (err) {
            Alert.alert('Delete failed', err instanceof Error ? err.message : String(err));
          }
        },
      },
    ]);
  }

  if (updatedAt === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7a4a2b" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Brewer not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
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
      </View>

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

      <Pressable style={styles.saveBtn} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save changes</Text>}
      </Pressable>

      <Pressable style={styles.deleteBtn} onPress={onDelete} disabled={saving}>
        <Text style={styles.deleteBtnText}>Delete brewer</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fbf7f2' },
  content: { padding: 16, paddingBottom: 40, gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fbf7f2' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#3a2a1c', marginTop: 12, marginBottom: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8 },
  input: { fontSize: 15, color: '#3a2a1c', paddingVertical: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eaded2' },
  chipActive: { backgroundColor: '#7a4a2b' },
  chipText: { color: '#5a4636', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  notesInput: { minHeight: 80, fontSize: 15, color: '#3a2a1c', lineHeight: 22 },
  errorText: { color: '#b00020', fontSize: 12 },
  muted: { color: '#8a7a6c', fontSize: 14 },
  saveBtn: {
    marginTop: 16, backgroundColor: '#7a4a2b', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: {
    marginTop: 8, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#c62828',
  },
  deleteBtnText: { color: '#c62828', fontSize: 15, fontWeight: '600' },
});
