import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { db } from '@/db/client';
import { recipes, type Recipe } from '@/db/schema';
import type { BrewMethod } from '@/lib/methods';
import { RecipeForm, type RecipeFormValues } from '@/components/RecipeForm';
import { Colors, Radii, Spacing } from '@/lib/theme';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Snapshot once — same rationale as brew edit: don't reset the form mid-edit.
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  useEffect(() => {
    db.query.recipes
      .findFirst({ where: eq(recipes.id, Number(id)) })
      .then((row) => setRecipe(row ?? null));
  }, [id]);

  const initial = useMemo(
    (): RecipeFormValues | undefined =>
      recipe
        ? {
            name: recipe.name,
            method: recipe.method as BrewMethod,
            brewerId: recipe.brewerId,
            steps: recipe.stepsJson,
            notes: recipe.notes ?? '',
          }
        : undefined,
    [recipe],
  );

  if (recipe === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (recipe === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Recipe not found.</Text>
      </View>
    );
  }

  async function onSubmit(values: RecipeFormValues) {
    if (!recipe) return;
    await db
      .update(recipes)
      .set({
        name: values.name,
        brewerId: values.brewerId,
        stepsJson: values.steps,
        notes: values.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, recipe.id));
    router.back();
  }

  function onDelete() {
    Alert.alert('Delete recipe?', 'Brews that used it keep their recorded steps.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.delete(recipes).where(eq(recipes.id, Number(id)));
            router.back();
          } catch (err) {
            Alert.alert('Delete failed', err instanceof Error ? err.message : String(err));
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.flex}>
      <RecipeForm initial={initial} lockMethod submitLabel='Save changes' onSubmit={onSubmit} />
      <Pressable style={styles.destructiveBtn} onPress={onDelete}>
        <Text style={styles.destructiveBtnText}>Delete recipe</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bgPage },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgPage },
  muted: { color: Colors.textSecondary, fontSize: 14 },
  destructiveBtn: {
    margin: Spacing.base, borderRadius: Radii.button, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.destructive,
  },
  destructiveBtnText: { color: Colors.destructive, fontSize: 15, fontWeight: '500' },
});
