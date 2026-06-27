/**
 * Backup / restore for the full brewlab dataset.
 *
 * Export: all four tables → JSON file → native share sheet.
 * Import: pick a JSON file → validate → insert into DB (additive, never deletes).
 *
 * Foreign key references in brews are stored as 0-based indices into the
 * exported beans/brewers/grinders arrays, then remapped to new IDs on import.
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { db } from '@/db/client';
import {
  beans,
  brewers,
  brews,
  grinders,
  type Bean,
  type Brewer,
  type Brew,
  type Grinder,
} from '@/db/schema';

// ── Serialised shapes (Dates become ISO strings in JSON) ──────────────────────

interface ExportBean {
  name: string;
  roaster: string | null;
  origin: string | null;
  process: string | null;
  variety: string | null;
  roastLevel: string | null;
  roastDate: string | null;
  altitudeMasl: number | null;
  priceCents: number | null;
  weightG: number | null;
  shop: string | null;
  url: string | null;
  notes: string | null;
  rating: number | null;
  isFavorite: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExportBrewer {
  name: string;
  method: string;
  model: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExportGrinder {
  name: string;
  type: string | null;
  minSetting: number | null;
  maxSetting: number | null;
  stepSize: number | null;
  settingUnit: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExportBrew {
  /** 0-based index into the bundle's beans array, or null. */
  _beanIdx: number | null;
  _brewerIdx: number | null;
  _grinderIdx: number | null;
  method: string;
  brewedAt: string;
  doseG: number | null;
  waterG: number | null;
  ratio: number | null;
  grindSetting: number | null;
  waterTempC: number | null;
  totalTimeS: number | null;
  bloomWaterG: number | null;
  bloomTimeS: number | null;
  paramsJson: Record<string, number | string | boolean> | null;
  stepsJson: { label: string; durationSec?: number }[] | null;
  overallRating: number | null;
  tastingJson: Record<string, number> | null;
  isPass: boolean | null;
  failReasonsJson: string[] | null;
  harmony: number | null;
  brewIntent: string | null;
  descriptorsJson: string[] | null;
  notes: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExportBundle {
  version: 1;
  exportedAt: string;
  beans: ExportBean[];
  brewers: ExportBrewer[];
  grinders: ExportGrinder[];
  brews: ExportBrew[];
}

export interface ImportResult {
  canceled: boolean;
  counts?: { beans: number; brewers: number; grinders: number; brews: number };
  error?: string;
}

// ── Serialisers ────────────────────────────────────────────────────────────────

const iso = (d: Date | null | undefined): string | null => d?.toISOString() ?? null;
const isoReq = (d: Date): string => d.toISOString();

function serializeBean(b: Bean): ExportBean {
  return {
    name: b.name,
    roaster: b.roaster,
    origin: b.origin,
    process: b.process,
    variety: b.variety,
    roastLevel: b.roastLevel,
    roastDate: iso(b.roastDate),
    altitudeMasl: b.altitudeMasl,
    priceCents: b.priceCents,
    weightG: b.weightG,
    shop: b.shop,
    url: b.url,
    notes: b.notes,
    rating: b.rating,
    isFavorite: b.isFavorite,
    archivedAt: iso(b.archivedAt),
    createdAt: isoReq(b.createdAt),
    updatedAt: isoReq(b.updatedAt),
  };
}

function serializeBrewer(b: Brewer): ExportBrewer {
  return {
    name: b.name,
    method: b.method,
    model: b.model,
    notes: b.notes,
    archivedAt: iso(b.archivedAt),
    createdAt: isoReq(b.createdAt),
    updatedAt: isoReq(b.updatedAt),
  };
}

function serializeGrinder(g: Grinder): ExportGrinder {
  return {
    name: g.name,
    type: g.type,
    minSetting: g.minSetting,
    maxSetting: g.maxSetting,
    stepSize: g.stepSize,
    settingUnit: g.settingUnit,
    notes: g.notes,
    archivedAt: iso(g.archivedAt),
    createdAt: isoReq(g.createdAt),
    updatedAt: isoReq(g.updatedAt),
  };
}

function serializeBrew(
  b: Brew,
  beanList: Bean[],
  brewerList: Brewer[],
  grinderList: Grinder[],
): ExportBrew {
  return {
    _beanIdx: b.beanId != null ? beanList.findIndex(x => x.id === b.beanId) : null,
    _brewerIdx: b.brewerId != null ? brewerList.findIndex(x => x.id === b.brewerId) : null,
    _grinderIdx: b.grinderId != null ? grinderList.findIndex(x => x.id === b.grinderId) : null,
    method: b.method,
    brewedAt: isoReq(b.brewedAt),
    doseG: b.doseG,
    waterG: b.waterG,
    ratio: b.ratio,
    grindSetting: b.grindSetting,
    waterTempC: b.waterTempC,
    totalTimeS: b.totalTimeS,
    bloomWaterG: b.bloomWaterG,
    bloomTimeS: b.bloomTimeS,
    paramsJson: b.paramsJson ?? null,
    stepsJson: b.stepsJson ?? null,
    overallRating: b.overallRating,
    tastingJson: b.tastingJson ?? null,
    isPass: b.isPass ?? null,
    failReasonsJson: b.failReasonsJson ?? null,
    harmony: b.harmony,
    brewIntent: b.brewIntent,
    descriptorsJson: b.descriptorsJson ?? null,
    notes: b.notes,
    isFavorite: b.isFavorite,
    createdAt: isoReq(b.createdAt),
    updatedAt: isoReq(b.updatedAt),
  };
}

// ── Date helpers for import ────────────────────────────────────────────────────

const fromIso = (s: string | null | undefined): Date | null =>
  s ? new Date(s) : null;
const fromIsoReq = (s: string): Date => new Date(s);

// ── Public API ─────────────────────────────────────────────────────────────────

export async function exportData(): Promise<void> {
  const [beanList, brewerList, grinderList, brewList] = await Promise.all([
    db.select().from(beans),
    db.select().from(brewers),
    db.select().from(grinders),
    db.select().from(brews),
  ]);

  const bundle: ExportBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    beans: beanList.map(serializeBean),
    brewers: brewerList.map(serializeBrewer),
    grinders: grinderList.map(serializeGrinder),
    brews: brewList.map(b => serializeBrew(b, beanList, brewerList, grinderList)),
  };

  const file = new File(Paths.cache, `brewlab-${Date.now()}.json`);
  file.write(JSON.stringify(bundle, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export brewlab backup',
      UTI: 'public.json',
    });
  } else {
    throw new Error(`Backup written to: ${file.uri}`);
  }
}

export async function importData(): Promise<ImportResult> {
  const picked = await File.pickFileAsync({ mimeTypes: 'application/json' });
  if (picked.canceled) return { canceled: true };

  const raw = await picked.result.text();
  let bundle: ExportBundle;
  try {
    bundle = JSON.parse(raw) as ExportBundle;
  } catch {
    return { canceled: false, error: 'The selected file is not valid JSON.' };
  }

  if (!bundle || bundle.version !== 1) {
    return { canceled: false, error: 'Unrecognised backup format (expected version 1).' };
  }

  const newBeanIds: number[] = [];
  const newBrewerIds: number[] = [];
  const newGrinderIds: number[] = [];

  await db.transaction(async tx => {
    for (const b of bundle.beans) {
      const r = await tx.insert(beans).values({
        name: b.name,
        roaster: b.roaster,
        origin: b.origin,
        process: b.process,
        variety: b.variety,
        roastLevel: b.roastLevel,
        roastDate: fromIso(b.roastDate),
        altitudeMasl: b.altitudeMasl,
        priceCents: b.priceCents,
        weightG: b.weightG,
        shop: b.shop,
        url: b.url,
        notes: b.notes,
        rating: b.rating,
        isFavorite: b.isFavorite,
        archivedAt: fromIso(b.archivedAt),
        createdAt: fromIsoReq(b.createdAt),
        updatedAt: fromIsoReq(b.updatedAt),
      });
      newBeanIds.push(r.lastInsertRowId as number);
    }

    for (const b of bundle.brewers) {
      const r = await tx.insert(brewers).values({
        name: b.name,
        method: b.method,
        model: b.model,
        notes: b.notes,
        archivedAt: fromIso(b.archivedAt),
        createdAt: fromIsoReq(b.createdAt),
        updatedAt: fromIsoReq(b.updatedAt),
      });
      newBrewerIds.push(r.lastInsertRowId as number);
    }

    for (const g of bundle.grinders) {
      const r = await tx.insert(grinders).values({
        name: g.name,
        type: g.type,
        minSetting: g.minSetting,
        maxSetting: g.maxSetting,
        stepSize: g.stepSize,
        settingUnit: g.settingUnit,
        notes: g.notes,
        archivedAt: fromIso(g.archivedAt),
        createdAt: fromIsoReq(g.createdAt),
        updatedAt: fromIsoReq(g.updatedAt),
      });
      newGrinderIds.push(r.lastInsertRowId as number);
    }

    for (const brew of bundle.brews) {
      await tx.insert(brews).values({
        beanId: brew._beanIdx != null ? newBeanIds[brew._beanIdx] : undefined,
        brewerId: brew._brewerIdx != null ? newBrewerIds[brew._brewerIdx] : undefined,
        grinderId: brew._grinderIdx != null ? newGrinderIds[brew._grinderIdx] : undefined,
        method: brew.method,
        brewedAt: fromIsoReq(brew.brewedAt),
        doseG: brew.doseG,
        waterG: brew.waterG,
        ratio: brew.ratio,
        grindSetting: brew.grindSetting,
        waterTempC: brew.waterTempC,
        totalTimeS: brew.totalTimeS,
        bloomWaterG: brew.bloomWaterG,
        bloomTimeS: brew.bloomTimeS,
        paramsJson: brew.paramsJson ?? undefined,
        stepsJson: brew.stepsJson ?? undefined,
        overallRating: brew.overallRating,
        tastingJson: brew.tastingJson ?? undefined,
        isPass: brew.isPass,
        failReasonsJson: brew.failReasonsJson ?? undefined,
        harmony: brew.harmony,
        brewIntent: brew.brewIntent,
        descriptorsJson: brew.descriptorsJson ?? undefined,
        notes: brew.notes,
        isFavorite: brew.isFavorite,
        createdAt: fromIsoReq(brew.createdAt),
        updatedAt: fromIsoReq(brew.updatedAt),
      });
    }
  });

  return {
    canceled: false,
    counts: {
      beans: bundle.beans.length,
      brewers: bundle.brewers.length,
      grinders: bundle.grinders.length,
      brews: bundle.brews.length,
    },
  };
}
