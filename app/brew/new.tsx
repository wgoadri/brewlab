import { useRouter } from 'expo-router';
import { useState } from 'react';

import { db } from '@/db/client';
import { brews } from '@/db/schema';
import { setPendingBrew } from '@/lib/brewDraft';
import type { BrewDraft } from '@/lib/brewDraft';
import { clearSuggestion, getSuggestion, type BrewSuggestion } from '@/lib/brewSuggestion';
import { BrewForm } from '@/components/BrewForm';

export default function NewBrewScreen() {
  const router = useRouter();
  // Lazily consume any pending suggestion (optimizer or "brew again") once.
  const [suggestion] = useState<BrewSuggestion | null>(() => {
    const s = getSuggestion();
    if (s) { clearSuggestion(); return s; }
    return null;
  });

  async function onStart(draft: BrewDraft) {
    setPendingBrew(draft);
    router.replace('/brew/timer');
  }

  async function onSaveNow(draft: BrewDraft) {
    const result = await db.insert(brews).values({
      method: draft.method,
      beanId: draft.beanId,
      grinderId: draft.grinderId,
      doseG: draft.doseG,
      waterG: draft.waterG,
      ratio: draft.ratio,
      grindSetting: draft.grindSetting,
      waterTempC: draft.waterTempC,
      totalTimeS: draft.totalTimeS,
      bloomWaterG: draft.bloomWaterG,
      bloomTimeS: draft.bloomTimeS,
      paramsJson: draft.paramsJson,
      notes: draft.notes,
    });
    router.replace(`/brew/${result.lastInsertRowId}`);
  }

  return (
    <BrewForm
      initialMethod={suggestion?.method}
      initialBeanId={suggestion?.beanId ?? null}
      initialGrinderId={suggestion?.grinderId ?? null}
      initialParams={
        suggestion ? (suggestion.params as Record<string, number | string | boolean>) : undefined
      }
      banner={suggestion?.rationale}
      primaryLabel='Start brew'
      onPrimary={onStart}
      secondaryLabel='Save without timer'
      onSecondary={onSaveNow}
    />
  );
}
