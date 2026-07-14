/**
 * Brewing guides — structured, method-keyed reference content.
 * ------------------------------------------------------------
 * Rendered natively by `app/guide/[method].tsx` (no markdown dependency) and
 * linked contextually from the recipe form. Content is data, not prose, so the
 * same ranges can later feed inline form hints / analysis reference bands.
 *
 * The AeroPress guide distils 46 World AeroPress Championship podium recipes
 * (2009–2025). See docs/aeropress_brewing_guide.md for the long-form source.
 */

import type { BrewMethod } from './methods';

export type GuideBlock =
  | { kind: 'para'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'facts'; items: { label: string; value: string }[] }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'note'; text: string };

export interface GuideSection {
  /** Stable id, also the scroll-nav anchor. */
  id: string;
  /** Step number in the flow ("0"–"9"). */
  step: string;
  title: string;
  tagline?: string;
  /** Shows an "optional" badge — the step can be skipped. */
  optional?: boolean;
  blocks: GuideBlock[];
}

export interface DebugRow {
  symptom: string;
  first: string;
  then: string;
}

export interface BrewingGuide {
  method: BrewMethod;
  title: string;
  subtitle: string;
  sections: GuideSection[];
  /** The "defensible median" starting recipe. */
  starter: string;
  debugging: DebugRow[];
  source: string;
}

const aeropress: BrewingGuide = {
  method: 'aeropress',
  title: 'The AeroPress Brew, Step by Step',
  subtitle:
    'A reference for building recipes. Ranges are drawn from 46 World AeroPress Championship podium recipes, 2009–2025.',
  sections: [
    {
      id: 'overview',
      step: '0',
      title: 'The shape of a brew',
      tagline: 'Nine decisions, always in the same order.',
      blocks: [
        {
          kind: 'para',
          text: 'Every AeroPress recipe, from 2009 to today, is the same nine decisions in the same order: Configure → Dose → Water → Pour → Agitate → Steep → Press → Dilute → Cool. Some steps are skippable, some are single numbers, some are whole techniques.',
        },
        {
          kind: 'note',
          text: 'The AeroPress is an immersion brewer with a pressure-assisted drain. Coffee sits in water for a fixed time, then you push. Unlike a pourover you cannot correct mid-brew — once water and coffee touch, extraction is running and your only lever is **when to stop it**. Hence the obsession with timing and the caution with temperature.',
        },
        {
          kind: 'para',
          text: 'There are **two archetypes**, and choosing between them determines most of the rest:',
        },
        {
          kind: 'table',
          headers: ['', 'Full brew', 'Concentrate + bypass'],
          rows: [
            ['Idea', 'Brew the cup you drink', 'Brew too strong, then dilute'],
            ['Brew water', '200–280 g', '94–160 g'],
            ['Bypass', 'none', '12–200 g'],
            ['Ratio', '12–16', '8–11'],
            ['Era', 'pre-2014', 'post-2019 (8 of last 9 podiums)'],
          ],
        },
        {
          kind: 'para',
          text: 'Concentrate + bypass won because it decouples two things a full brew conflates: you extract at whatever ratio tastes best, then set strength afterward with a number that never touches the coffee bed. If your app has a "too strong / too weak" loop, **bypass is the parameter that should absorb it.**',
        },
      ],
    },
    {
      id: 'configure',
      step: '1',
      title: 'Configure',
      tagline: 'Decisions made before coffee or water exist.',
      blocks: [
        {
          kind: 'bullets',
          items: [
            '**Upright** — brewer sits on the cup; water drains as you pour. Less control; fine grinds can stall or channel.',
            '**Inverted** — brewer upside down, cap last; nothing drains until you flip. Full control of contact time.',
            '**Upright + vacuum** — pull the plunger up slightly to halt the drip: inverted-like control without the flip.',
          ],
        },
        {
          kind: 'facts',
          items: [{ label: 'Position', value: '29 inverted · 12 upright · 5 unstated' }],
        },
        {
          kind: 'note',
          text: 'Position is a **control preference, not a flavour lever.** The 2025 champion brewed upright; upright winners appear in every era.',
        },
        {
          kind: 'table',
          headers: ['Filter', 'Effect'],
          rows: [
            ['1× paper', 'Baseline — clean, most fines and oils removed'],
            ['2× paper', 'Slower flow, longer press (6 of last 9 podiums)'],
            ['Metal', 'Passes oils and fines; heavier body — never used alone'],
            ['Flow-control cap', 'Meters the press (2025 1st & 3rd)'],
          ],
        },
        {
          kind: 'para',
          text: 'Filter prep: rinsed-hot is the default (removes paper taste, preheats). Dry keeps the system cooler; a blind press preheats everything at once. **Preheat matters more than it sounds** on thick plastic and small doses of low-temp water.',
        },
      ],
    },
    {
      id: 'dose',
      step: '2',
      title: 'Dose',
      tagline: 'The mass of dry coffee.',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Range', value: '12–35 g' },
            { label: 'Median', value: '18 g' },
          ],
        },
        {
          kind: 'para',
          text: '18 g is now near-universal — but that is competition geometry (a 200 ml serve from a 250 ml chamber), not a discovery. At home, dose is yours to move.',
        },
        {
          kind: 'note',
          text: 'Store **grind as a free-text note plus the grinder, not a number.** "31 clicks Comandante" and "7.3 on an EK43" are mutually untranslatable — a non-comparable number poisons any correlation you compute.',
        },
        {
          kind: 'para',
          text: 'Advanced moves on the grounds: **sifting out fines** (the most common recent trick — fines over-extract and muddy the cup), chaff removal, and **split dose** (a coarse main plus a pinch of fines for a fast, intense fraction).',
        },
      ],
    },
    {
      id: 'water',
      step: '3',
      title: 'Water',
      tagline: 'Temperature is the strongest signal in the dataset.',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Temp range', value: '75–100 °C' },
            { label: 'Median', value: '85 °C' },
          ],
        },
        {
          kind: 'para',
          text: 'The field sits ~8 °C below filter-coffee convention (~93 °C) and has for seventeen years. With immersion plus a press you cannot escape over-extraction, so **temperature is the brake.** It drifts up with concentrate brewing (81 °C median in 2009–13 → 89 °C in 2023–25).',
        },
        {
          kind: 'bullets',
          items: [
            '**Descending** — bloom hot, pour cooler: front-load extraction then coast.',
            '**Cold steep, hot finish** — pulls acids and sugars, not bitterness.',
            '**Hot brew, cool dilute** — room-temp / 50 °C bypass doubles as a cooling stage.',
          ],
        },
        {
          kind: 'para',
          text: 'Minerals: every modern podium specifies water (30–125 ppm TDS). Worth a field, not worth modelling — it is a constant per user. The key split is **total water = brew water + bypass water**; brew water touches coffee, bypass never does.',
        },
      ],
    },
    {
      id: 'pour',
      step: '4',
      title: 'Pour',
      tagline: 'Single, bloom + main, or multi-stage.',
      blocks: [
        {
          kind: 'note',
          text: 'Only **20 of 46 recipes bloom.** In an immersion brewer you then stir, agitation solves the same de-gassing problem more directly — bloom and vigorous agitation are largely substitutes, and the modern field chose agitation.',
        },
        {
          kind: 'facts',
          items: [
            { label: 'Bloom water', value: '40–60 g' },
            { label: 'Bloom time', value: '25–60 s' },
          ],
        },
        {
          kind: 'para',
          text: 'Technique (spiral, centre-pour turbulence, slow controlled pour, a diffuser) is real but small — a correction to evenness, not a primary lever.',
        },
      ],
    },
    {
      id: 'agitate',
      step: '5',
      title: 'Agitate',
      tagline: 'The most under-discussed parameter.',
      blocks: [
        {
          kind: 'para',
          text: '**40 of 46 recipes agitate** — higher adoption than bloom, bypass, or any filter choice. With temperature capped at ~85 °C and time at ~2 min, agitation is one of the few remaining ways to push extraction up.',
        },
        {
          kind: 'bullets',
          items: [
            '**Stir** — spoon/chopstick/paddle. Most aggressive.',
            '**Swirl** — rotate the brewer. Gentler, settles the bed flat.',
            '**Turbulent wiggle** — shake laterally.',
            '**None** — it can be done (Johnsen, 2012, 2nd).',
          ],
        },
        {
          kind: 'facts',
          items: [{ label: 'Intensity', value: '3–35 stirs' }],
        },
        {
          kind: 'para',
          text: 'Pattern (NSEW, "back to front", circular) aims for coverage rather than spinning the middle. Timing: after the pour is common; some stir mid-steep or swirl just before pressing to settle the bed.',
        },
      ],
    },
    {
      id: 'steep',
      step: '6',
      title: 'Steep',
      tagline: 'From "water meets coffee" to "press begins".',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Range', value: '~15 s – 3:30' },
            { label: 'Typical press start', value: '1:30–2:10' },
          ],
        },
        {
          kind: 'para',
          text: 'Inverted, before you flip: attach the cap, **press out the excess air** until liquid reaches the filter (skip this and trapped air pushes coffee out on the flip), optionally swirl to settle. Flip 5–10 s before the press.',
        },
        {
          kind: 'note',
          text: 'Vacuum hold (upright only): insert the plunger and pull up slightly to freeze the brew — the seal stops the drip.',
        },
      ],
    },
    {
      id: 'press',
      step: '7',
      title: 'Press',
      tagline: 'Not neutral time — extraction continues throughout.',
      blocks: [
        {
          kind: 'facts',
          items: [{ label: 'Duration', value: '20–75 s' }],
        },
        {
          kind: 'para',
          text: 'The last water passes the most-exhausted bed, so a slow press adds extraction and the bed’s bitter tail; a fast press takes less of both. Press duration is largely a **consequence** of grind, filter count and how hard you push — store it as observed, not prescribed. Push hard enough to compact the bed and you have raised resistance and are extracting harder than you meant to.',
        },
        {
          kind: 'table',
          headers: ['Endpoint', 'Meaning'],
          rows: [
            ['Stop before the hiss', 'Stop at the slurry — leave the most bitter liquid'],
            ['Press through the hiss', 'Push air through the puck — maximum yield'],
            ['Leave a fixed slurry', 'A measured version of "stop before the hiss"'],
            ['Target an output weight', 'Press to N grams — makes yield an input'],
          ],
        },
        {
          kind: 'note',
          text: 'If you brew concentrate + bypass, **target an output weight** — it is the only endpoint that makes your dilution reproducible.',
        },
      ],
    },
    {
      id: 'dilute',
      step: '8',
      title: 'Dilute',
      tagline: 'Bypass: water added that never touched coffee.',
      optional: true,
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Bypass range', value: '12–200 g' },
            { label: 'Seen in', value: '8 of last 9 podiums' },
          ],
        },
        {
          kind: 'para',
          text: 'Bypass temperature is a second, independent knob: hot maintains drinking temp; room-temperature dilutes and cools at once. Some recipes bypass twice — once room-temp for cooling, once hot for strength.',
        },
        {
          kind: 'note',
          text: 'Target an absolute weight (e.g. 152 g) or a TDS. Recorded championship strengths run 1.30–1.45% — the strong end of the SCA norm (~1.15–1.35%), or beyond it.',
        },
      ],
    },
    {
      id: 'cool',
      step: '9',
      title: 'Cool',
      tagline: 'Skipped at home; non-negotiable in competition.',
      optional: true,
      blocks: [
        {
          kind: 'para',
          text: 'Coffee tastes different at 80 °C than at 55 °C — perceived acidity and sweetness both rise as it drops. Judges taste at drinking temperature, so competitors **engineer** the arrival temperature. Recorded targets: 54–60 °C.',
        },
        {
          kind: 'bullets',
          items: [
            'Swirl in an open vessel, or pour from height',
            'Decant back and forth between two servers',
            'Room-temperature bypass — dilute and cool in one move',
            'Chilled serving vessel, or ice',
          ],
        },
      ],
    },
  ],
  starter:
    '18 g · 100 g brew water at 88 °C · medium, fines sifted · 2 paper filters rinsed · inverted · stir 10× · press at 1:30 over 30 s to ~70 g output · bypass to 160 g · swirl to 60 °C',
  debugging: [
    { symptom: 'Bitter, drying, hollow', first: 'Drop temperature 3 °C', then: 'Coarsen; press earlier; stop before the hiss' },
    { symptom: 'Sour, thin, salty', first: 'Raise temperature 3 °C', then: 'More agitation; longer steep; finer' },
    { symptom: 'Correct but too strong', first: 'More bypass', then: 'Don’t touch anything else' },
    { symptom: 'Correct but too weak', first: 'Less bypass, or more dose', then: 'Don’t touch anything else' },
    { symptom: 'Muddy, dull', first: 'Sift the fines', then: 'Extra paper filter' },
    { symptom: 'Flat, boring', first: 'Cool it further before tasting', then: 'Check water minerals' },
  ],
  source:
    'Source: 46 World AeroPress Championship podium recipes, 2009–2025 (worldaeropresschampionship.com, aeropress.com). Ranges are what champions did, not what’s possible.',
};

const GUIDES: Partial<Record<BrewMethod, BrewingGuide>> = {
  aeropress,
};

/** All guides that exist, for listing (e.g. the Gear tab). */
export const GUIDE_LIST: BrewingGuide[] = Object.values(GUIDES).filter(
  (g): g is BrewingGuide => g != null,
);

/** The guide for a method, if one exists. */
export function getGuide(method: BrewMethod): BrewingGuide | undefined {
  return GUIDES[method];
}

/** Whether a method has a brewing guide (drives the contextual form link). */
export function hasGuide(method: BrewMethod): boolean {
  return method in GUIDES;
}
