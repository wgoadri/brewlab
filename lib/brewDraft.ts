import type { RecipeStep } from '@/db/schema';
import type { BrewMethod } from './methods';

export type BrewDraft = {
  method: BrewMethod;
  beanId?: number;
  grinderId?: number;
  doseG?: number;
  waterG?: number;
  ratio?: number;
  grindSetting?: number;
  waterTempC?: number;
  totalTimeS?: number;
  bloomWaterG?: number;
  bloomTimeS?: number;
  paramsJson?: Record<string, number | string | boolean>;
  notes?: string;
  /** Measured output weight (g); entered after the timer or via edit. */
  finalYieldG?: number;
  /** Recipe guiding this brew; its steps replace the method's defaultSteps. */
  recipeId?: number;
  steps?: RecipeStep[];
};

let _pending: BrewDraft | null = null;

export function setPendingBrew(draft: BrewDraft): void {
  _pending = draft;
}

export function getPendingBrew(): BrewDraft | null {
  return _pending;
}

export function clearPendingBrew(): void {
  _pending = null;
}
