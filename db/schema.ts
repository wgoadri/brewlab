import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

/**
 * brewlab schema
 * --------------
 * Local-first SQLite (one device, no server). Four core tables:
 *
 *   beans     – the coffee you buy        (also rated, "Vivino-style", in phase 2)
 *   brewers   – your machines / methods   (an AeroPress, a V60… each has a `method`)
 *   grinders  – your grinder(s)           (grind settings only compare within one grinder)
 *   brews     – a single brewing session  (the params you used + the score you gave it)
 *
 * `brews` is the dataset the optimizer learns from: each row pairs a set of
 * parameters with an `overallRating` (the objective to maximise). Method-specific
 * parameters that don't deserve their own column live in `paramsJson`, keyed by
 * the ParamSpec.key values declared in lib/methods.ts.
 */

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
};

// ── Beans ────────────────────────────────────────────────────────────────────
export const beans = sqliteTable('beans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  roaster: text('roaster'),
  origin: text('origin'), // country / region
  process: text('process'), // washed | natural | honey | anaerobic | …
  variety: text('variety'), // bourbon | geisha | …
  roastLevel: text('roast_level'), // light | medium-light | medium | medium-dark | dark
  roastDate: integer('roast_date', { mode: 'timestamp' }),
  altitudeMasl: integer('altitude_masl'),
  priceCents: integer('price_cents'), // store money as integer cents (EUR)
  weightG: integer('weight_g'),
  shop: text('shop'), // where you bought it (store, online shop, market…)
  url: text('url'),
  notes: text('notes'),
  /** Phase 2: your overall rating of the BEAN itself (independent of any brew). */
  rating: real('rating'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  archivedAt: integer('archived_at', { mode: 'timestamp' }), // null = active
  ...timestamps,
});

// ── Brewers (machines / methods) ─────────────────────────────────────────────
export const brewers = sqliteTable('brewers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // "My AeroPress", "Hario V60-02"
  /** Drives which parameter profile applies — see BrewMethod in lib/methods.ts. */
  method: text('method').notNull(), // aeropress | v60 | chemex | frenchpress | espresso | moka | …
  model: text('model'),
  notes: text('notes'),
  archivedAt: integer('archived_at', { mode: 'timestamp' }),
  ...timestamps,
});

// ── Grinders ─────────────────────────────────────────────────────────────────
export const grinders = sqliteTable('grinders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type'), // burr | blade | hand
  // The grinder's own dial scale, so the optimizer can stay within valid bounds.
  minSetting: real('min_setting'),
  maxSetting: real('max_setting'),
  stepSize: real('step_size'),
  notes: text('notes'),
  archivedAt: integer('archived_at', { mode: 'timestamp' }),
  ...timestamps,
});

// ── Brews (the core log + result) ────────────────────────────────────────────
export const brews = sqliteTable('brews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  beanId: integer('bean_id').references(() => beans.id),
  brewerId: integer('brewer_id').references(() => brewers.id),
  grinderId: integer('grinder_id').references(() => grinders.id),
  /** Denormalised from the brewer for easy filtering/grouping. */
  method: text('method').notNull(),
  brewedAt: integer('brewed_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),

  // Common parameters (present for almost every method) ----------------------
  doseG: real('dose_g'),
  waterG: real('water_g'),
  ratio: real('ratio'), // waterG / doseG (store it so the optimizer can read it directly)
  grindSetting: real('grind_setting'), // on the chosen grinder's scale
  waterTempC: real('water_temp_c'),
  totalTimeS: integer('total_time_s'),
  bloomWaterG: real('bloom_water_g'),
  bloomTimeS: integer('bloom_time_s'),

  /** Method-specific params, keyed by ParamSpec.key (orientation, pressureBar, pours…). */
  paramsJson: text('params_json', { mode: 'json' }).$type<Record<string, number | string | boolean>>(),
  /** The timed steps actually followed: [{ label, durationSec }]. */
  stepsJson: text('steps_json', { mode: 'json' }).$type<{ label: string; durationSec?: number }[]>(),

  // Result -------------------------------------------------------------------
  /** THE optimization objective. Suggested scale: 0–10. */
  overallRating: real('overall_rating'),
  /** Optional sub-scores: { aroma, acidity, sweetness, body, bitterness, aftertaste, balance }. */
  tastingJson: text('tasting_json', { mode: 'json' }).$type<Record<string, number>>(),
  notes: text('notes'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),

  ...timestamps,
});

// ── Relations (enables db.query.* relational fetches) ─────────────────────────
export const beansRelations = relations(beans, ({ many }) => ({
  brews: many(brews),
}));

export const brewersRelations = relations(brewers, ({ many }) => ({
  brews: many(brews),
}));

export const grindersRelations = relations(grinders, ({ many }) => ({
  brews: many(brews),
}));

export const brewsRelations = relations(brews, ({ one }) => ({
  bean: one(beans, { fields: [brews.beanId], references: [beans.id] }),
  brewer: one(brewers, { fields: [brews.brewerId], references: [brewers.id] }),
  grinder: one(grinders, { fields: [brews.grinderId], references: [grinders.id] }),
}));

// ── Inferred types (use these throughout the app) ────────────────────────────
export type Bean = typeof beans.$inferSelect;
export type NewBean = typeof beans.$inferInsert;
export type Brewer = typeof brewers.$inferSelect;
export type NewBrewer = typeof brewers.$inferInsert;
export type Grinder = typeof grinders.$inferSelect;
export type NewGrinder = typeof grinders.$inferInsert;
export type Brew = typeof brews.$inferSelect;
export type NewBrew = typeof brews.$inferInsert;
