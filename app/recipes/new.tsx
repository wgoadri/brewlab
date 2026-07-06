import { useRouter } from 'expo-router';

import { db } from '@/db/client';
import { recipes } from '@/db/schema';
import { RecipeForm, type RecipeFormValues } from '@/components/RecipeForm';

export default function NewRecipeScreen() {
  const router = useRouter();

  async function onSubmit(values: RecipeFormValues) {
    await db.insert(recipes).values({
      name: values.name,
      method: values.method,
      brewerId: values.brewerId ?? undefined,
      stepsJson: values.steps,
      notes: values.notes || undefined,
    });
    router.back();
  }

  return <RecipeForm submitLabel='Create recipe' onSubmit={onSubmit} />;
}
