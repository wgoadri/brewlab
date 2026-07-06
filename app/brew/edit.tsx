import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { db } from '@/db/client';
import { brews, type Brew } from '@/db/schema';
import type { BrewDraft } from '@/lib/brewDraft';
import { paramValuesFromBrew, type BrewMethod } from '@/lib/methods';
import { BrewForm } from '@/components/BrewForm';
import { Colors } from '@/lib/theme';

export default function EditBrewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Snapshot once — a live query would reset the form mid-edit on any DB emit.
  const [brew, setBrew] = useState<Brew | null | undefined>(undefined);
  useEffect(() => {
    db.query.brews
      .findFirst({ where: eq(brews.id, Number(id)) })
      .then((row) => setBrew(row ?? null));
  }, [id]);

  // Stable identity: a fresh object each render would re-trigger the form's
  // reset effect and stomp in-progress edits.
  const initialParams = useMemo(
    () => (brew ? paramValuesFromBrew(brew, brew.method as BrewMethod) : undefined),
    [brew],
  );

  if (brew === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (brew === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Brew not found.</Text>
      </View>
    );
  }

  const method = brew.method as BrewMethod;

  async function onSave(draft: BrewDraft) {
    if (!brew) return;
    // Params the user cleared must be nulled out, not left as-is.
    await db
      .update(brews)
      .set({
        beanId: draft.beanId ?? null,
        grinderId: draft.grinderId ?? null,
        doseG: draft.doseG ?? null,
        waterG: draft.waterG ?? null,
        ratio: draft.ratio ?? null,
        grindSetting: draft.grindSetting ?? null,
        waterTempC: draft.waterTempC ?? null,
        totalTimeS: draft.totalTimeS ?? null,
        bloomWaterG: draft.bloomWaterG ?? null,
        bloomTimeS: draft.bloomTimeS ?? null,
        paramsJson: draft.paramsJson ?? null,
        notes: draft.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(brews.id, brew.id));
    router.back();
  }

  return (
    <BrewForm
      initialMethod={method}
      lockMethod
      initialBeanId={brew.beanId}
      initialGrinderId={brew.grinderId}
      initialParams={initialParams}
      initialNotes={brew.notes ?? ''}
      primaryLabel='Save changes'
      onPrimary={onSave}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgPage },
  muted: { color: Colors.textSecondary, fontSize: 14 },
});
