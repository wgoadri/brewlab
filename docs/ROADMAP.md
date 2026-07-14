# brewlab — roadmap & backlog

Status snapshot (2026-07-14). Written after auditing the schema/optimizer sync
following the recipes + step-params work (commits `8a1652d`…`89a0984`).

---

## Health check — DB ↔ optimizer are in sync ✅

Verified, not eyeballed:

- `npx drizzle-kit generate` → **"No schema changes"**. Schema matches the 6
  committed migrations (`drizzle/0000`–`0005`). Nothing pending.
- `npm run typecheck` — **clean**.
- Param plumbing round-trips: one `ParamSpec` list drives form, timer, and
  optimizer. Traced a value both directions:
  - **write** — `BrewForm.tsx:160` splits by `spec.column` (columns vs `paramsJson`),
    computes `ratio = waterG/doseG` (`BrewForm.tsx:175`).
  - **read for optimizer** — `toObservations` → `getParamValue` reads column *or*
    `paramsJson`, incl. enums (`analysis.ts:63`).
  - **timer write-back** — `applyMeasuredDurations` routes column params to columns
    and `steepTimeS` (no column) to `paramsJson` (`recipeSteps.ts:82`).

### Known gaps found (none are crashes)

| # | Gap | Location | Impact |
|---|-----|----------|--------|
| G1 | `PerturbBest` perturbs only numeric dims; `orientation`/`agitation`/`heatLevel` are `optimizable` enums but stay frozen at the best brew's value | `lib/optimizer/index.ts:61` | Categorical knobs never explored |
| ~~G2~~ | ~~`{paramKey}` placeholders resolve only at timer runtime; unknown keys pass through silently~~ **CLOSED by Track B** | RecipeForm / recipeSteps | — |
| G3 | AeroPress params can't represent **bypass / dilution / total water** — central to modern comp brewing and pervasive in the WAC data | `lib/methods.ts:93` | Can't log or optimize the knob champions tune most |

---

## The WAC dataset (`docs/wac_recipe`)

47 World AeroPress Championship podium recipes, 2009–2025. Rich, but several
columns don't fit the schema cleanly (`bypass_g`, `total_water_g`, two-temp pours,
`press_start_s`, agitation patterns like "NSNS-WEWE"). **Don't model every column.**
Three graded uses instead — see Track A.

---

## Roadmap

Sequence **A → B → C**. A adds immediate value and motivates the bypass schema
change; B makes recipes (incl. the seeded ones) read correctly; C is deepest but
least urgent while the dataset is small.

### Track A — Recipes & the WAC data

- **A1 · Add `bypassWaterG` AeroPress param** *(closes G3)*
  - Add to `METHODS.aeropress.params` in `lib/methods.ts`: `key: 'bypassWaterG'`,
    `type: 'number'`, `unit: 'g'`, `min: 0`, `max: 250`, `default: 0`,
    `optimizable: true`. No `column` → lands in `paramsJson`.
  - No schema migration needed (paramsJson is untyped) — but confirm
    `db:generate` still reports no changes.
  - Accept: param renders in `BrewForm`, is stored in `brews.paramsJson`, and
    appears in the Analysis Parameter Explorer picker.

- **A2 · Seed ~5 recent champion recipes**
  - Insert as `recipes` rows, `method: 'aeropress'`, using `{doseG}`/`{waterTempC}`/
    `{bloomWaterG}`/`{bypassWaterG}` in `instruction` where a param exists, prose
    otherwise. Link step durations via `durationParamKey` where sensible.
  - Decide seeding mechanism: idempotent startup seed vs. a one-tap "import
    championship recipes" action in the Gear/Recipes screen. **Open question.**
  - Accept: recipes appear in the brew-form recipe picker and drive the timer.

- **A3 · Championship reference band in Parameter Explorer**
  - Static min–max / quartile bands (dose, temp, ratio, bypass) derived from the
    dataset, drawn behind the user's points in `ParameterChart`.
  - Pure static constant (e.g. `lib/wacReference.ts`) — no schema change.
  - Accept: band shows for AeroPress; hidden/empty for other methods.

### Track B — Step instructions with variables ✅ DONE *(finished what `89a0984` started; closes G2)*

Implemented on `feat/session-e-step-params`. Editor-only; timer/runtime behavior
(`resolveInstruction`) untouched. `typecheck` + `lint` clean.

- **B1 · Live instruction preview in `RecipeForm`** ✅ — each non-empty instruction
  renders below the field with the method's default param values substituted.
  New helper `previewInstruction(template, method)` in `lib/recipeSteps.ts`
  (keys with no default, e.g. `grindSetting`, stay literal).
- **B2 · Param-chip inserter** ✅ — a wrapping row of chips (one per method param,
  labelled) appends `{key}` to that step's instruction; `insertPlaceholder(idx, key)`
  handles spacing.
- **B3 · Unknown-key validation** ✅ — `unknownPlaceholders(template, method)` (built
  on `extractPlaceholders` + `methodParamKeys`) drives a destructive-coloured
  "Unknown: {…}" warning under any step referencing a non-existent param.

Not done (deliberately out of scope): cursor-position insertion (chips append to
end), and *blocking* save on unknown keys (warning only — a `{key}` may be
intentional prose). Revisit if either becomes annoying in use.

### Track C — Optimizer depth

- **C1 · Explore enums in `PerturbBest`** *(closes G1)* — occasionally perturb a
  categorical dimension (flip orientation, change agitation) instead of only the
  least-varied numeric knob.
- **C2 · `BayesianTPE` strategy** — implement behind the existing
  `OptimizerStrategy` interface (the CLAUDE.md target); `suggestNextBrew` picks it
  once enough rated brews exist. No call-site changes.

### Track D — Brewing guide

- **D1 · In-app AeroPress guide** ✅ DONE — `docs/aeropress_brewing_guide.md` distilled
  into structured data (`lib/brewingGuide.ts`) and rendered natively by
  `app/guide/[method].tsx` (sticky jump-nav, no markdown dependency). Linked from the
  recipe form (AeroPress only, next to the Steps header) and a "Learn" section in the
  Gear tab. Method-keyed so other methods can add guides later.
- **D2 · Inline param hints** *(future; folds into Track A)* — surface each param's
  typical value + range (from the guide's Appendix) as inline hints in the brew/recipe
  forms. Same data the Track A reference bands need — build once, use both places.
- **D3 · "Start from the champion median" template** *(future)* — one-tap prefill of the
  guide's `starter` recipe in the recipe form.

---

## Open questions
1. **A2 seeding**: bundle as idempotent startup seed, or an explicit user-triggered
   import? (Affects whether champion recipes clutter a brand-new install.)
2. **A1 bypass semantics**: is `waterG` the brew water only (bypass added on top,
   so cup ≈ waterG + bypassWaterG), or the total? Nail down before A2 writes
   instructions that reference both.
