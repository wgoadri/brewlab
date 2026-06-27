import type { BrewMethod } from './methods';

export type BrewDraft = {
  method: BrewMethod;
  beanId?: number;
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
