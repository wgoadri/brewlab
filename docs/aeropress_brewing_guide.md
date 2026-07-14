# The AeroPress Brew, Step by Step

*A reference for building recipes. Ranges are drawn from 46 World AeroPress Championship podium recipes, 2009–2025.*

---

## 0. The shape of a brew

Every AeroPress recipe, from 2009 to today, is the same nine decisions in the same order:

```
CONFIGURE → DOSE → WATER → POUR → AGITATE → STEEP → PRESS → DILUTE → COOL
```

Some steps are skippable. Some are single numbers, some are whole techniques. What follows walks each one: what it is, what it does, what the range looks like, and whether you can leave it out.

Two things to hold onto before starting:

**The AeroPress is an immersion brewer with a pressure-assisted drain.** Coffee sits in water for a fixed time, then you push. Unlike a pourover, you cannot correct mid-brew — once water and coffee are in contact, extraction is running and your only remaining lever is *when to stop it*. This is why AeroPress recipes are so obsessive about timing and so conservative about temperature.

**There are two archetypes**, and choosing between them determines most of the rest:

| | **Full brew** | **Concentrate + bypass** |
|---|---|---|
| Idea | Brew the cup you drink | Brew something too strong, then dilute |
| Brew water | 200–280 g | 94–160 g |
| Bypass | none | 12–200 g |
| Ratio | 12–16 | 8–11 |
| Era | dominant pre-2014 | dominant post-2019 (8 of last 9 podiums) |
| Trade-off | simple, fewer variables | separates strength from extraction |

The second archetype won because it decouples two things the first conflates. In a full brew, adding water to make the cup weaker also changes how much you extract. With bypass, you extract at whatever ratio tastes best, then set strength afterward with a number that has no effect on the coffee bed. If your app has a "too strong / too weak" feedback loop, bypass is the parameter that should absorb it.

---

## 1. Configure

Decisions made before coffee or water exist. Cheap to change, easy to over-weight.

### 1.1 Brewer position

**Upright** — cap and filter on the bottom, brewer sits on the cup. Water starts draining the moment you pour. You're brewing against a clock you don't fully control, and a fine grind can stall or channel.

**Inverted** — brewer upside down, plunger at the bottom, cap goes on last. Nothing drains until you flip. Full control of contact time.

**Upright + vacuum** — a hybrid. Insert the plunger a centimetre and pull up slightly; the vacuum halts the drip and gives you inverted-like control without the flip. Simon Derutter used it to place 2nd in 2022, Leon Zhang for 3rd in 2023.

*Range:* 29 inverted, 12 upright, 5 unstated. Inverted looks dominant — but the 2025 champion brewed upright, and upright winners appear in every era. **This is a control preference, not a flavour lever.** If you're not using long steeps or fine grinds, upright costs you nothing and skips a flip.

### 1.2 Filter media

| Media | Effect | Seen in |
|---|---|---|
| 1× paper | Baseline. Clean, most fines and oils removed | the default; ~half of all recipes |
| 2× paper | Slower flow, longer press, marginally cleaner | 6 of the last 9 podiums |
| Aesir paper | Thicker competition paper, slower | 2019 1st/3rd, 2024 1st |
| Metal | Passes oils and fines. Heavier body, less clarity | rare, and never alone — always paired with paper |
| Cloth (cotton/linen) | Between paper and metal | Leon Zhang, 2023 |
| Flow control cap | Valve stops drip in upright, lets you meter the press | 2025 1st and 3rd |

Stacking papers is currently fashionable. Be honest about the mechanism: it slows the press, which is a *time* change, not a filtration change. If you want a slower press, you can also just press slower.

### 1.3 Filter prep

- **Rinsed, hot** — removes paper taste, preheats the cap. The default.
- **Rinsed, cold** — Xiaobo Zhang, 2018. Keeps the system cooler.
- **Dry** — two 2022 podiums. Marginal paper flavour, no thermal loss.
- **Blind press** — press hot water through before brewing to preheat everything at once.

### 1.4 Preheat

Optional. Matters more than it sounds: the AeroPress is thick plastic, and a cold chamber can pull several degrees out of a small dose of water. If you're brewing at 80 °C, that's a real fraction of your temperature. Note the counter-example — Carolina Ibarra Garay explicitly *refused* to preheat her serving vessel in 2018, using it as a cooling stage instead.

---

## 2. Dose

The mass of dry coffee.

*Range:* 12 g (Tibor Varady, 2013) to 35 g (Paulina Miczka, 2017). **Median 18 g**, and 18 g exactly is now near-universal — every podium since 2021 except one used it.

Don't read that convergence as a discovery. The competition requires a 200 ml minimum serve from a 250 ml chamber, and 18 g is roughly what that geometry allows. At home, dose is yours to move.

### 2.1 Grind

The parameter everyone reports and nobody reports usably. The dataset contains "31 clicks Comandante," "7.3 on an EK43," "900 microns," "coarser than filter," and "quite coarse" — mutually untranslatable.

What can be said: AeroPress grind spans a wider useful range than any other brewer, from espresso-adjacent to coarser-than-French-press, because you control contact time absolutely. Finer = faster extraction, harder press, higher stall risk. Coarser = slower extraction, needs time or heat or agitation to compensate.

**Store grind as a free-text note plus the grinder, not as a number.** A number that isn't comparable across grinders will poison any correlation you compute from it.

### 2.2 Grind processing (optional)

Things competitors do to the grounds before brewing:

- **Sifting out fines** — Némo Pop sifted at 200 µm in 2025; Jibbi Little removed 100–200 µm particles in 2022. Fines over-extract and muddy the cup. This is the single most common "advanced" move in recent podiums.
- **Chaff removal** — blow it off after grinding. Chaff is bitter and papery.
- **Bean sorting** — Jeff Verellen, 2014, discarded pale, oversized, undersized and ear-shaped beans by hand. Extreme, and it won 3rd.
- **Split dose** — two grinds in one brew. Yusuke Narisawa used 28 g coarse plus 1.5 g powder-fine (2017). Xiaobo Zhang added 1 g of espresso-fine coffee just before pressing (2018). Tay Wipvasutt held back 2 g of his 18 g and added it at 0:45 (2023, 1st). The logic is a deliberately uneven extraction curve — the fines contribute a fast, intense fraction the coarse grounds can't.

---

## 3. Water

### 3.1 Temperature

**The strongest signal in the entire dataset.** Median 85 °C. Range 75–100 °C. Filter coffee convention is ~93 °C; the AeroPress field sits eight degrees below it and has for seventeen years.

The reason is structural. Immersion plus a press means you cannot escape over-extraction — there's no bypass channel, no drawdown to cut short, and pressure forces water through the bed at the end regardless. Temperature is the brake.

There's a visible drift upward: median 81 °C in 2009–13, 89 °C in 2023–25. That tracks the move to concentrate brewing — shorter contact with less water needs more heat to reach the same extraction.

Notable extremes: Jeppe Hasager at 75 °C (2010, 2nd), Carlo Graf Bülow at a full 100 °C (2023, 2nd, with only 160 g of water and a 15-second press).

### 3.2 Multiple temperatures

Roughly a fifth of recipes use two or more:

- **Descending** — Jeff Verellen bloomed at 82 °C then poured 76 °C (2014). Jamika went 80 °C then 75 °C (2024). Front-load extraction, then coast.
- **Cold steep, hot finish** — Martin Karabinos steeped at 35 °C for three minutes, then added 92 °C water (2014, 2nd). Selective extraction: cold water pulls acids and sugars, not bitterness.
- **Hot brew, cool dilute** — Némo Pop's bypass water was 50 °C (2025, 1st). Doubles as a cooling stage.

### 3.3 Mineral content

Every modern podium specifies it: Third Wave Water, Perfect Coffee Water, Lotus, Apax, or a named bottled water. *Range:* 30–125 ppm TDS.

For an app this is worth a field but not worth modelling. Most users have one water and won't vary it; it's a constant, not a variable. Log it so their results aren't mysteriously irreproducible when they move house.

### 3.4 Water split

Before pouring, decide how the total divides:

```
total_water = brew_water + bypass_water
```

`brew_water` touches coffee. `bypass_water` never does. This split *is* the archetype choice from §0.

---

## 4. Pour

### 4.1 Pour structure

- **Single pour** — all water at once. Simplest.
- **Bloom + main** — a small wetting pour, a pause, then the rest.
- **Multi-stage** — three or more pours, often at different temperatures.

### 4.2 Bloom

*Only 20 of 46 recipes bloom.* This surprises people.

The bloom exists to let CO₂ escape so water can contact the grounds evenly. In a pourover, trapped gas causes real channelling. In an immersion brewer that you then *stir*, agitation solves the same problem more directly. **Bloom and vigorous agitation are largely substitutes** — and the modern field has chosen agitation.

If you do bloom: 40–60 g water, 25–60 seconds. Sophan Nugraha bloomed with *room-temperature* water for 40 seconds before the hot pour (2024, 2nd) — extraction essentially paused during wetting.

### 4.3 Pour technique

- **Spiral** — inward-to-outward and back. Even wetting.
- **Centre pour, heavy flow** — creates turbulence, agitation and pour in one gesture.
- **Slow / controlled** — Verellen took 60 seconds to pour 230 g (2014). A slow pour is a long, gentle extraction ramp.
- **Melodrip / diffuser** — George Stanica, 2024, 1st. Breaks the stream so it doesn't dig into the bed.

Technique is real but small. It's a correction to evenness, not a primary lever.

---

## 5. Agitate

**40 of 46 recipes specify agitation.** Higher adoption than bloom, bypass, or any filter choice. It is the most under-discussed parameter in AeroPress brewing.

Agitation raises extraction at fixed time and temperature. Given that the field has capped temperature at ~85 °C and time at ~2 minutes, agitation is one of the few remaining ways to push extraction up. That's why it's everywhere.

### 5.1 Type

| Type | Notes |
|---|---|
| **Stir** | Spoon, chopstick, or paddle. Most aggressive. |
| **Swirl** | Rotate the brewer. Gentler, and settles the bed flat. |
| **Turbulent wiggle** | Shake the brewer laterally. Zahradnik (2015, 1st), Khemacheva (2019, 2nd). |
| **Tap / Rao spin** | Swirl then tap down. Knocks grounds off the walls. |
| **None** | Ingri Johnsen, 2012, 2nd. Explicitly no stirring. It can be done. |

### 5.2 Intensity

*Range:* 3 stirs to 35. Jibbi Little stirred 35 times to win in 2022; Carlo Graf Bülow stirred 32 times *fast* in 2023. At the other end, Tuomas Merikanto stirred 3 times "very gently" — twice — to win 2021.

Reported as counts, durations, or both. Counts are more common and less comparable.

### 5.3 Pattern

NSEW, NSNS-WEWE, "back to front," circular. The intent is coverage — reaching all of the bed rather than spinning the middle. Whether it matters more than the count does is unproven, but it costs nothing.

### 5.4 Timing

- After the bloom — redistribute
- After the main pour — the common one
- Mid-steep — Merikanto's second stir at 0:50
- Just before pressing — settle the bed, often as a swirl

---

## 6. Steep

The interval between "water meets coffee" and "press begins."

*Range:* ~15 seconds (Lukasz Jura, 2009, 1st — stir four times, flip at ten seconds, press) to 3:30 (Karabinos's cold steep, 2014). **Most recipes press between 1:30 and 2:10.**

### 6.1 Cap and air

In inverted brewing, before you flip:

1. Attach the cap
2. **Press out the excess air** — squeeze the chamber gently until liquid reaches the filter. Skip this and the trapped air pushes coffee out when you flip.
3. Optionally swirl to settle the bed

### 6.2 Flip timing

Usually 5–10 seconds before the press. Flip late and you risk spilling; flip early and drips start.

### 6.3 Vacuum hold

Upright only. Insert the plunger and pull up slightly — the seal stops the drip and freezes the brew. Used by Derutter (2022, 2nd) and Zhang (2023, 3rd), the latter running two separate vacuum-held steeps in one recipe.

---

## 7. Press

### 7.1 Duration

*Range:* 20 seconds (Némo Pop, 2025) to 75 seconds (Shuichi Sasaki, 2014).

Pressing is not neutral time — extraction continues throughout, and the last of the water passes through the most-exhausted bed. Slow press = more extraction and more of the bed's bitter tail. Fast press = less of both.

Press duration is not really an independent parameter. It's a *consequence* of grind, filter count, and how hard you push. Store it as observed rather than prescribed, and don't be surprised when it correlates with everything.

### 7.2 Pressure

"Gently," "through the hiss," "bodyweight, as slowly as possible," "1.0–2.0 g/s." Only Jan Ahrend (2025, 2nd) gave a flow rate — everyone else describes feel. If you push hard enough to compact the bed, you've raised resistance and are now extracting harder than you meant to.

### 7.3 The endpoint

Four distinct philosophies, and this is a genuine decision:

| Endpoint | What it means |
|---|---|
| **Stop before the hiss** | Stop when the plunger reaches the slurry. The last liquid is the most bitter; leave it. |
| **Press through the hiss** | Push air through the puck. Brandon Smith, 2021, 3rd. Maximum yield. |
| **Leave a fixed slurry** | Jeff Verellen left ~50 g of liquid in the brewer, repeatedly, across three podiums. A deliberate, measured version of "stop before the hiss." |
| **Target an output weight** | Press until the carafe reads N grams. Ahrend stopped at 66 g (2025); Stanica at 76–79 g (2024). The modern approach — it makes yield an input, not an outcome. |

If you brew concentrate + bypass, target output. It's the only endpoint that makes your dilution reproducible.

---

## 8. Dilute

Bypass: water added to the finished brew that never touched coffee.

*Range:* 12 ml (Dharun Vyas, 2025, 3rd) to 200 g (Paulina Miczka, 2017, 1st — she brewed a 4.5% TDS concentrate and roughly tripled it). Present in 22 of 46 recipes overall, and **8 of the last 9 podiums**.

### 8.1 Bypass temperature

- **Hot** — maintains drinking temperature.
- **Room temperature** — Maru Mallee (2021, 2nd), among many. Dilutes and cools at once.
- **Cold-ish** — Némo Pop's 50 °C bypass, 2025, 1st.

Some recipes use both: Tay Wipvasutt bypassed to 115 g with room-temperature water, then to 155 g with hot (2023, 1st). Two knobs, strength and temperature, set independently.

### 8.2 Target

Either an absolute beverage weight (152 g, 200 g) or a TDS. Recorded targets: 1.30–1.35% (Little, 2022), 1.45% (Zhang, 2023). For reference, SCA filter norm is ~1.15–1.35% — so championship coffee is brewed at the strong end of normal, or beyond it.

---

## 9. Cool

The step most home brewers skip entirely, and the one competitors treat as non-negotiable.

Coffee tastes different at 80 °C than at 55 °C — perceived acidity and sweetness both rise as it drops. Judges taste at drinking temperature, so competitors *engineer* the arrival temperature rather than letting it happen.

Recorded targets: 60 °C (van Bunnik, 2019, 1st), ~54 °C (Ahrend, 2025, 2nd).

Techniques:

- **Swirl** in an open vessel — Merikanto swirled for 30 seconds, 2021, 1st
- **Pour from height** into another vessel
- **Decant back and forth** — Bülow, ten times between two servers, 2023
- **Room-temperature bypass** — dilute and cool in one move
- **Chilled serving vessel** — Nick Hatch pressed into a chilled cup, 2015
- **Ice** — Jibbi Little's optional chilled ice balls, three at the bottom and one on top, 2022
- **Blow on it** — Dharun Vyas, 2025, and it worked

---

## Building a recipe

The order that minimises backtracking:

1. **Pick an archetype.** Full brew or concentrate + bypass. This sets your ratio band and whether §8 exists.
2. **Set the four numbers that matter:** dose, brew water, temperature, contact time. Everything else is a correction to these.
3. **Pick a control scheme:** inverted, or upright, or upright + vacuum. Doesn't change flavour; changes what you can control.
4. **Choose grind and agitation together.** They're the two extraction levers you have left once temperature is capped. Coarse + vigorous ≈ fine + gentle.
5. **Pick an endpoint.** Target output if you're diluting.
6. **Set dilution and serving temperature** — the two adjustments that don't require re-brewing.

A defensible starting point, being the median of seventeen years of winners:

> 18 g · 100 g brew water at 88 °C · medium, fines sifted · 2 paper filters rinsed · inverted · stir 10× · press at 1:30 over 30 s to ~70 g output · bypass to 160 g · swirl to 60 °C

### Debugging a cup

| Symptom | First move | Then |
|---|---|---|
| Bitter, drying, hollow | Drop temperature 3 °C | Coarsen; press earlier; stop before the hiss |
| Sour, thin, salty | Raise temperature 3 °C | More agitation; longer steep; finer |
| Correct but too strong | More bypass | *(don't touch anything else)* |
| Correct but too weak | Less bypass, or more dose | *(don't touch anything else)* |
| Muddy, dull | Sift the fines | Extra paper filter |
| Flat, boring | Cool it further before tasting | Check water minerals |

The bottom half of that table is the argument for bypass. Strength and extraction are different problems, and a recipe that separates them is a recipe you can debug one variable at a time.

---

## Appendix — parameters

| Step | Field | Type | Range | Required |
|---|---|---|---|---|
| Configure | `position` | enum: upright, inverted, upright_vacuum | — | yes |
| | `filters_n` | int | 1–2 | yes |
| | `filter_type` | enum: paper, metal, cloth, flow_control | — | yes |
| | `filter_prep` | enum: dry, rinsed_hot, rinsed_cold | — | no |
| | `preheat` | bool | — | no |
| Dose | `dose_g` | float | 12–35, typ. 18 | **yes** |
| | `grind_note` | text | free text | yes |
| | `grinder` | text | free text | no |
| | `sifted_um` | int | 100–200 | no |
| Water | `brew_temp_c` | float | 75–100, typ. 85 | **yes** |
| | `water_ppm` | int | 30–125 | no |
| Pour | `brew_water_g` | float | 94–280 | **yes** |
| | `bloom_g` | float | 40–60 | no |
| | `bloom_s` | int | 25–60 | no |
| Agitate | `agitation_type` | enum: stir, swirl, wiggle, tap, none | — | no |
| | `agitation_count` | int | 3–35 | no |
| Steep | `press_start_s` | int | 15–210, typ. 90–130 | **yes** |
| Press | `press_duration_s` | int | 20–75 | no |
| | `endpoint` | enum: before_hiss, through_hiss, leave_slurry, target_output | — | no |
| | `output_g` | float | 60–135 | no |
| Dilute | `bypass_g` | float | 0–200 | no |
| | `bypass_temp_c` | float | 20–95 | no |
| | `final_weight_g` | float | 150–250 | no |
| Cool | `serve_temp_c` | float | 54–65 | no |

**Derived:**

```
total_water_g   = brew_water_g + bypass_g
ratio           = total_water_g / dose_g          # 5.7–16.7, median 11.1
concentrate_ratio = brew_water_g / dose_g         # the extraction ratio
bypass_frac     = bypass_g / total_water_g        # 0 = full brew, >0.4 = concentrate style
contact_time_s  = press_start_s + press_duration_s
```

Four fields carry most of the signal: `dose_g`, `brew_water_g`, `brew_temp_c`, `press_start_s`. A fifth, `bypass_g`, sets strength independently of the other four. If you're computing correlations on a small number of a user's own brews, those five are the ones worth the degrees of freedom — the rest are worth logging and displaying, not modelling.

---

*Source: 46 World AeroPress Championship podium recipes, 2009–2025, from worldaeropresschampionship.com and aeropress.com. Ranges are what champions did, not what's possible — the whole point of an AeroPress is that its parameter space is wider than any competition will show you.*
