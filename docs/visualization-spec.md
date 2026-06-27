# Brew Analysis & Visualization Spec (v2)

## Goal

brewlab is not a logging tool. It is an **experiment-analysis system**: each brew
is a data point in a noisy black-box optimization, and the visualizations exist
to answer four questions, in priority order:

1. **Am I improving?** (for a given bean on a given machine)
2. **What should I change next?**
3. **Where is my good zone?**
4. **What matters most?**

Everything below is in service of those questions — and is shaped by two realities
the original draft underweighted: **you have very few, very noisy data points**, and
**brews are only comparable within the same bean + method.** Those two constraints
drive every design decision here.

---

## The two constraints that shape everything

### Constraint A — Condition on (bean, method) before anything else

Grind 14 on a V60 and grind 14 on espresso are unrelated. A washed Kenyan and a
natural Brazilian have different optima. **No view ever pools brews across beans or
methods.** The analysis always operates on a *comparable set*:

> comparable_set = brews WHERE beanId = X AND method = Y
> (and, for grind comparisons specifically, AND grinderId = Z — `grindSetting` is on
> the grinder's own scale and is meaningless across grinders)

The bean+method selector is the primary control of the whole Analysis tab. "All
brews" is a logbook, not an analysis, and lives elsewhere.

### Constraint B — Progressive disclosure by sample size

Most home users will have **5–40 brews per bean**, often fewer. Charts that need
hundreds of points (interpolated contours, variance-based importance, parallel
coordinates) are actively misleading at N=10. So views unlock by data volume, and
every view has a defined low-data state.

| Tier | N (comparable set) | What's honest to show |
|------|--------------------|------------------------|
| Cold start | 0–2 | Progress placeholder + the optimizer's suggested starting point |
| Early | 3–11 | Progress (best-so-far), 1-D parameter explorer + coverage, compare-to-best, sensory diagnosis |
| Working | 12–24 | + directional parameter influence (clearly labelled "directional, low confidence") |
| Rich | 25+ | + 2-D landscape (binned), parallel coordinates, stronger influence estimates |

Never render a Tier-3 chart with Tier-1 data. Show a "needs ~N more brews to be
meaningful" state instead.

---

## Map to the data we actually have

So the spec stays buildable, here is what each view reads (`db/schema.ts`):

- **Objective (Y):** `brews.overallRating` — single 0–10 enjoyment score. The optimizer's target.
- **Why (sensory):** `brews.tastingJson` → `{ acidity, sweetness, bitterness, body, aftertaste, balance, … }`.
- **Parameters (X):** common columns (`doseG`, `waterG`, `ratio`, `grindSetting`,
  `waterTempC`, `totalTimeS`, `bloomWaterG`, `bloomTimeS`) plus method-specific keys in
  `paramsJson` (e.g. `orientation`, `pressureBar`, `pours`). The set of tunable
  parameters and their valid ranges come from `optimizableParams(method)` in `lib/methods.ts`.
- **Order/time:** `brews.brewedAt`.
- **Identity:** `beanId`, `brewerId`, `grinderId`, `method`.
- **Next action:** `suggestNextBrew(method, history)` from `lib/optimizer`.

Two parameter notes that prevent garbage charts:
- **`ratio` is derived** (`waterG / doseG`). Treat ratio as *the* strength axis; don't
  also plot dose and water as independent axes (they're collinear with ratio). For
  espresso, "ratio" means brew ratio = `yieldG / doseG`.
- **Grind is grinder-relative** — see Constraint A.

---

## Visualization hierarchy (revised)

### 1. Progress (default, always visible) — "Am I improving?"

A single-metric line over brew order (`brewedAt`), Y = `overallRating`. Two series:

- **Best-so-far** (running max) — the bold line. This is the real progress signal and
  it only goes up, so it reads cleanly.
- **Per-brew score** — faint dots/line behind it, to show the noise you're fighting.

Why both: raw human ratings are noisy and non-stationary (mood, palate fatigue,
recalibration), so a raw line zig-zags even when you're genuinely dialing in.
Best-so-far cuts through that. Optionally annotate the current best brew.

*Low-data:* N=1 → show the single point + "log a few more to see a trend." N=0 → the
optimizer's suggested starting recipe.

### 2. Parameter explorer (most important) — "What should I change next?"

For a selected tunable parameter, a scatter: X = parameter, Y = `overallRating`, one
dot per brew in the comparable set. This is the Optuna-style marginal view from the
draft, with four additions that make it trustworthy and actionable:

- **Coverage band.** Draw the parameter's full valid range (`ParamSpec.min..max`) as a
  track, and shade the sub-range you've actually tried. Home brewers over-sample their
  comfort zone; *seeing the unexplored region is often more actionable than any
  correlation.* "You've only tried grind 12–15; coarser is unexplored."
- **Confounding is explicit.** These are observational, not controlled — score
  variation along grind may actually be temperature. Mitigate by (a) encoding a second
  variable as dot color (e.g. color = temperature), and (b) a "comparable brews only"
  toggle that dims brews where *other* params differ a lot from your current best.
  Never imply causation.
- **Best brew highlighted**, plus a faint marker for the optimizer's **suggested next
  value** on this axis — so the chart points at an action.
- **Parameter picker** is driven by `optimizableParams(method)`, so axes are always
  valid for the method (espresso shows pressure/yield; V60 shows pours/bloom).

*Low-data:* still useful at N=3–4 as "points + coverage," just don't draw any trend line.

### 3. Compare-to-best + next suggestion — "What should I change next?" (the loop)

Per Rule 2 (comparison beats absolutes), a compact view that frames the latest brew
**relative to your best and your average**, parameter by parameter: a small diverging
bar / delta table ("grind +2 finer, temp −1°C, score −1.2 vs best"). Then surface
`suggestNextBrew(...)` as a concrete candidate recipe with its one-line rationale and a
"prefill a new brew with these" button. This is what closes the optimization loop —
diagnosis → next experiment — and most coffee apps miss it.

### 4. Sensory diagnosis → adjustment — "What should I change next?" (theory-driven)

The highest-actionability view at small N, because it doesn't need many points — it
needs one bad cup. Read `tastingJson` and map to extraction state, then to a concrete
adjustment using standard extraction theory:

| You taste | Likely state | Try next |
|-----------|--------------|----------|
| Sour, sharp, thin, no sweetness | **Under-extracted** | grind finer · hotter water · longer contact · (pourover) slower pour |
| Bitter, harsh, drying, hollow | **Over-extracted** | grind coarser · cooler water · shorter contact |
| Weak/watery but balanced | Too dilute | lower ratio (less water / more coffee) |
| Intense/overwhelming | Too strong | raise ratio |
| Flat, lifeless | Stale or too low temp | fresher beans · hotter water |

Show an "under ↔ balanced ↔ over" gauge derived from the sub-scores (high acidity +
low sweetness ⇒ under; high bitterness ⇒ over) and the suggested adjustment as a chip
that can prefill the next brew. This is the qualitative stand-in for the UC Davis
Brewing Control Chart (see note below).

### 5. Brewing landscape (Tier "Rich", gated) — "Where is my good zone?"

Two parameters vs color = score. **Do not interpolate a contour from a handful of
points** — that invents data. Instead:

- Bin the two axes into a coarse grid (e.g. 4–6 buckets each) and color each occupied
  cell by mean score, with cell opacity = number of brews (so thinly-sampled cells look
  uncertain). Empty cells stay blank — visibly "unexplored," which is information.
- Overlay individual brews as dots and the optimizer's suggested point.
- Default axis pair = the two parameters with the most spread in your data; let the user
  swap. Only offered at N≥~25.

This is brewlab's personal control chart: a target zone you're triangulating toward.

### 6. Parameter influence (Tier "Working+", gated, honest) — "What matters most?"

The draft's variance-based / fANOVA importance needs far more trials than a home
brewer has; at N=10 it just ranks whatever you happened to vary most. Use a small-N-honest
proxy instead:

- **Spearman rank correlation** between each tunable parameter and `overallRating` over
  the comparable set, shown as a ranked bar, **annotated with N and a confidence
  caveat**, and only surfaced at N≥12. Label it "directional, not proven."
- Pair each bar with the coverage from view 2, because a parameter can't show influence
  if you never varied it — low influence + low coverage means "untested," not "doesn't
  matter," and the UI must distinguish those.

### 7. Recipe evolution (opt-in) — "How did I get here?"

A vertical path of recipe versions (each node = a brew that became a new best), arrows
annotated with the single change applied and the score delta. Reads cleanly as a
"what worked" story without a real graph layout. Build from the best-so-far step points
in view 1.

### 8. Parallel coordinates (advanced, opt-in, Tier "Rich")

One polyline per brew across grind · temp · ratio · time · score, score axis colored.
Genuinely useful for spotting interactions once you have ≥25 brews; hidden by default.
At small N it's spaghetti — keep it gated.

---

## Rules (revised)

1. **One question per chart.** (kept)
2. **Comparison over absolutes** — "better/worse vs your best" beats raw scores. (kept)
3. **Relationships over tables** — raw data is a secondary logbook view. (kept)
4. **Condition before you compare** — every view is scoped to one bean + method (+ grinder
   for grind). *(new — this is the one that prevents most wrong conclusions)*
5. **Never imply more certainty than the data supports** — show N, show coverage, fade
   thin evidence, gate model-heavy views behind sample-size tiers, and never draw a trend
   line through 4 points. *(new)*
6. **Every view ends in an action** — tie diagnosis to `suggestNextBrew` and a "prefill
   next brew" affordance. *(new)*
7. **Reduce cognitive load** — defaults are single-metric, minimal-axis; complexity is
   opt-in. (kept)
8. **Parameters are primary, coffee identity is the selector** — bean/method choose the
   dataset; parameters fill the charts. (refined)

---

## Note on the UC Davis / SCA Brewing Control Chart

The real CBC plots **strength (TDS %)** on one axis and **extraction yield (%)** on the
other, aiming for roughly 1.15–1.35% TDS and ~18–22% extraction. Computing it requires a
**refractometer (TDS)** and the **beverage mass** — data we don't currently capture and
most users won't have. So:

- Treat view 4 (sensory under↔over axis) as the everyday, no-equipment proxy.
- For users who *do* own a refractometer, add optional fields `tdsPercent` and
  `beverageMassG` to `brews`; when both are present, compute extraction yield
  (`extraction% = (beverageMassG × tdsPercent) / doseG`) and offer the genuine CBC chart
  as a power-user view. Gate it on the fields being filled — don't fake the axes.

---

## Implementation notes (Expo / React Native)

- **Data is already local** (SQLite via Drizzle). All metrics compute client-side over the
  comparable set in plain JS/TS — these are tiny arrays. Use `useLiveQuery` so charts
  refresh when a brew is logged.
- **Charting:** for line / scatter / bar (views 1, 2, 3, 6) use a maintained RN chart lib
  (e.g. Victory-native (Skia) or react-native-gifted-charts). For the **landscape**
  (binned grid) and **parallel coordinates**, render with `react-native-svg` + `d3-scale`
  / `d3-shape` directly — they're just `<Rect>`s and `<Polyline>`s and that's less work
  than bending a chart lib. No interpolation library needed (we deliberately don't contour).
- **v1 scope** (build first): views 1, 2, 3, 4. They cover all four core questions, work at
  small N, and need only basic charts + the existing optimizer. Defer 5, 6, 8 behind the N
  tiers; 7 is a nice-to-have.
- Keep the existing brewlab palette (warm browns, `#7a4a2b` accent, `#fbf7f2` bg) for
  visual consistency with the current screens.

---

## Metric definitions (so views are unambiguous to build)

- **comparable_set(beanId, method[, grinderId])** — the filtered brews every view operates on.
- **enjoyment** = `overallRating` ∈ [0,10].
- **best_so_far(i)** = max enjoyment over brews 1..i ordered by `brewedAt`.
- **coverage(param)** = tried `[min,max]` over comparable_set vs valid `[ParamSpec.min, ParamSpec.max]`; the gap is "unexplored."
- **extraction_index** = f(`tastingJson`): + (acidity − sweetness), + (− bitterness) → normalize to under↔over. Tune weights empirically.
- **influence(param)** = Spearman ρ(param, enjoyment) over comparable_set; display only if N≥12 and |varied range| > 0; always show N.
- **landscape_cell(a,b)** = mean enjoyment of brews in that bin; opacity ∝ count.

---

## Key insight (kept)

The app is not visualizing coffee. It is visualizing **the search for a personal optimum
in brewing-parameter space** — under the real-world constraints of few samples, noisy
human scores, and observational (not controlled) data. The honesty about those constraints
is what makes the views trustworthy instead of decorative.
