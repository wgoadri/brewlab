import { METHODS, optimizableParams, type BrewMethod, type ParamSpec } from '../methods';
import type {
  BrewObservation,
  OptimizerContext,
  OptimizerStrategy,
  ParamSet,
  ParamValue,
  Suggestion,
} from './types';

export * from './types';

// ── helpers ──────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function round(v: number, step?: number) {
  if (!step) return v;
  return Math.round(v / step) * step;
}
function randomIn(spec: ParamSpec): ParamValue {
  if (spec.type === 'enum' && spec.options) {
    return spec.options[Math.floor(Math.random() * spec.options.length)];
  }
  const lo = spec.min ?? 0;
  const hi = spec.max ?? 100;
  const v = lo + Math.random() * (hi - lo);
  return spec.type === 'int' ? Math.round(v) : round(v, spec.step);
}

/**
 * Cold start: no (or one) rated brew yet. Start from method defaults, nudged
 * randomly so successive suggestions explore the space instead of repeating.
 */
export const RandomSearch: OptimizerStrategy = {
  name: 'random-search',
  suggest(ctx: OptimizerContext): Suggestion {
    const params: ParamSet = {};
    for (const spec of ctx.space) {
      params[spec.key] = spec.default !== undefined && Math.random() < 0.5 ? spec.default : randomIn(spec);
    }
    return {
      params,
      strategy: this.name,
      rationale: 'No rated brews yet for this setup — exploring the parameter space from the method defaults.',
    };
  },
};

/**
 * Exploitation: perturb the best-scoring brew along the single dimension that
 * has been varied the LEAST so far (cheap coordinate-style exploration).
 * Good enough to be useful immediately; swap in TPE / Bayesian later behind the
 * same OptimizerStrategy interface.
 */
export const PerturbBest: OptimizerStrategy = {
  name: 'perturb-best',
  suggest(ctx: OptimizerContext): Suggestion {
    const best = [...ctx.history].sort((a, b) => b.score - a.score)[0];

    // Pick the numeric dimension with the smallest spread across history.
    const numeric = ctx.space.filter((s) => s.type === 'number' || s.type === 'int');
    let target = numeric[0];
    let smallestSpread = Infinity;
    for (const spec of numeric) {
      const vals = ctx.history
        .map((h) => h.params[spec.key])
        .filter((v): v is number => typeof v === 'number');
      const spread = vals.length ? Math.max(...vals) - Math.min(...vals) : 0;
      if (spread < smallestSpread) {
        smallestSpread = spread;
        target = spec;
      }
    }

    const params: ParamSet = { ...best.params };
    let rationale = 'Reusing your best-rated brew';

    if (target) {
      const current =
        typeof best.params[target.key] === 'number'
          ? (best.params[target.key] as number)
          : typeof target.default === 'number'
            ? target.default
            : 0;
      const range = (target.max ?? 0) - (target.min ?? 0);
      const stepUnit = target.step ?? (target.type === 'int' ? 1 : Math.max(range * 0.05, 0.1));
      const direction = Math.random() < 0.5 ? -1 : 1;
      const next = clamp(
        round((current as number) + direction * stepUnit * 2, target.step),
        target.min ?? -Infinity,
        target.max ?? Infinity,
      );
      params[target.key] = target.type === 'int' ? Math.round(next) : next;
      rationale = `Based on your best brew (score ${best.score}), try ${target.label.toLowerCase()} ${direction > 0 ? 'up' : 'down'} to ${params[target.key]}${target.unit ?? ''} — it's the least-explored knob.`;
    }

    return { params, strategy: this.name, rationale };
  },
};

/** Entry point used by the UI. Chooses a strategy based on how much data exists. */
export function suggestNextBrew(method: BrewMethod, history: BrewObservation[]): Suggestion {
  const def = METHODS[method];
  const space = optimizableParams(method);
  const ctx: OptimizerContext = { method, def, space, history };

  const rated = history.filter((h) => Number.isFinite(h.score));
  const strategy: OptimizerStrategy = rated.length >= 3 ? PerturbBest : RandomSearch;
  return strategy.suggest({ ...ctx, history: rated.length ? rated : history });
}
