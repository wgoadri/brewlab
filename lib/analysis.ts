/**
 * Pure computation helpers for the Analysis tab.
 * No React, no DB — these operate on already-fetched Brew arrays.
 */

import type { Brew, Grinder } from '@/db/schema';
import { optimizableParams, type BrewMethod, type ParamSpec } from '@/lib/methods';
import type { BrewObservation, ParamSet } from '@/lib/optimizer/types';

// ── Tier detection ─────────────────────────────────────────────────────────────

export type Tier = 'cold' | 'early' | 'working' | 'rich';

export function getTier(n: number): Tier {
  if (n <= 2) return 'cold';
  if (n <= 11) return 'early';
  if (n <= 24) return 'working';
  return 'rich';
}

// ── Progress ───────────────────────────────────────────────────────────────────

/** Running maximum of overallRating (brews already sorted by brewedAt asc). */
export function bestSoFarSeries(brews: Brew[]): number[] {
  let best = -1;
  return brews.map(b => {
    if (b.overallRating != null && b.overallRating > best) best = b.overallRating;
    return best < 0 ? 0 : best;
  });
}

// ── Parameter access ───────────────────────────────────────────────────────────

/** Read a numeric param value from a brew row (column or paramsJson). */
export function getParamValue(brew: Brew, spec: ParamSpec): number | undefined {
  if (spec.column) {
    const val = brew[spec.column as keyof Brew];
    return typeof val === 'number' ? val : undefined;
  }
  const j = brew.paramsJson;
  if (!j) return undefined;
  const val = j[spec.key];
  return typeof val === 'number' ? val : undefined;
}

/** Effective [min, max] for a param — uses grinder scale for grindSetting. */
export function paramRange(
  spec: ParamSpec,
  grinder?: Grinder | null,
): { min: number; max: number } {
  if (spec.key === 'grindSetting' && grinder) {
    return {
      min: grinder.minSetting ?? spec.min ?? 0,
      max: grinder.maxSetting ?? spec.max ?? 100,
    };
  }
  return { min: spec.min ?? 0, max: spec.max ?? 100 };
}

// ── Optimizer bridge ───────────────────────────────────────────────────────────

/** Convert brew rows to BrewObservation[] for suggestNextBrew. */
export function toObservations(brews: Brew[], method: BrewMethod): BrewObservation[] {
  const specs = optimizableParams(method);
  return brews
    .filter(b => b.overallRating != null)
    .map(b => {
      const params: ParamSet = {};
      for (const spec of specs) {
        const num = getParamValue(b, spec);
        if (num != null) {
          params[spec.key] = num;
        } else if (spec.type === 'enum' && b.paramsJson?.[spec.key] != null) {
          params[spec.key] = b.paramsJson[spec.key] as string;
        }
      }
      return { params, score: b.overallRating! };
    });
}

// ── Sensory diagnosis ──────────────────────────────────────────────────────────

/**
 * Extraction index derived from tastingJson sub-scores.
 * Positive → under-extracted, negative → over-extracted. Range [-1, 1].
 *
 * Formula: (acidity − sweetness) − (bitterness − 5)
 * At neutral (all 5s) → 0. Sour/thin cup → positive. Bitter/harsh → negative.
 */
export function extractionIndex(tasting: Record<string, number>): number {
  const a = tasting.acidity ?? 5;
  const s = tasting.sweetness ?? 5;
  const b = tasting.bitterness ?? 5;
  const raw = (a - s) - (b - 5);
  return Math.max(-1, Math.min(1, raw / 15));
}

export interface ExtractionDiagnosis {
  state: 'Under-extracted' | 'Balanced' | 'Over-extracted';
  index: number;
  actions: string[];
}

export function diagnose(tasting: Record<string, number>): ExtractionDiagnosis {
  const index = extractionIndex(tasting);
  if (index > 0.15) {
    return {
      state: 'Under-extracted',
      index,
      actions: ['Grind finer', 'Hotter water', 'Longer contact time', 'Pour slower'],
    };
  }
  if (index < -0.15) {
    return {
      state: 'Over-extracted',
      index,
      actions: ['Grind coarser', 'Cooler water', 'Shorter contact time'],
    };
  }
  return {
    state: 'Balanced',
    index,
    actions: ['Adjust ratio if too weak or strong'],
  };
}
