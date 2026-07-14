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

// ── Shared blocks ────────────────────────────────────────────────────────────

const PERCOLATION_NOTE =
  'A percolation brewer: fresh water passes through the bed and leaves. Extraction is continuous and **you can still correct it mid-brew** — pour rate, agitation and pour count are all live levers. This is the opposite of the AeroPress, where contact time is the only thing you control once water lands.';

const GRIND_NOTE =
  'Store **grind as a free-text note plus the grinder, not a number.** Settings are not comparable across grinders; a non-comparable number poisons any correlation computed from it.';

// ── V60 ──────────────────────────────────────────────────────────────────────

const v60: BrewingGuide = {
  method: 'v60',
  title: 'The V60 Pour, Step by Step',
  subtitle: 'PLACEHOLDER — conventional practice, not yet dataset-backed.',
  sections: [
    {
      id: 'overview',
      step: '0',
      title: 'The shape of a brew',
      tagline: 'Five decisions, and a bed you have to keep even.',
      blocks: [
        { kind: 'para', text: 'Configure → Dose → Water → Bloom → Pour → Drawdown.' },
        { kind: 'note', text: PERCOLATION_NOTE },
        {
          kind: 'para',
          text: 'The cone + spiral ribs + big single hole mean **the paper does not meter the flow — the coffee bed does.** Grind and pour technique therefore set contact time indirectly, which is why V60 recipes feel fussier than their parameter count suggests.',
        },
      ],
    },
    {
      id: 'configure',
      step: '1',
      title: 'Configure',
      blocks: [
        {
          kind: 'bullets',
          items: [
            '**Rinse the filter** — removes paper taste and preheats the cone. Rarely skipped.',
            '**Material** — plastic holds heat best, ceramic needs preheating, glass and metal sit between.',
            '**Filter type** — tabbed/untabbed is cosmetic; bleached vs natural is not (natural paper needs a longer rinse).',
          ],
        },
      ],
    },
    {
      id: 'dose',
      step: '2',
      title: 'Dose & grind',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Typical dose', value: '15 g' },
            { label: 'Typical ratio', value: '1:16–1:17' },
            { label: 'Grind', value: 'Medium-fine' },
          ],
        },
        { kind: 'note', text: GRIND_NOTE },
      ],
    },
    {
      id: 'water',
      step: '3',
      title: 'Water',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Typical temp', value: '92–96 °C' },
            { label: 'Minerals', value: '50–150 ppm' },
          ],
        },
        {
          kind: 'para',
          text: 'Percolation forgives heat in a way immersion does not — spent water leaves rather than sitting on the grounds, so the V60 runs ~8 °C hotter than the AeroPress median and gets away with it.',
        },
      ],
    },
    {
      id: 'bloom',
      step: '4',
      title: 'Bloom',
      tagline: 'Not optional here.',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Bloom water', value: '2–3× dose' },
            { label: 'Bloom time', value: '30–45 s' },
          ],
        },
        {
          kind: 'note',
          text: 'Unlike the AeroPress — where only 20 of 46 champions bloomed, because stirring solves the same problem — **percolation has no substitute.** Trapped CO₂ channels water around the grounds and you cannot stir it out mid-drawdown.',
        },
      ],
    },
    {
      id: 'pour',
      step: '5',
      title: 'Pour',
      blocks: [
        {
          kind: 'bullets',
          items: [
            '**Pulse** — several small pours. More agitation, more extraction, longer total.',
            '**Continuous** — one slow pour after the bloom. Gentler, faster, cleaner.',
            '**Spiral vs centre** — spiral wets the walls, centre keeps fines in the middle.',
          ],
        },
        { kind: 'facts', items: [{ label: 'Pours', value: '1–6, typically 3' }] },
      ],
    },
    {
      id: 'drawdown',
      step: '6',
      title: 'Drawdown',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Total time', value: '2:30–3:00' },
            { label: 'Final bed', value: 'Flat, no high-water ring' },
          ],
        },
        {
          kind: 'para',
          text: 'Total time is **observed, not set** — it falls out of grind, dose and pour rate. Log it as an outcome; a stall or a sprint is the diagnosis, not the dial.',
        },
      ],
    },
  ],
  starter:
    '15 g · 250 g at 94 °C · medium-fine · rinse filter · bloom 45 g / 30 s · 3 pours · drawdown by 2:45',
  debugging: [
    { symptom: 'Bitter, drying', first: 'Coarsen', then: 'Fewer/gentler pours; drop temp 2 °C' },
    { symptom: 'Sour, thin', first: 'Finer', then: 'More pours; raise temp 2 °C' },
    { symptom: 'Stalls, drains slowly', first: 'Coarsen', then: 'Less agitation; check for fines' },
    { symptom: 'Drains too fast, weak', first: 'Finer', then: 'Slow the pour' },
    { symptom: 'Grounds high on the wall', first: 'Spiral pour to wash them down', then: 'Swirl after the last pour' },
  ],
  source: 'Placeholder. Conventional ranges, no dataset behind them yet.',
};

// ── Chemex ───────────────────────────────────────────────────────────────────

const chemex: BrewingGuide = {
  method: 'chemex',
  title: 'The Chemex Pour, Step by Step',
  subtitle: 'PLACEHOLDER — conventional practice, not yet dataset-backed.',
  sections: [
    {
      id: 'overview',
      step: '0',
      title: 'The shape of a brew',
      tagline: 'A V60 with a much thicker coat.',
      blocks: [
        { kind: 'para', text: 'Configure → Dose → Water → Bloom → Pour → Drawdown.' },
        { kind: 'note', text: PERCOLATION_NOTE },
        {
          kind: 'para',
          text: 'The defining variable is **the filter — 2–3× the weight of a V60 paper.** It removes almost all oils and fines (the famous clarity), and it throttles flow enough that you must grind coarser than a cone to avoid a stall. Everything else follows from that.',
        },
      ],
    },
    {
      id: 'configure',
      step: '1',
      title: 'Configure',
      blocks: [
        {
          kind: 'bullets',
          items: [
            '**Rinse thoroughly** — thick paper, real paper taste. Longer rinse than a V60.',
            '**Three folds toward the spout** — that side is the thick one; the channel it leaves is the air vent.',
            '**Preheat** — the glass is a large thermal mass and the rinse does it for free.',
          ],
        },
      ],
    },
    {
      id: 'dose',
      step: '2',
      title: 'Dose & grind',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Typical dose', value: '30 g' },
            { label: 'Typical ratio', value: '1:16–1:17' },
            { label: 'Grind', value: 'Medium-coarse — coarser than V60' },
          ],
        },
        { kind: 'note', text: GRIND_NOTE },
      ],
    },
    {
      id: 'brew',
      step: '3',
      title: 'Water, bloom & pour',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Typical temp', value: '93–96 °C' },
            { label: 'Bloom', value: '2× dose, 45 s' },
            { label: 'Total time', value: '4:00–5:00' },
          ],
        },
        {
          kind: 'para',
          text: 'Larger batches mean a deeper bed and a longer brew. Keep the slurry moving in pulses rather than one flood — a deep bed compacts, and a compacted Chemex bed is the classic stall.',
        },
      ],
    },
  ],
  starter: '30 g · 500 g at 94 °C · medium-coarse · rinse well · bloom 60 g / 45 s · pulse to 500 g · done by 4:30',
  debugging: [
    { symptom: 'Bitter, drying', first: 'Coarsen', then: 'Drop temp 2 °C; fewer pulses' },
    { symptom: 'Sour, thin', first: 'Finer', then: 'Raise temp; more pulses' },
    { symptom: 'Stalls', first: 'Coarsen', then: 'Check the vent channel is clear' },
    { symptom: 'Papery', first: 'Rinse the filter longer', then: 'Use hotter rinse water' },
    { symptom: 'Clean but hollow', first: 'Raise dose', then: 'This is the filter — Chemex trades body for clarity' },
  ],
  source: 'Placeholder. Conventional ranges, no dataset behind them yet.',
};

// ── Kalita Wave ──────────────────────────────────────────────────────────────

const kalita: BrewingGuide = {
  method: 'kalita',
  title: 'The Kalita Wave, Step by Step',
  subtitle: 'PLACEHOLDER — conventional practice, not yet dataset-backed.',
  sections: [
    {
      id: 'overview',
      step: '0',
      title: 'The shape of a brew',
      tagline: 'A flat bed and three small holes.',
      blocks: [
        { kind: 'para', text: 'Configure → Dose → Water → Bloom → Pulse pours → Drawdown.' },
        { kind: 'note', text: PERCOLATION_NOTE },
        {
          kind: 'para',
          text: 'The flat bottom and three restricted holes make this **the forgiving pourover.** The bed depth is even, so water cannot find a short path through the middle, and the holes meter flow so your pour rate matters less. The trade: you cannot speed it up by pouring faster — it will just pool.',
        },
      ],
    },
    {
      id: 'configure',
      step: '1',
      title: 'Configure',
      blocks: [
        {
          kind: 'bullets',
          items: [
            '**Rinse and seat the wave filter** — the ribs should not collapse against the wall.',
            '**Metal vs ceramic vs glass** — metal drains fastest and loses heat fastest.',
          ],
        },
      ],
    },
    {
      id: 'dose',
      step: '2',
      title: 'Dose & grind',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Typical dose', value: '20 g' },
            { label: 'Typical ratio', value: '1:16' },
            { label: 'Grind', value: 'Medium' },
          ],
        },
        { kind: 'note', text: GRIND_NOTE },
      ],
    },
    {
      id: 'brew',
      step: '3',
      title: 'Water, bloom & pulses',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Typical temp', value: '92–94 °C' },
            { label: 'Bloom', value: '2× dose, 30 s' },
            { label: 'Pulses', value: '4–5, each ~60 g' },
            { label: 'Total time', value: '2:45–3:30' },
          ],
        },
        {
          kind: 'para',
          text: 'Pulse to keep the water level roughly constant rather than letting the bed drain dry between pours. A bed that goes dry and re-floods extracts unevenly.',
        },
      ],
    },
  ],
  starter: '20 g · 320 g at 93 °C · medium · rinse filter · bloom 40 g / 30 s · 4 pulses of 70 g · done by 3:00',
  debugging: [
    { symptom: 'Bitter, drying', first: 'Coarsen', then: 'Fewer pulses; drop temp 2 °C' },
    { symptom: 'Sour, thin', first: 'Finer', then: 'More pulses; raise temp 2 °C' },
    { symptom: 'Pools and stalls', first: 'Coarsen', then: 'Smaller pulses; check the filter is seated' },
    { symptom: 'Flat, no clarity', first: 'Raise temp', then: 'Fresher coffee — the Wave hides little' },
  ],
  source: 'Placeholder. Conventional ranges, no dataset behind them yet.',
};

// ── French Press ─────────────────────────────────────────────────────────────

const frenchpress: BrewingGuide = {
  method: 'frenchpress',
  title: 'The French Press, Step by Step',
  subtitle: 'PLACEHOLDER — conventional practice, not yet dataset-backed.',
  sections: [
    {
      id: 'overview',
      step: '0',
      title: 'The shape of a brew',
      tagline: 'The fewest decisions of any method here.',
      blocks: [
        { kind: 'para', text: 'Configure → Dose → Water → Steep → Break the crust → Plunge.' },
        {
          kind: 'note',
          text: 'Full immersion with **no pressure and a metal filter.** The plunger is a strainer, not a press — pushing hard just forces fines through the mesh and stirs the bed you spent four minutes settling. Contact time is the whole recipe.',
        },
        {
          kind: 'para',
          text: 'Because the mesh passes oils and fines, this is the **body** method. Everything the AeroPress paper filter removes, the French press keeps.',
        },
      ],
    },
    {
      id: 'dose',
      step: '1',
      title: 'Dose & grind',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Typical dose', value: '30 g' },
            { label: 'Typical ratio', value: '1:15–1:17' },
            { label: 'Grind', value: 'Coarse' },
          ],
        },
        {
          kind: 'para',
          text: 'Grind coarse for a mechanical reason, not a flavour one: fines pass the mesh and keep extracting in the cup. A French press brewed fine does not just taste bitter — it tastes bitter **and gets worse as you drink it.**',
        },
        { kind: 'note', text: GRIND_NOTE },
      ],
    },
    {
      id: 'steep',
      step: '2',
      title: 'Steep',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Typical temp', value: '93–96 °C' },
            { label: 'Steep time', value: '4:00' },
            { label: 'Range', value: '1:00–15:00' },
          ],
        },
        {
          kind: 'para',
          text: 'Four minutes is convention, not physics. Long steeps (8–15 min) at lower temperature are a real and under-explored corner — extraction slows sharply once the bed saturates, so the curve is flatter than the clock suggests.',
        },
      ],
    },
    {
      id: 'finish',
      step: '3',
      title: 'Break the crust, skim, plunge',
      blocks: [
        {
          kind: 'bullets',
          items: [
            '**Break the crust** at ~4:00 — stir the floating cap so the grounds sink.',
            '**Skim** the foam and floaters — this is where most of the bitterness and chaff sit.',
            '**Wait** 5 minutes after breaking, if you have the patience: the fines settle and the mesh has less to do.',
            '**Plunge gently**, and stop at the surface of the bed.',
            '**Decant immediately** — coffee left on the grounds keeps extracting.',
          ],
        },
        {
          kind: 'note',
          text: 'Skim-and-wait is effectively the Hoffmann method. It trades four minutes of waiting for most of the clarity a paper filter would give you.',
        },
      ],
    },
  ],
  starter: '30 g · 500 g at 94 °C · coarse · steep 4:00 · break crust, skim · wait 5:00 · plunge gently · decant at once',
  debugging: [
    { symptom: 'Bitter, harsh', first: 'Shorten the steep', then: 'Coarsen; drop temp; skim more' },
    { symptom: 'Sour, thin', first: 'Lengthen the steep', then: 'Finer; raise temp' },
    { symptom: 'Silty, gritty', first: 'Coarsen', then: 'Wait longer before plunging; leave the last cup' },
    { symptom: 'Gets worse in the cup', first: 'Decant immediately', then: 'Coarsen — fines are still extracting' },
    { symptom: 'Muddy, dull', first: 'Skim the crust', then: 'Coarsen; check grinder for fines' },
  ],
  source: 'Placeholder. Conventional ranges, no dataset behind them yet.',
};

// ── Espresso ─────────────────────────────────────────────────────────────────

const espresso: BrewingGuide = {
  method: 'espresso',
  title: 'Espresso, Step by Step',
  subtitle: 'PLACEHOLDER — conventional practice, not yet dataset-backed.',
  sections: [
    {
      id: 'overview',
      step: '0',
      title: 'The shape of a shot',
      tagline: 'Three numbers, and they are not independent.',
      blocks: [
        { kind: 'para', text: 'Prep → Dose → Distribute & tamp → Extract → Read the shot.' },
        {
          kind: 'note',
          text: '**Dose in, yield out, time.** Fix dose and yield, and *time is your read on the grind* — it is a measurement, not a setting. You cannot dial time directly; you dial grind and observe time. This is the single most common misunderstanding in espresso.',
        },
        {
          kind: 'para',
          text: 'Nine bars through a compacted bed makes this the least forgiving method here. The bed either resists evenly or it channels, and a channelled shot is sour and bitter at once — a signature you will not see in any other brewer.',
        },
      ],
    },
    {
      id: 'dose',
      step: '1',
      title: 'Dose, distribute, tamp',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Typical dose', value: '18 g (basket-dependent)' },
            { label: 'Grind', value: 'Fine' },
          ],
        },
        {
          kind: 'bullets',
          items: [
            '**Match the basket** — a stated 18 g basket wants roughly 18 g. ±2 g changes headspace and resistance.',
            '**Distribute** (WDT / needle) — this prevents channelling. It matters more than tamp pressure.',
            '**Tamp level** — level beats hard. An angled tamp is a channel.',
          ],
        },
        { kind: 'note', text: GRIND_NOTE },
      ],
    },
    {
      id: 'extract',
      step: '2',
      title: 'Extract',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Ratio', value: '1:2 (classic) · 1:1 ristretto · 1:3 lungo' },
            { label: 'Typical yield', value: '36 g from 18 g' },
            { label: 'Time', value: '25–32 s — observed' },
            { label: 'Temp', value: '90–96 °C' },
          ],
        },
        {
          kind: 'para',
          text: 'Ratio is the real dial and the only one you set directly. Tighter (1:1) is denser and more acidic; longer (1:3) is more extracted and thinner. Light roasts generally want longer ratios and hotter water than dark.',
        },
      ],
    },
    {
      id: 'read',
      step: '3',
      title: 'Read the shot',
      optional: true,
      blocks: [
        {
          kind: 'bullets',
          items: [
            '**Even, slow, honey-like start** → the bed held.',
            '**Fast blonde streaks / spraying** → channelling. Fix distribution before touching grind.',
            '**Gushes** → too coarse, or underdosed.',
            '**Drips, then nothing** → too fine, or overdosed.',
          ],
        },
      ],
    },
  ],
  starter: '18 g in · 36 g out · 27 s · 93 °C · WDT + level tamp — then adjust grind until time lands',
  debugging: [
    { symptom: 'Sour and fast', first: 'Grind finer', then: 'Raise temp; longer ratio' },
    { symptom: 'Bitter and slow', first: 'Grind coarser', then: 'Drop temp; shorter ratio' },
    { symptom: 'Sour AND bitter', first: 'Channelling — improve distribution (WDT)', then: 'Check tamp is level; check basket dose' },
    { symptom: 'Thin, no body', first: 'Shorten the ratio', then: 'Check coffee freshness (needs 7–21 days off roast)' },
    { symptom: 'Harsh, ashy', first: 'Drop temp 2 °C', then: 'Shorten the ratio; the tail is the bitter part' },
  ],
  source: 'Placeholder. Conventional ranges, no dataset behind them yet.',
};

// ── Moka pot ─────────────────────────────────────────────────────────────────

const moka: BrewingGuide = {
  method: 'moka',
  title: 'The Moka Pot, Step by Step',
  subtitle: 'PLACEHOLDER — conventional practice, not yet dataset-backed.',
  sections: [
    {
      id: 'overview',
      step: '0',
      title: 'The shape of a brew',
      tagline: 'You control heat, and almost nothing else.',
      blocks: [
        { kind: 'para', text: 'Fill → Dose → Heat → Watch the stream → Cut the heat.' },
        {
          kind: 'note',
          text: 'Steam pressure (~1–2 bar) pushes water up through the bed. **Dose is fixed by the basket, water by the valve, ratio by the pot you own.** The one real lever is the heat curve — and the one real mistake is letting it run to the end.',
        },
      ],
    },
    {
      id: 'setup',
      step: '1',
      title: 'Fill & dose',
      blocks: [
        {
          kind: 'bullets',
          items: [
            '**Preheat the water** — fill to just below the valve with water already near boiling. Cold water sits on the flame and cooks the grounds through the metal before brewing starts. This is the biggest single improvement available.',
            '**Fill the basket level, do not tamp** — moka pressure cannot push through a tamped bed.',
            '**Grind medium-fine** — between V60 and espresso.',
          ],
        },
        { kind: 'note', text: GRIND_NOTE },
      ],
    },
    {
      id: 'heat',
      step: '2',
      title: 'Heat',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Flame', value: 'Low-to-medium' },
            { label: 'Lid', value: 'Open, so you can see the stream' },
          ],
        },
        {
          kind: 'para',
          text: 'Aim for a slow, steady, honey-coloured stream. A violent sputtering jet means too much heat and a bitter cup.',
        },
      ],
    },
    {
      id: 'stop',
      step: '3',
      title: 'Cut the heat',
      blocks: [
        {
          kind: 'para',
          text: 'Pull it off **at the first gurgle**, when the stream goes pale and blonde. That sound is steam breaking through the exhausted bed, and everything after it is the bitter tail. Running the base under cold water stops it immediately.',
        },
      ],
    },
  ],
  starter: 'Preheated water to the valve · basket level, untamped · medium-fine · low flame, lid open · pull at the first gurgle',
  debugging: [
    { symptom: 'Bitter, burnt', first: 'Lower the flame', then: 'Preheat the water; pull earlier' },
    { symptom: 'Sour, weak', first: 'Grind finer', then: 'Slightly more heat' },
    { symptom: 'Sputters and sprays', first: 'Lower the flame', then: 'Preheat the water' },
    { symptom: 'Barely comes through', first: 'Coarsen', then: "Don't tamp; check the gasket and valve" },
    { symptom: 'Metallic', first: 'Clean the pot (no soap on aluminium)', then: 'Check the gasket age' },
  ],
  source: 'Placeholder. Conventional ranges, no dataset behind them yet.',
};

// ── Hario Switch ─────────────────────────────────────────────────────────────

const harioSwitch: BrewingGuide = {
  method: 'switch',
  title: 'The Hario Switch, Step by Step',
  subtitle: 'PLACEHOLDER — conventional practice, not yet dataset-backed.',
  sections: [
    {
      id: 'overview',
      step: '0',
      title: 'The shape of a brew',
      tagline: 'One valve, two brewers.',
      blocks: [
        { kind: 'para', text: 'Configure → Dose → Water → Choose a valve schedule → Drain.' },
        {
          kind: 'note',
          text: 'A V60 cone with a **stopper valve.** Closed, it is an immersion brewer with full control of contact time. Open, it is a V60. The recipe is the schedule of when it is which — and that schedule is the only parameter no other method here has.',
        },
        {
          kind: 'para',
          text: 'This makes the Switch the bridge between the two halves of your library: it can imitate a French press (closed throughout, then drain) or a V60 (open throughout), or sit anywhere between.',
        },
      ],
    },
    {
      id: 'schedule',
      step: '1',
      title: 'The valve schedule',
      blocks: [
        {
          kind: 'table',
          headers: ['Schedule', 'Behaves like', 'Use'],
          rows: [
            ['Closed → open at the end', 'French press with a paper filter', 'Body with clarity; forgiving'],
            ['Open throughout', 'V60', 'Clean, bright, fast'],
            ['Closed, open, closed', 'Hybrid ("bloom-steep-drain")', 'Even extraction on light roasts'],
            ['Open bloom → closed steep → open', 'Hybrid', 'De-gas first, then steep evenly'],
          ],
        },
        {
          kind: 'note',
          text: 'A closed phase is contact time you set exactly. An open phase is contact time the bed decides. Mixing them is the whole point.',
        },
      ],
    },
    {
      id: 'dose',
      step: '2',
      title: 'Dose, grind & water',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Typical dose', value: '20 g' },
            { label: 'Typical ratio', value: '1:15–1:16' },
            { label: 'Grind', value: 'Medium — coarser the longer the closed phase' },
            { label: 'Typical temp', value: '92–96 °C' },
            { label: 'Total time', value: '2:30–3:30' },
          ],
        },
        { kind: 'note', text: GRIND_NOTE },
      ],
    },
  ],
  starter:
    '20 g · 300 g at 94 °C · medium · rinse filter · closed: bloom 50 g / 30 s · fill to 300 g · steep to 1:45 · open · drain by 3:00',
  debugging: [
    { symptom: 'Bitter, drying', first: 'Shorten the closed phase', then: 'Coarsen; drop temp 2 °C' },
    { symptom: 'Sour, thin', first: 'Lengthen the closed phase', then: 'Finer; raise temp 2 °C' },
    { symptom: 'Slow, stalls on open', first: 'Coarsen', then: 'Less agitation during the steep' },
    { symptom: 'Muddy', first: 'Do not stir before opening the valve', then: 'Coarsen — let the bed settle first' },
  ],
  source: 'Placeholder. Conventional ranges, no dataset behind them yet.',
};

const GUIDES: Partial<Record<BrewMethod, BrewingGuide>> = {
  aeropress,
  v60,
  chemex,
  kalita,
  frenchpress,
  espresso,
  moka,
  switch: harioSwitch,
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
