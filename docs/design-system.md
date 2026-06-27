# brewlab — Design System

Version 1.0 · M7 design pass · 2026-06-27

This document is the single source of truth for visual implementation. Every value
listed here is directly writable to a React Native `StyleSheet`. No design decisions
are left to the implementer.

---

## Palette direction: why neutral-warm

Three options were considered: neutral-warm (barely perceptible warmth in
backgrounds), cool-neutral (stone/slate), or pure greyscale.

**Neutral-warm is correct for this product.** Here is why.

The manifesto's named inspirations — Timemore, Leica, Apple, Muji, Field Notes —
share one visual trait: warmth lives in the *material layer* (paper stock,
camera body texture, product packaging), never in the *type or accent layer*. A
Muji product has a cream background with near-black ink. A Field Notes notebook
has kraft paper with black text. Leica has a black body with a single red identity
mark. None of them use warm-brown as a primary text color or brown-tinted buttons.

The current app has this exactly inverted: the background (`#fbf7f2`) is
appropriately mild, but the text (`#3a2a1c`), accent (`#7a4a2b`), and chips
(`#eaded2`) are all brown-tinted — which is what makes it read as café-themed
rather than notebook-quiet.

The correction: keep barely-warm backgrounds (like quality paper), move text to
near-black (like quality ink), and replace the brown accent with a single
distinct non-brown color.

Cool-neutral would solve the brown problem but would tip into productivity-app
territory (Notion, Linear), which the manifesto explicitly forbids. Pure greyscale
would feel clinical rather than personal.

---

## A. Color palette

These are the only colors used in the app. Every screen is built from these tokens.
No other hex values should appear in any StyleSheet.

```
bgPage:       '#F7F5F2'   Background for every scrollable screen and tab content.
                           Not pure white — a whisper of warmth, like uncoated
                           quality paper. Provides just enough contrast to make
                           white cards read as elevated without shadow.

bgSurface:    '#FFFFFF'   Card background. All cards, form containers, list rows.
                           Pure white. Contrasts gently with bgPage.

bgElevated:   '#FFFFFF'   Modal and overlay surface. brew/new, beans/new,
                           brewers/new, grinders/new, and brew/rate all use
                           presentation: 'modal'. The modal's scroll background
                           stays bgPage (#F7F5F2) — matching contentStyle in
                           _layout.tsx screenOptions — while cards inside the
                           modal remain bgSurface (#FFFFFF). The native platform
                           backdrop (the dark scrim behind a modal sheet) is
                           system-controlled and requires no token. In practice
                           bgElevated === bgSurface; the token exists for clarity
                           of intent, not to introduce a new shade.

border:       '#E8E4DF'   All borders and separators: card outlines, param row
                           dividers, input borders, tab bar top edge.
                           Use 0.5 or StyleSheet.hairlineWidth for most separators.
                           Use 1 for input field borders.

textPrimary:  '#111110'   Main content text. Card titles, param values, body copy,
                           navigation titles, primary list item labels. The '10'
                           hex tail gives a whisper of warm undertone — it is not
                           a pure cool black.

textSecondary: '#666260'  Supporting text. Param labels (left side of param row),
                           form field labels, bean metadata (roaster · origin),
                           date strings where not a timestamp.

textTertiary: '#999592'   Quiet text. Timestamps, hints below form fields, step
                           counters, section header labels (uppercase), placeholder
                           stand-ins in secondary positions.

accent:       '#2D6A4F'   The single interactive color. Forest green; evokes
                           craft, freshness, and annotation (green ink in
                           notebooks). Used for: FAB fill, primary button fill,
                           active chip fill, active tab icon, score display,
                           Switch track when on, focus ring on inputs, back button
                           tint in navigation header.
                           Contrast with white: ~5.9:1 — passes WCAG AA. ✓

accentSubtle: 'rgba(45, 106, 79, 0.10)'
                           10% opacity tint of accent. Used for: unselected chip
                           background, subtle row highlight when relevant. Not
                           green enough to read as "selected" — clearly distinct
                           from the full accent fill.

destructive:  '#B91C1C'   Delete actions, fail states, error text, out-of-range
                           validation. Red, no brown undertone. Used sparingly;
                           the manifesto says hierarchy and wording come first.

// Success / pass: no separate token.
// Pass states use `accent` (#2D6A4F). The decision: accent is already the color
// the app uses for "things that are good" — primary buttons, high scores, selected
// chips, active tabs. Introducing a second green specifically for "pass" would
// create visual ambiguity. The rate screen gate buttons use accent border/text
// for the Pass option, which is consistent. Wording ("Pass" / "Fail") carries
// the primary semantic weight per the manifesto; color reinforces, not leads.

// Timer-specific — only used in brew/timer.tsx

timerBg:       '#111110'  Same as textPrimary — dark near-black. The screen
                           background. Matches the text token to signal that the
                           timer is a "negative space" inversion of the app.

timerTrack:    '#2A2A28'  Progress bar track (the unfilled portion). Barely lighter
                           than timerBg — just enough to show the track shape.

timerSubtext:  '#666260'  Reuses textSecondary. Step counter "Step 2 of 4",
                           total elapsed display. Same token, different context.
```

### Colors NOT used

- No brown in any role (not background, not text, not accent)
- No shadows (`shadowColor`, `elevation`) — depth comes from the
  bgPage-to-bgSurface contrast
- No gradient fills
- No semitransparent black overlays except native `Alert` and `Modal` backdrops
  (which are platform-controlled)
- Emoji as UI elements: removed throughout (see per-screen notes)

---

## B. Typography scale

React Native uses the platform default font (San Francisco on iOS, Roboto on
Android). No custom font is needed — system fonts at these weights produce the
correct aesthetic. All sizes are in points.

`fontVariant: ['tabular-nums']` is **mandatory** on any `Text` that shows a
number that may change or sit in a column beside other numbers. Param values,
scores, timer displays, ratios, timestamps.

### Scale

| Role          | fontSize | fontWeight | lineHeight | color          | Usage |
|---------------|----------|------------|------------|----------------|-------|
| display       | 64       | '300'      | 72         | timerText\*    | Timer countdown number. Light weight reads elegantly at large size on dark bg. |
| title         | 22       | '700'      | 28         | textPrimary    | Navigation header titles (via Stack screenOptions). |
| heading       | 17       | '600'      | 24         | textPrimary    | Method label in overview card, sensory section headings inside cards. |
| body          | 15       | '400'      | 22         | textPrimary    | Card content, notes text, bean name in list, brewer name. |
| label         | 13       | '500'      | 18         | textSecondary  | Param labels (left side of param row), form field labels, field names above inputs in ParamInput. letterSpacing: 0.1 |
| value         | 15       | '600'      | 22         | textPrimary    | Param values (right side of param row). Always tabular-nums when numeric. |
| unit          | 12       | '400'      | 16         | textTertiary   | Inline unit suffix next to a param value: 'g', '°C', 's', 'bar'. Separate Text node so it can be styled independently. |
| sectionHeader | 11       | '500'      | 14         | textTertiary   | The label above a card group ('METHOD', 'BEAN', 'PARAMETERS'). letterSpacing: 0.8, textTransform: 'uppercase'. |
| caption       | 12       | '400'      | 16         | textTertiary   | Timestamps, step counter, brew intent, descriptor group headers (use letterSpacing: 0.8 + textTransform uppercase for group headers). |
| hint          | 12       | '400'      | 17         | textTertiary   | Help text below a form field. fontStyle: 'italic'. |
| score         | 28       | '700'      | 34         | accent         | Overall score in brew detail card. tabular-nums. |
| timerStep     | 30       | '300'      | 38         | '#F5F5F4'      | Step instruction label on timer ("Bloom", "Fill & steep"). Light weight, centered. |

\* `timerText` = `'#F5F5F4'` — warm white, not pure white, reduces harshness on OLED.

### Numeric params deserve a dedicated visual treatment

In param rows (detail view) and the ParamInput component (form view), the number
and unit must be visually distinct from the label. See the param row spec in
Section D.

---

## C. Spacing & radius

### Spacing scale

All spacing values in points.

```
4   xs     Between inline sibling elements: unit label after a value, icon
           beside a text label, the gap between a chip's children.

8   sm     Within a chip row (gap between chips). Margin between param rows
           inside a card when not using a separator View. Internal padding
           for small/secondary elements.

12  md     Gap between a section header and its card below it. Gap between
           form fields within a card. Vertical padding inside chips.

16  base   Screen edge horizontal padding (all scrollable screens).
           Card internal padding (all four sides). Gap between cards in a list.
           Standard gap between major elements on a screen.

20  lg     Vertical padding for primary buttons. Top margin before the first
           section header on a screen.

24  xl     Timer screen horizontal padding. Gap between major sections on a
           form when no section header divides them. Bottom margin for the
           primary CTA when above a secondary action.

32  xxl    Gap above the primary CTA at the bottom of a scroll view.
           Large whitespace breaks between unrelated sections.

40  xxxl   contentContainerStyle paddingBottom on all ScrollViews (ensures
           content is not obscured by home indicator or FAB).
```

### Border radius

```
card:    12    All card containers. (Replaces current 14 — slightly more
               precise, slightly less "app-rounded".)

chip:    8     All selection chips: method, bean, grinder, orientation, process,
               roast level, brew intent, descriptor tags, fail reasons.
               (Replaces current 20/pill. An 8px radius reads as a
               deliberate selection control, not a casual consumer chip.)

button:  10    Primary, secondary, and destructive full-width buttons.

fab:     28    FAB (fully rounded pill — appropriate for a floating element).

input:   8     TextInput borders inside ParamInput. Consistent with chip radius.
               Cards that contain bare TextInputs (beans/new, notes fields) do
               NOT add a border to the input — the card is the container.
```

---

## D. Component patterns

Every style value below is directly copy-pasteable to a StyleSheet.

### Card

```js
card: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  // No shadow. No elevation.
  // Use borderWidth + borderColor only for cards in list views where
  // the card sits inside a FlatList and needs a defined edge:
  // borderWidth: 0.5,
  // borderColor: '#E8E4DF',
},
```

**Rule:** ALL list-item cards (brews list, beans list, brewers list, grinders list)
get the hairline border. Form-section cards (the card containing a chip row or
an input) do NOT get the border — they are visually separated by the bgPage gap.

### Section header (label above a card)

This replaces `sectionTitle` in every screen. Demoted from a heading to a label.

```js
sectionHeader: {
  fontSize: 11,
  fontWeight: '500',
  color: '#999592',
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  marginBottom: 8,
  marginTop: 20,   // reduce to 0 for the very first section on a screen
  paddingHorizontal: 4,
},
```

The current `fontSize: 16, fontWeight: '700', color: '#3a2a1c'` section title
competes with card content. Section headers are metadata about a section, not
headings you need to read. They should be quiet.

### Param row (detail view — brew/[id].tsx)

```js
paramRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 10,
},
paramRowSep: {
  height: StyleSheet.hairlineWidth,
  backgroundColor: '#E8E4DF',
},
paramLabel: {
  fontSize: 13,
  fontWeight: '500',
  color: '#666260',
  flex: 1,
},
paramValueRow: {
  flexDirection: 'row',
  alignItems: 'baseline',
  gap: 3,
},
paramValue: {
  fontSize: 15,
  fontWeight: '600',
  color: '#111110',
  fontVariant: ['tabular-nums'],
  textAlign: 'right',
},
paramUnit: {
  fontSize: 12,
  fontWeight: '400',
  color: '#999592',
},
```

Render the value and unit as two sibling `<Text>` nodes inside a `paramValueRow`
View. Do NOT concatenate `"18 g"` into a single string — the unit must be in
`textTertiary` while the number is in `textPrimary`.

### ParamInput component (components/ParamInput.tsx)

Current issues:
1. Label color is `#3a2a1c` (brown) — change to `textSecondary`
2. Unit is baked into the label string `"Dose (g)"` — change to separate inline
   suffix in the input row
3. Input border is `#d6cbbe` (brownish) — change to `border` token
4. No range hint shown to the user
5. Switch track color is `#7a4a2b` — change to `accent`

Required changes to `ParamInput.tsx` styles:

```js
label: {
  fontSize: 13,
  fontWeight: '500',
  color: '#666260',      // was '#3a2a1c'
  marginBottom: 6,
  letterSpacing: 0.1,
},
inputRow: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#E8E4DF',  // was '#d6cbbe'
  borderRadius: 8,
  backgroundColor: '#FFFFFF',
  paddingHorizontal: 12,
  paddingVertical: 8,
},
inputInner: {
  flex: 1,
  fontSize: 15,
  fontWeight: '600',        // value-weight, not body
  color: '#111110',
  fontVariant: ['tabular-nums'],  // add for number/int types
},
inputUnit: {
  fontSize: 12,
  color: '#999592',
  marginLeft: 4,
},
rangeHint: {
  fontSize: 12,
  fontStyle: 'italic',
  color: '#999592',
  marginTop: 4,
},
// Switch
// trackColor: { false: '#E8E4DF', true: '#2D6A4F' }
// thumbColor: '#FFFFFF'

// Chips — same as chip pattern below
```

For number/int params: the label in `ParamInput` should change from
`spec.unit ? \`${spec.label} (${spec.unit})\` : spec.label`
to just `spec.label`. The unit moves to `inputUnit` inside the `inputRow` View,
displayed as a suffix to the right of the TextInput.

Add a range hint below each numeric input when both `spec.min` and `spec.max`
are defined: display as `"${spec.min} – ${spec.max}${spec.unit ? ' ' + spec.unit : ''}"`.

### Chip — unselected

```js
chip: {
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 8,
  backgroundColor: 'rgba(45, 106, 79, 0.10)',
},
chipText: {
  fontSize: 13,
  fontWeight: '500',
  color: '#666260',
},
```

### Chip — selected

```js
chipActive: {
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 8,
  backgroundColor: '#2D6A4F',
},
chipTextActive: {
  fontSize: 13,
  fontWeight: '600',
  color: '#FFFFFF',
},
```

### Primary button

```js
primaryBtn: {
  backgroundColor: '#2D6A4F',
  borderRadius: 10,
  paddingVertical: 16,
  paddingHorizontal: 24,
  alignItems: 'center',
},
primaryBtnText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#FFFFFF',
  letterSpacing: 0.2,
},
btnDisabled: {
  opacity: 0.4,
},
```

### Secondary / outline button

Used for "Save without timer", "Add detail →", parallel actions alongside a
primary button.

```js
secondaryBtn: {
  borderWidth: 1.5,
  borderColor: '#2D6A4F',
  borderRadius: 10,
  paddingVertical: 16,
  paddingHorizontal: 24,
  alignItems: 'center',
  backgroundColor: 'transparent',
},
secondaryBtnText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#2D6A4F',
  letterSpacing: 0.2,
},
```

### Destructive button

Used for all "Delete X" actions. Outline only — filled destructive appears only
in the native `Alert.alert` confirmation dialog (platform-styled).

```js
destructiveBtn: {
  borderWidth: 1.5,
  borderColor: '#B91C1C',
  borderRadius: 10,
  paddingVertical: 14,
  paddingHorizontal: 24,
  alignItems: 'center',
  backgroundColor: 'transparent',
  marginTop: 8,
},
destructiveBtnText: {
  fontSize: 15,
  fontWeight: '500',
  color: '#B91C1C',
},
```

### FAB (floating action button)

```js
fab: {
  position: 'absolute',
  right: 20,
  bottom: 24,
  backgroundColor: '#2D6A4F',
  paddingHorizontal: 20,
  paddingVertical: 14,
  borderRadius: 28,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
fabText: {
  fontSize: 15,
  fontWeight: '600',
  color: '#FFFFFF',
  letterSpacing: 0.2,
},
```

### Tab bar (applied in `(tabs)/_layout.tsx`)

```js
<Tabs
  screenOptions={{
    tabBarActiveTintColor: '#2D6A4F',
    tabBarInactiveTintColor: '#999592',
    tabBarStyle: {
      backgroundColor: '#FFFFFF',
      borderTopWidth: 0.5,
      borderTopColor: '#E8E4DF',
      elevation: 0,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '500',
    },
    headerStyle: { backgroundColor: '#F7F5F2' },
    headerShadowVisible: false,
    headerTitleStyle: {
      fontSize: 17,
      fontWeight: '600',
      color: '#111110',
    },
  }}
>
```

### Score circles (used in brew/rate.tsx — ScoreRow component)

The current 30px circles at 6px gap place 11 items totalling ~396px. This wraps
on all phones. **Wrapping to two rows is acceptable** — `flexWrap: 'wrap'` is
the correct behavior, and the rows at 30×30 circles are legible and tappable.

For the **overall enjoyment score (0–10)** only — because this is the most
important single number in the rating flow — consider upgrading to a large
centered stepper display in a future pass. The circle grid is acceptable for
Phase 1; it is the right pattern for the 7 sensory dimension sub-scores where
space is at a premium.

Score circle updated styles:

```js
// sr = ScoreRow StyleSheet
sr.circle: {
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: 'rgba(45, 106, 79, 0.10)',  // accentSubtle
  alignItems: 'center',
  justifyContent: 'center',
},
sr.circleActive: {
  backgroundColor: '#2D6A4F',
},
sr.num: {
  fontSize: 12,
  fontWeight: '500',
  color: '#666260',
  fontVariant: ['tabular-nums'],
},
sr.numActive: {
  color: '#FFFFFF',
  fontWeight: '600',
},
```

### Pass / Fail gate buttons (brew/rate.tsx)

Remove the emoji (✅ ❌) from button labels. Use text only, in the border color.

```js
gateBtn: {
  flex: 1,
  borderRadius: 12,
  paddingVertical: 20,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1.5,
},
passBtn: {
  borderColor: '#2D6A4F',    // accent green for pass
  backgroundColor: '#FFFFFF',
},
passBtnActive: {
  backgroundColor: 'rgba(45, 106, 79, 0.10)',
},
failBtn: {
  borderColor: '#B91C1C',
  backgroundColor: '#FFFFFF',
},
failBtnActive: {
  backgroundColor: 'rgba(185, 28, 28, 0.08)',
},
gateBtnText: {
  fontSize: 16,
  fontWeight: '600',
},
passText: { color: '#2D6A4F' },
failText: { color: '#B91C1C' },
```

Note: "Pass" now uses accent green instead of `#2e7d32`. This unifies the
semantic color: green = good = accent = the thing the app rewards.

---

## E. Timer screen

### Should the timer be dark or light?

**The timer stays dark.** Here is why "dark" serves "almost invisible" better than
light in this context.

A bright white screen at full brightness is *actively present* in a kitchen
environment — it competes visually with the counter, kettle, and scale. A dark
screen recedes perceptually: it sits in the periphery while the large white
numerals float in focus. This is the same principle behind darkroom timers,
aircraft cockpit displays, and lab instrument panels — the interface dims itself
while keeping critical readouts bright.

The *transition* from the warm white app to the dark timer is itself a UX signal:
"you are now in brewing mode." This transition reinforces the app's claim that
brewing is a distinct, focused activity.

The current dark background `#1a1008` must change: it is a warm-brown dark that
perpetuates the café-themed palette in the one screen where the user is most
vulnerable to distraction. The new timer background is the same value as
`textPrimary`: `#111110`.

### Timer palette

```
timerBg:     '#111110'    Full-screen background. Near-black, barely warm.
timerTrack:  '#2A2A28'    Progress bar track (unfilled portion).
timerFill:   '#2D6A4F'    Progress bar fill. Accent green — the one signal color.
stepLabel:   '#F5F5F4'    Step instruction ("Bloom", "Fill & steep"). Warm white.
countdown:   '#F5F5F4'    The large countdown/countup number. White for maximum
                          legibility at distance. NOT the amber currently used.
                          The green progress bar already signals the accent theme;
                          making the number white maximizes glanceability.
subtext:     '#666260'    Step counter, total elapsed. Reuses textSecondary.
                          These are secondary reads — subdued in this context.
warning:     '#B91C1C'    Countdown < 5 seconds warning. Same destructive token.
btnFill:     '#2D6A4F'    Advance/Done button fill. Accent green.
btnText:     '#F5F5F4'    Advance/Done button text.
```

### Timer layout styles

```js
container: {
  flex: 1,
  backgroundColor: '#111110',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 24,
  paddingHorizontal: 24,
},
totalElapsed: {
  color: '#666260',
  fontSize: 13,
  fontVariant: ['tabular-nums'],
  position: 'absolute',
  top: 0,             // sits at the SafeAreaView top edge
},
stepCounter: {
  color: '#666260',
  fontSize: 11,
  fontWeight: '500',
  letterSpacing: 0.8,
  textTransform: 'uppercase',
},
stepLabel: {
  color: '#F5F5F4',
  fontSize: 30,
  fontWeight: '300',   // light weight reads elegantly at this size on dark bg
  textAlign: 'center',
},
progressTrack: {
  width: '100%',
  height: 3,           // thinner than current 6px — more precise, less graphic
  backgroundColor: '#2A2A28',
  borderRadius: 2,
  overflow: 'hidden',
},
progressFill: {
  height: 3,
  backgroundColor: '#2D6A4F',
  borderRadius: 2,
},
timeDisplay: {
  color: '#F5F5F4',    // white — was amber '#e8a87c'
  fontSize: 64,
  fontWeight: '300',   // light weight for the display numerals
  fontVariant: ['tabular-nums'],
  letterSpacing: -1,
},
timeDisplayWarning: {
  color: '#B91C1C',
},
btn: {
  backgroundColor: '#2D6A4F',
  borderRadius: 16,
  paddingVertical: 18,    // slightly taller than current 16 — larger tap target
  paddingHorizontal: 56,
  alignItems: 'center',
  minWidth: 200,
},
btnText: {
  color: '#F5F5F4',
  fontSize: 18,
  fontWeight: '600',
},
btnDisabled: {
  opacity: 0.5,
},
errorText: {
  color: '#F5F5F4',
  fontSize: 16,
  textAlign: 'center',
},
```

---

## F. Per-screen notes

These notes document changes beyond the palette swap. Flows are NOT altered —
only visual execution within the existing screen structure.

### `app/_layout.tsx` — Root Stack

Add `screenOptions` to `<Stack>` so all push/modal screens share the header style:

```js
<Stack
  screenOptions={{
    headerStyle: { backgroundColor: '#F7F5F2' },
    headerShadowVisible: false,
    headerTitleStyle: {
      fontSize: 17,
      fontWeight: '600',
      color: '#111110',
    },
    headerTintColor: '#2D6A4F',  // back button chevron + text
    contentStyle: { backgroundColor: '#F7F5F2' },
  }}
>
```

Update title strings while here:
- `'brew/new'` title: `'New brew'` → keep
- `'brew/[id]'` title: `'Brew detail'` → `'Brew'` (shorter, less database-speak)
- `'brew/rate'` title: `'Rate brew'` → `'Rate'`
- `'beans/[id]'` title: `'Edit bean'` → keep
- `'brewers/[id]'` title: `'Edit brewer'` → keep
- `'grinders/[id]'` title: `'Edit grinder'` → keep

---

### `app/(tabs)/index.tsx` — Brews list

**Remove:**
- `★` star character from score display
- `❌` emoji from fail display

**Change:**
- Score: render as `<Text style={score}>8.5</Text>` in `accent` color, at
  `fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums']`. No slash,
  no star — the color alone signals it is a positive numeric score.
- Fail: `<Text style={fail}>Failed</Text>` — destructive color, no emoji.
  If fail reasons exist, omit from the list card (they live in the detail screen).
- "Not rated": render `<Text style={unrated}>Tap to rate</Text>` in textTertiary
  rather than the current "Not rated" text — this is more actionable.
- `paramsRow`: keep the "dose · water · temp · grind" line. Render the numbers
  in `fontVariant: ['tabular-nums']`.
- FAB text: change from `'+  New brew'` to `'New brew'` — the '+' can be a
  separate inline character at the correct weight. Or keep the '+' but remove
  the double space.
- Card background: use the new card spec. Add `borderWidth: 0.5, borderColor:
  '#E8E4DF'` to list cards (they sit inside a FlatList on bgPage — need the edge).
- Remove `gap: 4` from inside the card; replace with explicit `marginBottom` on
  each sub-element (4 for cardTopRow bottom, 2 for paramsRow bottom).

---

### `app/(tabs)/beans.tsx` — Beans list

- Same card border rule as brews list.
- Bean rating (if present): `7.2` in `accent` color, `fontVariant: ['tabular-nums']`.
  No star character.
- Metadata line (roaster · origin · process): textSecondary, correct.
- FAB: apply FAB component spec.

---

### `app/(tabs)/brewers.tsx` — Gear tab

**Section headers ("Brewers", "Grinders"):**
Change from `{ fontSize: 18, fontWeight: '700', color: '#3a2a1c' }` to the
`sectionHeader` style (uppercase, 11pt, textTertiary). These headings are
organizational labels, not content.

**"+ Add" buttons:**
Remove the current filled brown pills (`backgroundColor: '#7a4a2b'`). Replace
with a simple text link:
```js
addLink: {
  fontSize: 14,
  fontWeight: '500',
  color: '#2D6A4F',
},
```
Render as `<Pressable><Text style={addLink}>Add</Text></Pressable>`. No
background, no border. The accent color signals it is actionable.

**Brewer and grinder cards:**
Apply the card spec with `borderWidth: 0.5`. The method/type as secondary text
below the name is correct and should stay.

---

### `app/brew/new.tsx` — New brew form

**Section titles:** Apply `sectionHeader` style throughout. Remove `marginTop: 12`
inline overrides — the `sectionHeader` style already specifies `marginTop: 20`.

**"Start brew →" button:** Apply `primaryBtn` / `primaryBtnText`. Change label
from `'Start brew →'` to `'Start brew'` — the arrow is decorative.

**"Save without timer":** Change from a bare centered text link to the
`secondaryBtn` / `secondaryBtnText` style. This action is an important escape
hatch for when the user brews without a timer; it deserves a proper button
affordance. Place it directly below the primary button with `marginTop: 12`.

**Method chip row:** Apply new chip styles. The chips will be visually calmer
with the 8px radius and accent-subtle background.

**Params card:** Each param from `METHODS[method].params` is rendered by
`ParamInput`. Apply the `ParamInput` updates from Section D. The card containing
all params should have `gap: 0` — separators between params are drawn by a
`paramRowSep` View, not by gap spacing.

**Notes field:** The textarea has no visible border or focus indicator. The card
provides the container — no changes needed. Add `color: '#111110'` to the
TextInput `style` (currently `#3a2a1c`).

---

### `app/brew/timer.tsx` — Timer

Apply the timer palette and layout styles from Section E entirely. No structural
changes — only style values.

Key color changes:
- Container bg: `'#1a1008'` → `'#111110'`
- Progress fill: `'#e8a87c'` → `'#2D6A4F'`
- Progress track: `'#3a2a1c'` → `'#2A2A28'`
- Time display: `'#e8a87c'` → `'#F5F5F4'`
- Step label: `'#f5ede3'` → `'#F5F5F4'`
- Step counter: `'#a89080'` → `'#666260'`
- Total elapsed: `'#a89080'` → `'#666260'`
- Button fill: `'#7a4a2b'` → `'#2D6A4F'`

Button label copy:
- `'Done ✓'` → `'Done'`
- `'Skip →'` → `'Skip'`
- `'Next →'` → `'Next'`

---

### `app/brew/[id].tsx` — Brew detail

**Overview card:**
- Method label (`methodLabel`): apply `heading` style
  (`fontSize: 17, fontWeight: '600', color: '#111110'`).
- Bean name below: `body` style in `textSecondary`.
- Date: `caption` in `textTertiary`.

**Parameters card:**
- Param rows: apply the `paramRow` + `paramRowSep` pattern from Section D.
- Values: render number and unit as two sibling Text nodes (see param row spec).
- Remove the current `gap: 6` on the card; replace with paddingVertical inside
  each row plus the hairline separator View.
- `fontVariant: ['tabular-nums']` on all numeric values.

**Rating card — unrated state:**
- The "Rate this brew →" Pressable is the primary CTA on an unrated brew; render
  as `primaryBtn`. Current inline brown button is underweight.

**Rating card — passed state:**
- Score: `<Text style={score}>8.5</Text>` where `score = { fontSize: 28,
  fontWeight: '700', color: '#2D6A4F', fontVariant: ['tabular-nums'] }`.
  Display as the number only at this size. Add a `/10` suffix in `textTertiary`
  `caption` style on the same line.
- `❌ Failed` → `'Failed'` in `destructive` color. No emoji.
- `★ ${rating} / 10` → `${rating}` in `score` style with `/10` suffix.
- Descriptor chips: apply chip component styles.
- `brew.harmony` and `brew.brewIntent`: textSecondary, current muted style is fine.

**Delete button:**
Apply `destructiveBtn` / `destructiveBtnText`. No other changes.

---

### `app/brew/rate.tsx` — Rate brew

**Step indicator:**
Move to above the main question text. Currently embedded mid-screen between the
context card and the content. Pull it up:
```js
stepIndicator: {
  fontSize: 11,
  fontWeight: '500',
  color: '#999592',
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  textAlign: 'center',
  marginBottom: 16,
},
```

**Pass / Fail buttons:**
Apply Pass/Fail gate button spec from Section D. Remove emoji from labels:
`'✅ Pass'` → `'Pass'`, `'❌ Fail'` → `'Fail'`.

**Fail reasons chips:**
Apply chip styles. Remove the colored emoji indicators from fail reason strings
(the strings themselves are clean — `'sour / under-extracted'` etc.).

**Score circles:**
Apply score circle styles from Section D. Two-row wrap is accepted behavior on
smaller phones.

**"Brew Intent" chips:**
Apply chip styles. Labels ("Definitely yes", "Maybe", "No") are already clean.

**Sensory dimension dividers:**
Change `height: 1, backgroundColor: '#f0e8de'` to
`height: StyleSheet.hairlineWidth, backgroundColor: '#E8E4DF'`.

**Descriptor group headers:**
Apply uppercase caption style: `{ fontSize: 11, fontWeight: '500',
color: '#999592', letterSpacing: 0.8, textTransform: 'uppercase' }`.

**Buttons:**
- "Save →" → `primaryBtn` with label `'Save'`
- "Add detail →" → `secondaryBtn` with label `'Add detail'`
- "Save fail →" → `primaryBtn` with label `'Save'`
- "Save with detail →" → `primaryBtn` with label `'Save'`

Remove the `→` arrows from all button labels throughout the app — they are
decorative and inconsistent.

---

### `app/beans/new.tsx` and `app/beans/[id].tsx` — Bean forms

**Section titles:** Apply `sectionHeader` style.

**Inputs inside cards:** The current pattern (bare TextInput, no border, inside
a white card) is fine. Do NOT add a visible border to these inputs — the card is
the container. Change text color from `'#3a2a1c'` → `'#111110'`.

**Placeholder color:** Change from `'#bbb'` → `'#999592'` (textTertiary token).

**Process and roast level chips:** Apply chip component styles.

**Notes textarea:** Same as notes in new-brew form — text color update only.

**Save button:** Apply `primaryBtn`.

**Delete button (edit screen only):** Apply `destructiveBtn`.

---

### `app/brewers/new.tsx` and `app/brewers/[id].tsx` — Brewer forms

Same changes as bean forms. The method chip row will have 8 items, some with
two-word labels (e.g. "Hario V60", "French Press", "Hario Switch") — these will
wrap across 2–3 rows, which is fine.

---

### `app/grinders/new.tsx` and `app/grinders/[id].tsx` — Grinder forms

**Dial Scale section:**
- The 3-column Min/Max/Step row layout is acceptable and correct for this data.
- `fieldLabel` style: apply `label` typography
  (`fontSize: 13, fontWeight: '500', color: '#666260', letterSpacing: 0.1`).
- The hint text ("Helps the optimizer stay within valid grind settings..."):
  apply `hint` style (`fontSize: 12, fontStyle: 'italic', color: '#999592'`).
- Consider rewording to: "The optimizer uses these bounds when suggesting grind
  settings. Leave blank if your grinder has no numbered scale."

**Grinder type chips:** Apply chip styles.

---

## G. Tab bar & navigation

### Tab icons

Replace current Ionicons selections with outline variants that better match the
product's scientific-notebook identity:

| Tab   | Current icon      | Recommended         | Reason |
|-------|-------------------|---------------------|--------|
| Brews | `cafe`            | `flask-outline`     | Evokes experimentation, not a café |
| Beans | `nutrition`       | `leaf-outline`      | Botanical; `nutrition` shows a carrot |
| Gear  | `hardware-chip`   | `construct-outline` | Tools/equipment rather than electronics |

Use the `-outline` variant consistently. Never mix filled and outline icons within
the same tab bar.

### Navigation header titles

Current title strings that should be updated in `_layout.tsx`:
- `'Brew detail'` → `'Brew'`
- `'Rate brew'` → `'Rate'`

These read as internal database labels. Shorter is better in headers.

### Tab labels

Keep current labels: **Brews**, **Beans**, **Gear**. They are already concise and
accurate.

---

## Implementation reference: suggested `lib/theme.ts`

Create this file to centralize all tokens. Every screen and component imports
from here — no hex literals in StyleSheets.

```ts
export const Colors = {
  // Page / surface
  bgPage:         '#F7F5F2',
  bgSurface:      '#FFFFFF',
  bgElevated:     '#FFFFFF',  // modal card surfaces — same value, distinct intent

  // Text
  textPrimary:    '#111110',
  textSecondary:  '#666260',
  textTertiary:   '#999592',

  // Borders
  border:         '#E8E4DF',

  // Accent
  accent:         '#2D6A4F',
  accentSubtle:   'rgba(45, 106, 79, 0.10)',

  // Semantic
  destructive:    '#B91C1C',

  // Timer (dark surface)
  timerBg:        '#111110',
  timerTrack:     '#2A2A28',
  timerText:      '#F5F5F4',
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 40,
} as const;

export const Radii = {
  card:   12,
  chip:   8,
  button: 10,
  fab:    28,
  input:  8,
} as const;
```

---

*End of design-system.md*
