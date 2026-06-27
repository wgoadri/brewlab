import type { BrewMethod, MethodDef, ParamSpec } from '../methods';

export type ParamValue = number | string | boolean;
export type ParamSet = Record<string, ParamValue>;

/** One past brew the optimizer learns from: params + the score you gave it. */
export interface BrewObservation {
  params: ParamSet;
  score: number; // brews.overallRating — the objective to MAXIMISE
}

export interface Suggestion {
  params: ParamSet;
  /** Human-readable reason, shown in the UI ("colder + slightly finer than your best"). */
  rationale: string;
  strategy: string;
}

export interface OptimizerContext {
  method: BrewMethod;
  def: MethodDef;
  /** Tunable dimensions for this method (from optimizableParams()). */
  space: ParamSpec[];
  history: BrewObservation[];
}

export interface OptimizerStrategy {
  readonly name: string;
  suggest(ctx: OptimizerContext): Suggestion;
}
