# brewlab — Project Instructions for Claude Code

Read automatically every session. This file is the source of truth for what we're
building and how. Keep it updated as decisions change.

---

## ☕ What this app is

A personal coffee-brewing companion. Core loop:

1. **Log a brew** — pick a bean + a brewer (machine) + grinder, record the
   parameters (dose, water, grind, temperature, time, method-specific extras),
   and run a **timer** through the brew's stages.
2. **Rate the result** — an overall score (0–10) plus optional tasting sub-scores.
3. **Analyse** — look at how parameters relate to scores for a given bean/method.
4. **Optimize** — an optimizer proposes the next parameters to try, to converge
   on the best cup for that bean on that machine.

Each machine type is a **"profile"**: it determines which parameters exist. This
is modelled data-driven in `lib/methods.ts` — never hard-code method params in UI.

### Phasing
- **Phase 1 (now):** beans, brewers, grinders, brews CRUD; the timer; logging +
  rating; the analysis basics; the first optimizer strategies.
- **Phase 2 (keep in mind, don't build yet):** rate the **beans themselves**
  "Vivino-style" (the `beans.rating` field already exists), richer bean metadata,
  smarter optimizer (Bayesian/TPE), import/export, charts.

---

## 🧱 Architecture & stack

- **Expo SDK 56** (React Native 0.85, React 19.1), **TypeScript (strict)**.
- **Routing:** `expo-router` (file-based, in `app/`). Typed routes enabled.
- **Data:** **local-first SQLite** via `expo-sqlite` + **Drizzle ORM**.
  Single device, no backend. The DB is the source of truth; UI reads it reactively
  with Drizzle's `useLiveQuery`.
- **Validation/forms:** `zod` + `react-hook-form`.
- **Timer niceties:** `expo-keep-awake` (screen on while brewing), `expo-haptics`
  (stage transitions).
- Path alias: `@/*` → repo root (e.g. `@/db`, `@/lib/methods`).

### Data model (`db/schema.ts`)
- `beans` — coffee you buy. `beans.rating` is the **bean** rating (phase 2).
- `brewers` — your machines; `brewers.method` is the `BrewMethod` that drives params.
- `grinders` — grind settings only compare *within* one grinder, hence its own scale.
- `brews` — one brewing session: FKs to bean/brewer/grinder, common params as
  columns, method-specific params in `paramsJson`, the timed steps in `stepsJson`,
  and the result in `overallRating` (+ `tastingJson`). **`brews` is the optimizer's
  dataset.**

### Method/param system (`lib/methods.ts`)
`METHODS[method].params` is a list of `ParamSpec`. Each spec knows its type,
bounds, default, whether it maps to a `brews` column or to `paramsJson`, and
whether it's `optimizable`. The brew form, the timer seeds, and the optimizer's
search space all derive from this one structure. **Add a new method or parameter
here first**, then everything else follows.

### Optimizer (`lib/optimizer/`)
`suggestNextBrew(method, history)` returns a `Suggestion`. Two strategies ship:
`RandomSearch` (cold start) and `PerturbBest` (coordinate-style exploration).
They implement `OptimizerStrategy` — add `BayesianTPE` etc. behind the same
interface; don't change call sites. Objective = maximise `brews.overallRating`.

---

## 🗄️ Database workflow (important)

Drizzle migrations are **bundled into the app** and run on startup
(`app/_layout.tsx` via `useMigrations`).

- After **any** change to `db/schema.ts`, run: **`npm run db:generate`**
  (creates a new file under `drizzle/`). Commit the generated migration.
- Inspect data with **`npm run db:studio`**.
- `.sql` migrations are imported thanks to `babel-plugin-inline-import`
  (babel.config.js) + `sourceExts.push('sql')` (metro.config.js). Don't remove these.
- `expo-sqlite` + Drizzle is most reliable on a **development build**. Expo Go is
  fine for UI work; switch to a dev build (EAS) when exercising the DB heavily.

---

## 🛠️ Commands

```
npm start              # Metro (on Windows use: npm start -- --tunnel)
npm run android|ios|web
npm run typecheck      # tsc --noEmit  — run before committing
npm run lint
npm run db:generate    # regenerate migrations after schema changes
npm run db:studio      # browse the local DB
```

---

## 🚫 Hard rules

- **NEVER `git push`** — pushing happens from the host, not the container.
- **NEVER commit to `main`** — always a feature branch.
- **NEVER `git commit --no-verify`**.
- **NEVER `npm install -g`** unless explicitly asked.
- Don't touch `.devcontainer/` or `.claude/` unless asked.

## 🌿 Git workflow
1. `git status` first.
2. Feature branch: `git checkout -b feat/description`.
3. Small commits, format `type(scope): summary` (feat|fix|refactor|chore|docs|test).

## 💅 Code style
- Prettier on save, ESLint, 2-space indent, single quotes, max line 100.
- Always type things; avoid `any`. Prefer the inferred Drizzle types
  (`Bean`, `NewBrew`, …) and the `ParamSpec`-driven structures.

## 🧪 Before committing
- `npm run typecheck` and `npm run lint` clean.
- If you changed the schema, you ran `npm run db:generate` and committed the result.

---

## 🎯 Good next tasks
1. Turn `app/brew/new.tsx` into a real form (react-hook-form + zod) that renders
   inputs from `METHODS[method].params` and inserts a `brews` row.
2. Build the brew **timer** screen from `defaultSteps` (+ keep-awake + haptics).
3. Add create/edit screens for beans, brewers, grinders.
4. Wire `suggestNextBrew()` into the new-brew screen as "prefill suggestion".
5. Start the analysis view (score vs. each parameter for a selected bean+method).
