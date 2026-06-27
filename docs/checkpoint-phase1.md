# Phase 1 Checkpoint

**Date:** 2026-06-27  
**Branch:** `feat/import-export` (to be merged → main)

---

## What's built (Phase 1 complete)

### Data layer
- **Schema** (`db/schema.ts`): `beans`, `brewers`, `grinders`, `brews` tables
- **Migrations**: 4 Drizzle migrations bundled and auto-run on startup
- **Method/param system** (`lib/methods.ts`): data-driven `METHODS[method].params`; each `ParamSpec` carries type, bounds, default, column mapping, optimizability flag

### Screens & navigation
| Screen | Route |
|---|---|
| Brew list | `(tabs)/index` |
| New brew form | `brew/new` |
| Brew timer | `brew/timer` |
| Brew detail | `brew/[id]` |
| Rate a brew | `brew/rate` |
| Bean list | `(tabs)/beans` |
| Bean detail/edit | `beans/[id]` |
| New bean | `beans/new` |
| Gear (brewers + grinders) | `(tabs)/brewers` |
| Brewer detail/edit | `brewers/[id]` |
| New brewer | `brewers/new` |
| Grinder detail/edit | `grinders/[id]` |
| New grinder | `grinders/new` |
| **Analysis** | `(tabs)/analysis` |

### Analysis tab (M8)
Four views, progressive disclosure by comparable-set size:
1. **Progress** (≥1 brew): best-so-far line + raw score dots (SVG)
2. **Parameter explorer** (≥3): scatter by param, coverage band, optimizer suggestion marker (SVG)
3. **Compare + suggest** (≥3): last-vs-best delta table + `suggestNextBrew` output + "Prefill next brew" button
4. **Sensory diagnosis** (latest brew with tasting): extraction-index gauge + adjustment chips

### Optimizer (`lib/optimizer/`)
- `RandomSearch` (cold start, <3 rated brews)
- `PerturbBest` (coordinate-descent around best brew, ≥3 rated brews)
- Interface: `suggestNextBrew(method, history: BrewObservation[]) → Suggestion`
- Prefill wiring: `lib/brewSuggestion.ts` + `brew/new.tsx` lazy-init

### Import / export
- `lib/exportImport.ts`: full backup to/from JSON via expo-file-system v2 + expo-sharing
- Additive import (never deletes), wrapped in a DB transaction
- UI: Export/Import buttons in the Gear tab Data section

### Design system
- Theme tokens in `lib/theme.ts`: `Colors`, `Spacing`, `Radii`
- Sliders for bounded numeric params (`@react-native-community/slider`)
- Per-grinder dial scale: `settingUnit`, `minSetting`, `maxSetting`, `stepSize`

---

## Key libraries
| Package | Purpose |
|---|---|
| `expo-sqlite` + `drizzle-orm` | Local-first DB |
| `expo-router` | File-based navigation |
| `react-hook-form` + `zod` | Forms + validation |
| `@react-native-community/slider` | Numeric sliders |
| `react-native-svg` | Charts |
| `expo-file-system` (v2) | File I/O for backup |
| `expo-sharing` | Share sheet |
| `expo-keep-awake` | Screen-on during timer |
| `expo-haptics` | Timer stage transitions |

---

## Phase 2 roadmap

### Bayesian optimizer (high value, some complexity)
- Add `BayesianTPE` strategy implementing `OptimizerStrategy`
- Plug in behind `suggestNextBrew()` — no call-site changes
- Library options: implement a simple GP/TPE in pure TS, or use `ml-matrix` + `gaussian-process` npm packages
- Gate: switch from `PerturbBest` when history ≥ 10 rated brews

### Bean ratings ("Vivino-style")
- The `beans.rating` column already exists
- Add a rating UI to `beans/[id].tsx` (star picker or slider 0–10)
- Show aggregate bean ratings on the bean list

### Richer bean metadata
- `beans` table already has: roaster, origin, process, variety, roastLevel, roastDate, altitudeMasl, priceCents, weightG, shop, url
- Build `beans/new.tsx` and `beans/[id].tsx` forms with all these fields
- Currently only `name` and `notes` are surfaced in the forms

### Charts (phase 2 analysis)
- Score-over-time per bean (long-term progression)
- Head-to-head: same bean, two methods
- Parameter importance ranking (simple correlation coefficient)

### Smarter timer
- Per-method default steps defined in `METHODS[method].defaultSteps`
- Allow step editing before starting
- Add a "pause" state

---

## Architecture decisions to preserve
- **Never hard-code method params in UI** — always derive from `METHODS[method].params`
- **`ParamSpec.column`** maps to a Drizzle column; params without `column` go in `paramsJson`
- **Drizzle migrations** are bundled in the app; run `npm run db:generate` after any schema change
- **`brewSuggestion.ts` module-level store** pattern for cross-navigation state (same as `brewDraft.ts`)
- **`useLiveQuery`** from `drizzle-orm/expo-sqlite` for all reactive DB reads
