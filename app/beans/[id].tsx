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
import { beans } from '@/db/schema';
import { Colors, Radii, Spacing } from '@/lib/theme';

const PROCESS_OPTIONS = ['washed', 'natural', 'honey', 'anaerobic', 'other'] as const;
const ROAST_LEVEL_OPTIONS = ['light', 'medium-light', 'medium', 'medium-dark', 'dark'] as const;

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  roaster: z.string().optional(),
  shop: z.string().optional(),
  origin: z.string().optional(),
  process: z.enum(PROCESS_OPTIONS).optional(),
  roastLevel: z.enum(ROAST_LEVEL_OPTIONS).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditBeanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const beanId = Number(id);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  const { data: bean, updatedAt } = useLiveQuery(
    db.select().from(beans).where(eq(beans.id, beanId)).limit(1)
  );
  const item = bean?.[0];

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', roaster: '', shop: '', origin: '', notes: '' },
  });

  useEffect(() => {
    if (item && !initialized.current) {
      initialized.current = true;
      reset({
        name: item.name,
        roaster: item.roaster ?? '',
        shop: item.shop ?? '',
        origin: item.origin ?? '',
        process: (item.process as FormValues['process']) ?? undefined,
        roastLevel: (item.roastLevel as FormValues['roastLevel']) ?? undefined,
        notes: item.notes ?? '',
      });
    }
  }, [item, reset]);

  const onSave = handleSubmit(async (values: FormValues) => {
    setSaving(true);
    try {
      await db.update(beans).set({
        name: values.name,
        roaster: values.roaster || undefined,
        shop: values.shop || undefined,
        origin: values.origin || undefined,
        process: values.process || undefined,
        roastLevel: values.roastLevel || undefined,
        notes: values.notes?.trim() || undefined,
      }).where(eq(beans.id, beanId));
      router.back();
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  });

  function onDelete() {
    Alert.alert('Delete bean?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await db.delete(beans).where(eq(beans.id, beanId));
          router.back();
        } catch (err) {
          Alert.alert('Delete failed', err instanceof Error ? err.message : String(err));
        }
      }},
    ]);
  }

  if (updatedAt === undefined) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  }
  if (!item) {
    return <View style={styles.center}><Text style={styles.muted}>Bean not found.</Text></View>;
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>Name</Text>
      <View style={styles.card}>
        <Controller control={control} name="name" render={({ field }) => (
          <TextInput style={styles.input} value={field.value} onChangeText={field.onChange}
            placeholder="e.g. Ethiopia Yirgacheffe" placeholderTextColor={Colors.textTertiary} />
        )} />
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
      </View>

      <Text style={styles.sectionHeader}>Roaster</Text>
      <View style={styles.card}>
        <Controller control={control} name="roaster" render={({ field }) => (
          <TextInput style={styles.input} value={field.value} onChangeText={field.onChange}
            placeholder="e.g. Square Mile" placeholderTextColor={Colors.textTertiary} />
        )} />
      </View>

      <Text style={styles.sectionHeader}>Shop</Text>
      <View style={styles.card}>
        <Controller control={control} name="shop" render={({ field }) => (
          <TextInput style={styles.input} value={field.value} onChangeText={field.onChange}
            placeholder="e.g. Madeleine & Gustave, Amazon…" placeholderTextColor={Colors.textTertiary} />
        )} />
      </View>

      <Text style={styles.sectionHeader}>Origin</Text>
      <View style={styles.card}>
        <Controller control={control} name="origin" render={({ field }) => (
          <TextInput style={styles.input} value={field.value} onChangeText={field.onChange}
            placeholder="e.g. Ethiopia, Sidamo" placeholderTextColor={Colors.textTertiary} />
        )} />
      </View>

      <Text style={styles.sectionHeader}>Process</Text>
      <View style={styles.card}>
        <Controller control={control} name="process" render={({ field }) => (
          <View style={styles.chipRow}>
            {PROCESS_OPTIONS.map((opt) => (
              <Pressable key={opt} onPress={() => field.onChange(field.value === opt ? undefined : opt)}
                style={[styles.chip, field.value === opt && styles.chipActive]}>
                <Text style={[styles.chipText, field.value === opt && styles.chipTextActive]}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        )} />
      </View>

      <Text style={styles.sectionHeader}>Roast level</Text>
      <View style={styles.card}>
        <Controller control={control} name="roastLevel" render={({ field }) => (
          <View style={styles.chipRow}>
            {ROAST_LEVEL_OPTIONS.map((opt) => (
              <Pressable key={opt} onPress={() => field.onChange(field.value === opt ? undefined : opt)}
                style={[styles.chip, field.value === opt && styles.chipActive]}>
                <Text style={[styles.chipText, field.value === opt && styles.chipTextActive]}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        )} />
      </View>

      <Text style={styles.sectionHeader}>Notes</Text>
      <View style={styles.card}>
        <Controller control={control} name="notes" render={({ field }) => (
          <TextInput style={styles.notesInput} multiline numberOfLines={4}
            value={field.value} onChangeText={field.onChange}
            placeholder="Tasting notes, origin details…" placeholderTextColor={Colors.textTertiary}
            textAlignVertical="top" />
        )} />
      </View>

      <Pressable style={[styles.primaryBtn, saving && styles.btnDisabled]} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color={Colors.bgSurface} /> : <Text style={styles.primaryBtnText}>Save changes</Text>}
      </Pressable>
      <Pressable style={styles.destructiveBtn} onPress={onDelete} disabled={saving}>
        <Text style={styles.destructiveBtnText}>Delete bean</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bgPage },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxxl, gap: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgPage },
  sectionHeader: {
    fontSize: 11, fontWeight: '500', color: Colors.textTertiary, letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: Spacing.sm, marginTop: Spacing.lg, paddingHorizontal: 4,
  },
  card: { backgroundColor: Colors.bgSurface, borderRadius: Radii.card, padding: Spacing.base, gap: Spacing.sm },
  input: { fontSize: 15, color: Colors.textPrimary, paddingVertical: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radii.chip, backgroundColor: Colors.accentSubtle },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontWeight: '500', fontSize: 13 },
  chipTextActive: { color: Colors.bgSurface, fontWeight: '600', fontSize: 13 },
  notesInput: { minHeight: 80, fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  errorText: { color: Colors.destructive, fontSize: 12 },
  muted: { color: Colors.textSecondary, fontSize: 14 },
  primaryBtn: {
    marginTop: Spacing.xxl, backgroundColor: Colors.accent, borderRadius: Radii.button,
    paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnText: { color: Colors.bgSurface, fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  destructiveBtn: {
    marginTop: Spacing.sm, borderRadius: Radii.button, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.destructive,
  },
  destructiveBtnText: { color: Colors.destructive, fontSize: 15, fontWeight: '500' },
  btnDisabled: { opacity: 0.4 },
});
