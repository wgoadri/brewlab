/**
 * Module-level store for passing an optimizer suggestion from the Analysis tab
 * into the new-brew form (read once on mount, then cleared).
 */

import type { BrewMethod } from '@/lib/methods';
import type { ParamSet } from '@/lib/optimizer/types';

export interface BrewSuggestion {
  method: BrewMethod;
  beanId?: number;
  grinderId?: number;
  params: ParamSet;
  rationale: string;
}

let pending: BrewSuggestion | null = null;

export function setSuggestion(s: BrewSuggestion): void { pending = s; }
export function getSuggestion(): BrewSuggestion | null { return pending; }
export function clearSuggestion(): void { pending = null; }
