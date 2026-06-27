# ☕ Coffee Evaluation System Design

## Overview

This application uses a **dual-mode sensory evaluation system** designed for both:
- fast everyday coffee logging
- deeper brew optimization and analysis

The system is inspired by sensory science methods used in professional coffee cupping, but simplified for practical use.

It is built around three layers:

1. **Acceptance Filter (Pass / Fail)**
2. **Quick Score (default evaluation)**
3. **Detailed Sensory Analysis (optional advanced mode)**

---

# 1. 🚦 Acceptance Filter (Pass / Fail)

## Purpose

The first and most important decision is:

> “Is this cup acceptable or not?”

This is a **threshold-based evaluation**, not a scoring system.

---

## Options

### ✅ PASS
The coffee is:
- drinkable
- free from major sensory defects
- acceptable for enjoyment or experimentation

### ❌ FAIL
The coffee is:
- unpleasant or flawed beyond tolerance
- not worth finishing or repeating
- significantly impacted by defects or imbalance

---

## Reasons for failure (optional tagging)

If a cup is marked FAIL, the user can optionally specify:

- **Sour / under-extracted**
- **Bitter / over-extracted**
- **Flat / lacking character**
- **Astringent / drying mouthfeel**
- **Fermented / off taste**
- **Burnt / over-roasted perception**
- **Muddy / unclear profile**
- **Hollow / lacking body**
- **Stale / old beans**

---
## Why this layer exists

### 1. Mimics real-world decision making
In real coffee consumption, people first decide:
> “Do I drink this or not?”

before any numeric scoring happens.

---

### 2. Prevents score pollution
Bad coffees should not be averaged into “mediocre good cups”.

Without a fail gate:
- very bad brews distort averages
- optimization becomes noisy

---

### 3. Enables brew learning
Fail cases are extremely valuable for:
- diagnosing extraction errors
- identifying recipe instability
- understanding boundaries of a brew method

---

### 4. Matches sensory science logic
In sensory evaluation, this corresponds to:
- **“Defect rejection threshold”** (ISO 4121)
- **“Acceptability testing”** (common in food science)

---

# 2. ⚡ Quick Score (Default Mode)

Used only if a cup passes the acceptance filter.

## Goal

Enable fast comparison between good coffees with minimal effort.

---

## Inputs

### 1. **Overall Enjoyment (0–10)**
> “How much do you like this cup?”
- **Primary metric** (hedonic scale, inspired by Peryam & Pilgrim, 1957).
- **0 = Dislike extremely, 10 = Like extremely**

### 2. **Harmony (0–5)**
> “How balanced and harmonious is this coffee?”
- Represents **overall sensory integration**.
- **0 = Completely unbalanced, 5 = Perfectly harmonious**

### 3. **Brew Intent (3-point scale)**
> “Would you brew this again?”
- **Definitely Yes**
- **Maybe**
- **No**
- Behavioral validation of quality.

---

## Interpretation

Quick Score is designed to compare *acceptable coffees only*.

Fail cases are excluded from scoring to preserve clarity.

---

## Why this structure works

- **Enjoyment** captures hedonic response (most stable metric).
- **Harmony** captures sensory coherence.
- **Brew Intent** validates real-world usefulness.

Together, they provide a **robust minimal evaluation system**.

---
## Optional: Weighted Quick Score
For advanced users, you can calculate a **weighted score** (e.g.):
```
Weighted Quick Score = (Enjoyment × 0.6) + (Harmony × 0.3) + (Brew Intent × 0.1)
```
- **Brew Intent**: Definitely Yes = 1, Maybe = 0.5, No = 0

---

# 3. 🧠 Detailed Sensory Mode (Optional)

Activated when users want deeper analysis.

## Purpose

To build a sensory profile of the coffee for:
- recipe optimization
- method comparison
- personal taste learning

---

## Dimensions (0–10 intensity scales)

These are **NOT quality judgments** — only **perception intensities**.
Inspired by **SCA Cupping Form** and **QDA (Quantitative Descriptive Analysis)**.

| Attribute          | Definition                                                                 | Reference Example (5/10)          |
|--------------------|----------------------------------------------------------------------------|-----------------------------------|
| **Acidity**        | Perceived brightness or sharpness (not sourness).                        | Bright like a Kenyan AA            |
| **Sweetness**      | Natural sweetness impression (not sugar content).                        | Caramel-like sweetness            |
| **Bitterness**     | Strength of bitter sensation.                                             | Dark chocolate bitterness         |
| **Body/Mouthfeel** | Texture weight (light → heavy / silky → syrupy).                          | Full-bodied like a Sumatran        |
| **Aroma**          | Strength of aroma perception before tasting.                              | Strong floral aroma                |
| **Aftertaste**     | Lingering sensations after swallowing (sweet, bitter, dry, etc.).       | Lingering honey sweetness         |
| **Cleanliness**    | Absence of off-flavors or muddiness.                                       | Crisp and clean finish             |

---
## Optional Descriptors
Users may tag **sensory notes** from a **controlled vocabulary** (e.g., SCA Flavor Wheel):
- **Fruity**: Berry, Citrus, Tropical, Dried Fruit
- **Floral**: Jasmine, Rose, Lavender
- **Sweet**: Caramel, Honey, Vanilla, Chocolate
- **Nutty/Roasted**: Almond, Peanut, Toasted, Smoky
- **Spicy**: Cinnamon, Clove, Pepper
- **Fermented**: Winey, Funky, Sour
- **Other**: Earthy, Woody, Herbal

---
## Temporal Dominance of Sensations (TDS) (Optional)
For advanced users, track **how sensations evolve** over time:
- Example:
  ```
  | Time  | Dominant Sensation | Intensity (0-10) |
  |-------|--------------------|------------------|
  | 0-5s  | Citrus             | 7                |
  | 5-10s | Chocolate          | 6                |
  | 10-15s| Bitterness         | 4                |
  ```

---
## Just-About-Right (JAR) Scales (Optional)
Assess if key attributes are **too low, just right, or too high**:
- **Acidity**: [Too Low] --- [Just Right] --- [Too High]
- **Bitterness**: [Too Low] --- [Just Right] --- [Too High]
- **Sweetness**: [Too Low] --- [Just Right] --- [Too High]
- **Body**: [Too Low] --- [Just Right] --- [Too High]

---
## Output

The system builds a:
- **Sensory fingerprint** of the brew
- **Comparison tool** between recipes
- **User preference profile** over time

---

# 4. 🧩 System Logic Summary

## Evaluation Flow

1. User brews coffee
2. User applies **Pass / Fail filter**
   - FAIL → log reason, stop evaluation
   - PASS → continue
3. User chooses:
   - Quick Score (default)
   - or Detailed Mode (optional)

---

## Data Philosophy
The system separates **four fundamentally different concepts**:

| Concept         | Meaning                          | Type                  | Example Metric               |
|-----------------|----------------------------------|-----------------------|------------------------------|
| Acceptability   | Is it drinkable?                 | Binary/Ordinal        | Pass/Marginal/Fail           |
| Liking          | Do I enjoy it?                   | Hedonic Score         | Enjoyment (0–10)             |
| Sensory Profile | What does it taste like?         | Descriptive Data      | Acidity (0–10), Floral tag   |
| Brew Context    | How was it brewed?               | Objective Parameters  | Ratio, Temp, Grind Size      |

---

# 5. 🎯 Design Rationale

## Why include Pass / Fail?

Most coffee evaluation systems fail because they:
- treat all cups as comparable
- average bad and good coffees together
- ignore rejection thresholds

This system fixes that by introducing a **hard sensory boundary**.

---

## Why separate scoring from rejection?

Because in real sensory perception:

> A bad cup is not “slightly lower quality” — it is categorically different.

This improves:
- statistical clarity
- brew optimization accuracy
- user decision-making

---

## Why keep Quick Score minimal?

Coffee evaluation in daily use must:
- take under 10 seconds
- require no training
- produce consistent results

Too many variables reduce reliability.

---

## Why keep Detailed Mode optional?

Because sensory profiling is:
- cognitively expensive
- better suited for exploration
- unnecessary for most daily brews

---

# 7. 📚 Scientific References & Inspirations

- **SCA Cupping Form**: [Specialty Coffee Association](https://sca.coffee/)
- **ISO 4121**: Sensory Analysis – Coffee Cupping
- **Peryam & Pilgrim (1957)**: Hedonic Scale for Food Preference
- **QDA (Quantitative Descriptive Analysis)**: Stone & Sidel, 2004
- **TDS (Temporal Dominance of Sensations)**: Pineau et al., 2009
- **JAR Scales**: Just-About-Right Scales in Sensory Evaluation


---
---
# **Final Concept**

This system is built on three principles:

1. **Reject bad coffee first (Pass/Fail gate)**
2. **Measure enjoyment for good coffee (Quick Score)**
3. **Analyze flavor only when needed (Detailed Mode)**

---

End of specification.