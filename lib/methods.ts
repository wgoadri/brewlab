/**
 * Brew methods & their parameter profiles.
 * -----------------------------------------
 * One declarative source of truth used by THREE consumers:
 *   1. the brew form   – renders inputs from `params`
 *   2. the timer       – seeds stages from `defaultSteps`
 *   3. the optimizer   – tunes the params flagged `optimizable`, within [min, max]
 *
 * Common params (dose, water, grind, temp, time…) map to real columns on `brews`.
 * Anything method-specific is stored in `brews.paramsJson` under the ParamSpec.key.
 */

export type BrewMethod =
  | 'aeropress'
  | 'v60'
  | 'chemex'
  | 'kalita'
  | 'frenchpress'
  | 'espresso'
  | 'moka'
  | 'switch';

export type ParamType = 'number' | 'int' | 'enum' | 'boolean' | 'text';

export interface ParamSpec {
  key: string;
  label: string;
  type: ParamType;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  default?: number | string | boolean;
  /** column on `brews` if common; omit if it lives in paramsJson */
  column?: keyof import('../db/schema').Brew;
  /** the optimizer is allowed to tune this dimension */
  optimizable?: boolean;
  help?: string;
}

export interface BrewStepTemplate {
  label: string;
  durationSec?: number;
}

export interface MethodDef {
  id: BrewMethod;
  label: string;
  icon?: string; // @expo/vector-icons name, fill in when building UI
  params: ParamSpec[];
  defaultSteps: BrewStepTemplate[];
  timerMode: 'guided' | 'freeform';
}

// Reusable common params (kept consistent across methods) ----------------------
const dose = (def = 15): ParamSpec => ({
  key: 'doseG', label: 'Dose', type: 'number', unit: 'g', min: 5, max: 40, step: 0.1,
  column: 'doseG', optimizable: true, default: def,
});
const water = (def = 240): ParamSpec => ({
  key: 'waterG', label: 'Water', type: 'number', unit: 'g', min: 30, max: 1000, step: 1,
  column: 'waterG', optimizable: true, default: def,
});
const grind: ParamSpec = {
  key: 'grindSetting', label: 'Grind', type: 'number', min: 0, max: 100, step: 0.5,
  column: 'grindSetting', optimizable: true,
  help: 'On your grinder’s own scale (configure min/max per grinder).',
};
const temp = (def = 93): ParamSpec => ({
  key: 'waterTempC', label: 'Water temp', type: 'number', unit: '°C', min: 70, max: 100, step: 1,
  column: 'waterTempC', optimizable: true, default: def,
});
const totalTime = (def = 150): ParamSpec => ({
  key: 'totalTimeS', label: 'Total time', type: 'int', unit: 's', min: 10, max: 1200, step: 1,
  column: 'totalTimeS', optimizable: true, default: def,
});
const bloom: ParamSpec[] = [
  { key: 'bloomWaterG', label: 'Bloom water', type: 'number', unit: 'g', min: 0, max: 120, step: 1, column: 'bloomWaterG', optimizable: true, default: 40 },
  { key: 'bloomTimeS', label: 'Bloom time', type: 'int', unit: 's', min: 0, max: 120, step: 1, column: 'bloomTimeS', optimizable: true, default: 30 },
];

export const METHODS: Record<BrewMethod, MethodDef> = {
  aeropress: {
    id: 'aeropress',
    label: 'AeroPress',
    timerMode: 'guided',
    params: [
      dose(15), water(240), grind, temp(85), totalTime(120),
      { key: 'orientation', label: 'Orientation', type: 'enum', options: ['standard', 'inverted'], default: 'inverted', optimizable: true },
      { key: 'steepTimeS', label: 'Steep time', type: 'int', unit: 's', min: 0, max: 600, step: 5, default: 90, optimizable: true },
      { key: 'plungeTimeS', label: 'Plunge time', type: 'int', unit: 's', min: 5, max: 120, step: 1, default: 30, optimizable: true },
      { key: 'filters', label: 'Filters', type: 'int', min: 1, max: 2, step: 1, default: 1, optimizable: false },
      { key: 'agitation', label: 'Agitation', type: 'enum', options: ['none', 'stir', 'swirl'], default: 'stir', optimizable: true },
    ],
    defaultSteps: [
      { label: 'Add coffee + bloom', durationSec: 30 },
      { label: 'Fill & steep', durationSec: 60 },
      { label: 'Stir', durationSec: 10 },
      { label: 'Plunge', durationSec: 30 },
    ],
  },

  v60: {
    id: 'v60',
    label: 'Hario V60',
    timerMode: 'guided',
    params: [
      dose(15), water(250), grind, temp(94), totalTime(165), ...bloom,
      { key: 'pours', label: 'Number of pours', type: 'int', min: 1, max: 6, step: 1, default: 3, optimizable: true },
    ],
    defaultSteps: [
      { label: 'Bloom', durationSec: 30 },
      { label: 'Pour 1', durationSec: 30 },
      { label: 'Pour 2', durationSec: 30 },
      { label: 'Drawdown', durationSec: 45 },
    ],
  },

  chemex: {
    id: 'chemex',
    label: 'Chemex',
    timerMode: 'guided',
    params: [dose(30), water(500), grind, temp(94), totalTime(240), ...bloom],
    defaultSteps: [
      { label: 'Bloom', durationSec: 45 },
      { label: 'Pours', durationSec: 120 },
      { label: 'Drawdown', durationSec: 75 },
    ],
  },

  kalita: {
    id: 'kalita',
    label: 'Kalita Wave',
    timerMode: 'guided',
    params: [dose(20), water(320), grind, temp(93), totalTime(180), ...bloom],
    defaultSteps: [
      { label: 'Bloom', durationSec: 30 },
      { label: 'Pulse pours', durationSec: 90 },
      { label: 'Drawdown', durationSec: 60 },
    ],
  },

  frenchpress: {
    id: 'frenchpress',
    label: 'French Press',
    timerMode: 'guided',
    params: [
      dose(30), water(500), grind, temp(94),
      { key: 'steepTimeS', label: 'Steep time', type: 'int', unit: 's', min: 60, max: 900, step: 10, default: 240, optimizable: true },
    ],
    defaultSteps: [
      { label: 'Steep', durationSec: 240 },
      { label: 'Break crust & skim', durationSec: 30 },
      { label: 'Plunge & serve', durationSec: 20 },
    ],
  },

  espresso: {
    id: 'espresso',
    label: 'Espresso',
    timerMode: 'freeform',
    params: [
      dose(18), grind, temp(93),
      { key: 'yieldG', label: 'Yield (out)', type: 'number', unit: 'g', min: 15, max: 60, step: 0.5, default: 36, optimizable: true },
      { key: 'shotTimeS', label: 'Shot time', type: 'int', unit: 's', min: 10, max: 60, step: 1, default: 28, optimizable: true },
      { key: 'preInfusionS', label: 'Pre-infusion', type: 'int', unit: 's', min: 0, max: 15, step: 1, default: 3, optimizable: true },
      { key: 'pressureBar', label: 'Pressure', type: 'number', unit: 'bar', min: 5, max: 12, step: 0.5, default: 9, optimizable: true },
      { key: 'basket', label: 'Basket', type: 'text', default: '18g VST' },
    ],
    defaultSteps: [
      { label: 'Pre-infusion', durationSec: 3 },
      { label: 'Extraction', durationSec: 25 },
    ],
  },

  moka: {
    id: 'moka',
    label: 'Moka Pot',
    timerMode: 'freeform',
    params: [
      dose(18), water(200), grind, temp(100),
      { key: 'heatLevel', label: 'Heat', type: 'enum', options: ['low', 'medium', 'high'], default: 'medium', optimizable: true },
    ],
    defaultSteps: [
      { label: 'Heat until first gurgle', durationSec: 240 },
      { label: 'Pull off heat & cool base', durationSec: 20 },
    ],
  },

  switch: {
    id: 'switch',
    label: 'Hario Switch',
    timerMode: 'guided',
    params: [
      dose(15), water(250), grind, temp(92), totalTime(180), ...bloom,
      { key: 'steepTimeS', label: 'Steep (closed)', type: 'int', unit: 's', min: 0, max: 300, step: 5, default: 60, optimizable: true },
    ],
    defaultSteps: [
      { label: 'Bloom (open)', durationSec: 30 },
      { label: 'Fill & steep (closed)', durationSec: 60 },
      { label: 'Open & drawdown', durationSec: 60 },
    ],
  },
};

export const METHOD_LIST: MethodDef[] = Object.values(METHODS);

/** Params the optimizer is allowed to vary for a given method. */
export function optimizableParams(method: BrewMethod): ParamSpec[] {
  return METHODS[method].params.filter((p) => p.optimizable && (p.type === 'number' || p.type === 'int' || p.type === 'enum'));
}

/**
 * Read a brew row back into ParamSpec-keyed values (columns + paramsJson),
 * e.g. to prefill a form or copy a brew.
 */
export function paramValuesFromBrew(
  brew: import('../db/schema').Brew,
  method: BrewMethod,
): Record<string, number | string | boolean> {
  const out: Record<string, number | string | boolean> = {};
  for (const spec of METHODS[method].params) {
    const raw = spec.column != null ? brew[spec.column] : brew.paramsJson?.[spec.key];
    if (typeof raw === 'number' || typeof raw === 'string' || typeof raw === 'boolean') {
      out[spec.key] = raw;
    }
  }
  return out;
}
