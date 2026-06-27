# Adding a brew method (or editing an existing one)

Everything that drives the brew form, the timer, and the optimizer lives in a
single file: **`lib/methods.ts`**. No UI code needs to change when you add a
method or tweak its steps.

---

## 1. The two structures you edit

### `MethodDef` — one per method

```ts
interface MethodDef {
  id: BrewMethod;        // unique key, must match the union type below
  label: string;         // displayed in the UI
  timerMode: 'guided' | 'freeform';
  params: ParamSpec[];   // drives the brew form + optimizer search space
  defaultSteps: BrewStepTemplate[]; // drives the timer
}
```

`timerMode`:
- `'guided'` — countdown per step, auto-advances at 0 with a haptic (AeroPress, V60, …).
- `'freeform'` — count-up stopwatch, manual advance only (Espresso, Moka).

### `ParamSpec` — one per parameter

```ts
interface ParamSpec {
  key: string;           // unique within the method; used as form field name
  label: string;         // displayed in the form
  type: 'number' | 'int' | 'enum' | 'boolean' | 'text';
  unit?: string;         // e.g. 'g', '°C', 's'
  min?: number;
  max?: number;
  step?: number;
  options?: string[];    // for type 'enum'
  default?: number | string | boolean;
  column?: keyof Brew;   // if set → stored in that column on the brews table
                         // if omitted → stored in brews.paramsJson
  optimizable?: boolean; // true → optimizer is allowed to tune this dimension
  help?: string;         // tooltip / hint shown in the form
}
```

**`column` is the key distinction.** Common parameters (dose, water, temp, grind…)
already have matching columns on the `brews` table and are listed at the top of
`lib/methods.ts` as reusable helpers (`dose()`, `water()`, `grind`, `temp()`, …).
Anything method-specific that doesn't deserve its own column can omit `column`; it
will be stored automatically in `brews.paramsJson`.

---

## 2. Adding a new method

### Step 1 — extend the `BrewMethod` union type

```ts
export type BrewMethod =
  | 'aeropress'
  | 'v60'
  // ... existing methods ...
  | 'clever';           // ← add your new id here
```

### Step 2 — add a `MethodDef` entry in `METHODS`

```ts
export const METHODS: Record<BrewMethod, MethodDef> = {
  // ... existing methods ...

  clever: {
    id: 'clever',
    label: 'Clever Dripper',
    timerMode: 'guided',
    params: [
      dose(15),
      water(250),
      grind,
      temp(93),
      totalTime(210),
      ...bloom,
      {
        key: 'steepTimeS',
        label: 'Steep time',
        type: 'int',
        unit: 's',
        min: 60,
        max: 300,
        step: 5,
        default: 120,
        optimizable: true,
        // no `column` → goes into paramsJson
      },
    ],
    defaultSteps: [
      { label: 'Bloom', durationSec: 45 },
      { label: 'Fill & steep', durationSec: 120 },
      { label: 'Open valve & drawdown', durationSec: 60 },
    ],
  },
};
```

That's it. The brew form, timer, and optimizer all pick it up automatically.

### Step 3 — nothing else to do

| What | How it works |
|---|---|
| Brew form | Renders inputs from `params` via `ParamInput` |
| Bean picker | Unaffected |
| Timer | Reads `defaultSteps` + `timerMode` |
| Optimizer | Tunes params where `optimizable: true` and type is `number`, `int`, or `enum` |
| DB storage | Column params → direct columns; others → `paramsJson` |
| Brew detail | Reads `METHODS[method].params` to display values |

---

## 3. Editing timer steps for an existing method

Only touch `defaultSteps` inside the method's `MethodDef`.

```ts
aeropress: {
  // ...
  defaultSteps: [
    { label: 'Add coffee + bloom', durationSec: 30 },
    { label: 'Fill & steep',       durationSec: 60 },  // ← change duration here
    { label: 'Stir',               durationSec: 10 },
    { label: 'Plunge',             durationSec: 30 },  // ← reorder by moving lines
  ],
},
```

Rules:
- **Order** = execution order. Move objects up/down to reorder steps.
- **`durationSec`** is the countdown target for `guided` mode, or the suggested
  target displayed in `freeform` mode. Omit it for open-ended steps (the timer
  will count up and wait for a manual tap).
- **Adding a step**: add a new object anywhere in the array.
- **Removing a step**: delete its object.

The timer picks up the new steps immediately — no other file needs editing.

---

## 4. Adding a method-specific parameter that needs its own DB column

If a new parameter is used across many methods and you want it queryable/filterable
as a real column (not buried in JSON):

1. Add the column to `beans`/`brews` in **`db/schema.ts`**.
2. Run **`npm run db:generate`** to create the migration.
3. Commit the generated file under `drizzle/`.
4. Add the `ParamSpec` with `column: 'yourNewColumn'` in `lib/methods.ts`.

The brew form and optimizer will use the new column automatically.

---

## 5. Changing `timerMode` for an existing method

Just change the `timerMode` field:

```ts
espresso: {
  timerMode: 'guided', // was 'freeform' — now counts down and auto-advances
  // ...
}
```

No other change needed.
