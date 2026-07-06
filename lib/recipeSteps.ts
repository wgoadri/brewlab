/**
 * Bridges the two timing worlds:
 *   - brew params (steepTimeS, bloomTimeS… — the optimizer's dimensions)
 *   - recipe/default steps (what the timer runs)
 *
 * A step with `durationParamKey` reads its planned duration from the brew's
 * param before the timer starts, and the measured duration is written back to
 * that param when the brew is saved — so the brew row records what actually
 * happened, for any recipe sharing that param.
 */

import type { RecipeStep } from '@/db/schema';
import type { BrewDraft } from './brewDraft';
import { METHODS } from './methods';

export interface TimerStep {
  label: string;
  /** Planned duration: the linked param's value, else the step's own fallback. */
  durationSec?: number;
  /** Instruction with {paramKey} placeholders already resolved. */
  instruction?: string;
  durationParamKey?: string;
  /** Generated preparation step: excluded from totalTimeS and recorded steps. */
  isPrep?: boolean;
}

/** Read a param value from the draft (common column field or paramsJson). */
export function draftParamValue(
  draft: BrewDraft,
  key: string,
): number | string | boolean | undefined {
  const direct = (draft as unknown as Record<string, unknown>)[key];
  if (typeof direct === 'number' || typeof direct === 'string' || typeof direct === 'boolean') {
    return direct;
  }
  return draft.paramsJson?.[key];
}

/** Replace {paramKey} placeholders with the brew's values; unknown keys stay literal. */
export function resolveInstruction(template: string, draft: BrewDraft): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = draftParamValue(draft, key);
    return v != null ? String(v) : match;
  });
}

/** One tap-to-continue prep step generated from the brew's own parameters. */
function buildPrepStep(draft: BrewDraft): TimerStep | null {
  const parts: string[] = [];
  if (draft.doseG != null) parts.push(`Add ${draft.doseG} g of coffee`);
  if (draft.grindSetting != null) parts.push(`Grind at ${draft.grindSetting}`);
  if (draft.waterTempC != null) parts.push(`Water at ${draft.waterTempC} °C`);
  if (parts.length === 0) return null;
  // No durationSec: the guided timer waits for a tap instead of auto-advancing.
  return { label: 'Prepare', instruction: parts.join('\n'), isPrep: true };
}

/** The steps the timer actually runs: prep + recipe (or defaults), durations and text resolved. */
export function buildTimerSteps(draft: BrewDraft): TimerStep[] {
  const base: RecipeStep[] = draft.steps?.length
    ? draft.steps
    : METHODS[draft.method].defaultSteps;

  const steps = base.map((s): TimerStep => {
    const linked = s.durationParamKey != null ? draftParamValue(draft, s.durationParamKey) : undefined;
    return {
      label: s.label,
      durationParamKey: s.durationParamKey,
      durationSec: typeof linked === 'number' ? Math.round(linked) : s.durationSec,
      instruction: s.instruction ? resolveInstruction(s.instruction, draft) : undefined,
    };
  });

  const prep = buildPrepStep(draft);
  return prep ? [prep, ...steps] : steps;
}

/**
 * Write measured step durations back into the linked params, so the saved brew
 * records reality (97s steep, not the planned 90). Returns an updated copy.
 */
export function applyMeasuredDurations(
  draft: BrewDraft,
  steps: TimerStep[],
  measuredSec: number[],
): BrewDraft {
  const next: BrewDraft = { ...draft, paramsJson: draft.paramsJson ? { ...draft.paramsJson } : undefined };
  const specs = METHODS[draft.method].params;

  steps.forEach((step, i) => {
    const measured = measuredSec[i];
    if (!step.durationParamKey || measured == null || measured <= 0) return;
    const spec = specs.find((p) => p.key === step.durationParamKey);
    if (!spec) return;
    if (spec.column) {
      (next as unknown as Record<string, unknown>)[spec.key] = measured;
    } else {
      next.paramsJson = { ...(next.paramsJson ?? {}), [spec.key]: measured };
    }
  });

  return next;
}
