import Slider from '@react-native-community/slider';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { db } from '@/db/client';
import { brews } from '@/db/schema';
import { METHODS, type BrewMethod } from '@/lib/methods';
import { Colors, Radii, Spacing } from '@/lib/theme';

// ── Constants ──────────────────────────────────────────────────────────────────

const FAIL_REASONS = [
  'sour / under-extracted',
  'bitter / over-extracted',
  'flat / lacking character',
  'astringent',
  'fermented / off taste',
  'burnt',
  'muddy / unclear',
  'hollow / lacking body',
  'stale',
];

const SENSORY_DIMS = [
  { key: 'acidity',     label: 'Acidity',     hint: 'Brightness / sharpness' },
  { key: 'sweetness',   label: 'Sweetness',   hint: 'Natural sweetness impression' },
  { key: 'bitterness',  label: 'Bitterness',  hint: 'Strength of bitter sensation' },
  { key: 'body',        label: 'Body',        hint: 'Texture weight (light → heavy)' },
  { key: 'aroma',       label: 'Aroma',       hint: 'Strength of aroma perception' },
  { key: 'aftertaste',  label: 'Aftertaste',  hint: 'Lingering sensations after swallowing' },
  { key: 'cleanliness', label: 'Cleanliness', hint: 'Absence of off-flavors' },
];

const DESCRIPTOR_GROUPS = [
  { label: 'Fruity',          tags: ['berry', 'citrus', 'tropical', 'stone fruit', 'dried fruit'] },
  { label: 'Floral',          tags: ['jasmine', 'rose', 'lavender'] },
  { label: 'Sweet',           tags: ['caramel', 'honey', 'vanilla', 'chocolate', 'brown sugar'] },
  { label: 'Nutty / Roasted', tags: ['almond', 'hazelnut', 'toasted', 'smoky'] },
  { label: 'Spicy',           tags: ['cinnamon', 'clove', 'pepper'] },
  { label: 'Other',           tags: ['earthy', 'woody', 'herbal', 'fermented'] },
];

// ── ScoreRow (circle grid — used for sensory dimensions) ───────────────────────

function ScoreRow({
  max,
  value,
  onChange,
}: {
  max: number;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <View style={sr.row}>
      {Array.from({ length: max + 1 }, (_, i) => (
        <Pressable
          key={i}
          onPress={() => onChange(i)}
          style={[sr.circle, value === i && sr.circleActive]}
        >
          <Text style={[sr.num, value === i && sr.numActive]}>{i}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const sr = StyleSheet.create({
  row:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  circle:       { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.accentSubtle,
                  alignItems: 'center', justifyContent: 'center' },
  circleActive: { backgroundColor: Colors.accent },
  num:          { fontSize: 12, fontWeight: '500', color: Colors.textSecondary, fontVariant: ['tabular-nums'] },
  numActive:    { color: Colors.bgSurface, fontWeight: '600' },
});

// ── ScoreSlider (used for enjoyment + harmony) ─────────────────────────────────

function ScoreSlider({
  max,
  value,
  onChange,
  hint,
}: {
  max: number;
  value: number | null;
  onChange: (v: number) => void;
  hint: string;
}) {
  const [sliderVal, setSliderVal] = useState<number>(value ?? 0);
  const [prevValue, setPrevValue] = useState<typeof value>(value);
  if (prevValue !== value) {
    setPrevValue(value);
    if (value !== null) setSliderVal(value);
  }

  return (
    <View style={sc.container}>
      <View style={sc.valueRow}>
        <Text style={sc.number}>{Math.round(sliderVal)}</Text>
        <Text style={sc.max}>/ {max}</Text>
      </View>
      <Slider
        style={sc.slider}
        minimumValue={0}
        maximumValue={max}
        step={1}
        value={sliderVal}
        onValueChange={setSliderVal}
        onSlidingComplete={(v) => { const r = Math.round(v); setSliderVal(r); onChange(r); }}
        minimumTrackTintColor={Colors.accent}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={Colors.accent}
      />
      <Text style={sc.hint}>{hint}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  container: { gap: 0 },
  valueRow:  { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  number:    { fontSize: 36, fontWeight: '700', color: Colors.accent, fontVariant: ['tabular-nums'] },
  max:       { fontSize: 14, color: Colors.textTertiary },
  slider:    { width: '100%', height: 40, marginHorizontal: -8 },
  hint:      { fontSize: 12, fontStyle: 'italic', color: Colors.textTertiary, marginTop: 2 },
});

// ── Main screen ────────────────────────────────────────────────────────────────

type Step = 'pass-fail' | 'quick-score' | 'detailed';

export default function RateBrewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const brewId = Number(id);
  const router = useRouter();

  const { data: brew } = useLiveQuery(
    db.query.brews.findFirst({ where: eq(brews.id, brewId), with: { bean: true } })
  );

  const [step, setStep]               = useState<Step>('pass-fail');
  const [passed, setPassed]           = useState<boolean | null>(null);
  const [failReasons, setFailReasons] = useState<string[]>([]);
  const [enjoyment, setEnjoyment]     = useState<number | null>(null);
  const [harmony, setHarmony]         = useState<number | null>(null);
  const [brewIntent, setBrewIntent]   = useState<'definitely-yes' | 'maybe' | 'no' | null>(null);
  const [dimensions, setDimensions]   = useState<Record<string, number>>({});
  const [descriptors, setDescriptors] = useState<string[]>([]);
  const [saving, setSaving]           = useState(false);

  function toggleFailReason(reason: string) {
    setFailReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  }

  function toggleDescriptor(tag: string) {
    setDescriptors(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  async function save(includeDetailed: boolean) {
    setSaving(true);
    try {
      const tastingJson =
        includeDetailed && Object.keys(dimensions).length > 0 ? dimensions : undefined;
      const descJson =
        includeDetailed && descriptors.length > 0 ? descriptors : undefined;

      await db
        .update(brews)
        .set({
          isPass:          passed,
          failReasonsJson: !passed && failReasons.length > 0 ? failReasons : undefined,
          overallRating:   passed && enjoyment != null ? enjoyment : undefined,
          harmony:         passed && harmony != null ? harmony : undefined,
          brewIntent:      passed && brewIntent ? brewIntent : undefined,
          tastingJson,
          descriptorsJson: descJson,
        })
        .where(eq(brews.id, brewId));
      router.back();
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const methodDef = brew ? METHODS[brew.method as BrewMethod] : null;

  // ── Context card ─────────────────────────────────────────────────────────────

  const contextCard = (
    <View style={s.card}>
      <Text style={s.methodLabel}>{methodDef?.label ?? brew?.method ?? '…'}</Text>
      <Text style={s.beanName}>{brew?.bean ? brew.bean.name : 'No bean'}</Text>
      {brew?.brewedAt && (
        <Text style={s.dateText}>{brew.brewedAt.toLocaleDateString()}</Text>
      )}
    </View>
  );

  // ── Step indicator ────────────────────────────────────────────────────────────

  const stepNum = step === 'pass-fail' ? 1 : step === 'quick-score' ? 2 : 3;
  const stepIndicator = step !== 'detailed' && (
    <Text style={s.stepIndicator}>Step {stepNum} of 3</Text>
  );

  // ── Pass/Fail step ────────────────────────────────────────────────────────────

  const passFail = (
    <View style={{ gap: Spacing.md }}>
      <Text style={s.sectionHeader}>Is this cup acceptable?</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          style={[s.gateBtn, s.passBtn, passed === true && s.passBtnActive]}
          onPress={() => { setPassed(true); setFailReasons([]); }}
        >
          <Text style={[s.gateBtnText, s.passText]}>Pass</Text>
        </Pressable>
        <Pressable
          style={[s.gateBtn, s.failBtn, passed === false && s.failBtnActive]}
          onPress={() => setPassed(false)}
        >
          <Text style={[s.gateBtnText, s.failText]}>Fail</Text>
        </Pressable>
      </View>

      {passed === false && (
        <View style={{ gap: Spacing.sm }}>
          <Text style={s.sectionHeader}>What went wrong?</Text>
          <View style={s.chipRow}>
            {FAIL_REASONS.map(r => (
              <Pressable
                key={r}
                style={[s.chip, failReasons.includes(r) && s.chipActive]}
                onPress={() => toggleFailReason(r)}
              >
                <Text style={[s.chipText, failReasons.includes(r) && s.chipTextActive]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={[s.primaryBtn, saving && s.btnDisabled]} onPress={() => save(false)} disabled={saving}>
            <Text style={s.primaryBtnText}>Save</Text>
          </Pressable>
        </View>
      )}

      {passed === true && (
        <Pressable style={s.primaryBtn} onPress={() => setStep('quick-score')}>
          <Text style={s.primaryBtnText}>Continue</Text>
        </Pressable>
      )}
    </View>
  );

  // ── Quick Score step ──────────────────────────────────────────────────────────

  const quickScore = (
    <View style={{ gap: Spacing.md }}>
      <Text style={s.sectionHeader}>Overall Enjoyment</Text>
      <View style={s.card}>
        <ScoreSlider max={10} value={enjoyment} onChange={setEnjoyment} hint="0 = dislike extremely · 10 = like extremely" />
      </View>

      <Text style={s.sectionHeader}>Harmony</Text>
      <View style={s.card}>
        <ScoreSlider max={5} value={harmony} onChange={setHarmony} hint="How balanced and integrated is the cup?" />
      </View>

      <Text style={s.sectionHeader}>Brew Intent</Text>
      <View style={s.chipRow}>
        {(['definitely-yes', 'maybe', 'no'] as const).map(val => {
          const labels: Record<string, string> = {
            'definitely-yes': 'Definitely yes',
            'maybe': 'Maybe',
            'no': 'No',
          };
          return (
            <Pressable
              key={val}
              style={[s.chip, brewIntent === val && s.chipActive]}
              onPress={() => setBrewIntent(val)}
            >
              <Text style={[s.chipText, brewIntent === val && s.chipTextActive]}>
                {labels[val]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.sm }}>
        <Pressable
          style={[s.primaryBtn, { flex: 1 }, (enjoyment == null || saving) && s.btnDisabled]}
          disabled={enjoyment == null || saving}
          onPress={() => save(false)}
        >
          <Text style={s.primaryBtnText}>Save</Text>
        </Pressable>
        <Pressable
          style={[s.secondaryBtn, { flex: 1 }, enjoyment == null && s.btnDisabled]}
          disabled={enjoyment == null}
          onPress={() => setStep('detailed')}
        >
          <Text style={s.secondaryBtnText}>Add detail</Text>
        </Pressable>
      </View>
    </View>
  );

  // ── Detailed step ─────────────────────────────────────────────────────────────

  const detailed = (
    <View style={{ gap: Spacing.md }}>
      <Text style={s.sectionHeader}>Sensory Dimensions</Text>
      <View style={[s.card, { paddingVertical: 0 }]}>
        {SENSORY_DIMS.map((dim, idx) => (
          <View key={dim.key}>
            {idx > 0 && <View style={s.divider} />}
            <View style={{ paddingVertical: Spacing.md }}>
              <Text style={s.dimLabel}>{dim.label}</Text>
              <Text style={s.hint}>{dim.hint}</Text>
              <ScoreRow
                max={10}
                value={dimensions[dim.key] ?? null}
                onChange={v => setDimensions(d => ({ ...d, [dim.key]: v }))}
              />
            </View>
          </View>
        ))}
      </View>

      <Text style={s.sectionHeader}>Descriptors</Text>
      <View style={s.card}>
        {DESCRIPTOR_GROUPS.map(group => (
          <View key={group.label} style={{ marginBottom: 10 }}>
            <Text style={s.groupLabel}>{group.label.toUpperCase()}</Text>
            <View style={s.chipRow}>
              {group.tags.map(tag => (
                <Pressable
                  key={tag}
                  style={[s.chip, descriptors.includes(tag) && s.chipActive]}
                  onPress={() => toggleDescriptor(tag)}
                >
                  <Text style={[s.chipText, descriptors.includes(tag) && s.chipTextActive]}>
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>

      <Pressable
        style={[s.primaryBtn, saving && s.btnDisabled]}
        disabled={saving}
        onPress={() => save(true)}
      >
        <Text style={s.primaryBtnText}>Save</Text>
      </Pressable>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bgPage }}
      contentContainerStyle={{ padding: Spacing.base, paddingBottom: Spacing.xxxl, gap: Spacing.md }}
    >
      {contextCard}
      {stepIndicator}
      {step === 'pass-fail'   && passFail}
      {step === 'quick-score' && quickScore}
      {step === 'detailed'    && detailed}
    </ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card:         { backgroundColor: Colors.bgSurface, borderRadius: Radii.card, padding: Spacing.base, gap: 6 },
  methodLabel:  { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  beanName:     { fontSize: 14, color: Colors.textSecondary },
  dateText:     { fontSize: 12, color: Colors.textTertiary, fontVariant: ['tabular-nums'] },
  hint:         { color: Colors.textTertiary, fontSize: 12, fontStyle: 'italic', marginBottom: 6 },
  stepIndicator:{
    fontSize: 11, fontWeight: '500', color: Colors.textTertiary,
    letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center',
  },
  sectionHeader:{
    fontSize: 11, fontWeight: '500', color: Colors.textTertiary,
    letterSpacing: 0.8, textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  dimLabel:     { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  groupLabel:   { fontSize: 11, fontWeight: '500', color: Colors.textTertiary, letterSpacing: 0.8, marginBottom: 6 },
  divider:      { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { backgroundColor: Colors.accentSubtle, borderRadius: Radii.chip, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive:   { backgroundColor: Colors.accent },
  chipText:     { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive:{ color: Colors.bgSurface, fontWeight: '600' },
  gateBtn:      { flex: 1, borderRadius: Radii.card, paddingVertical: 20, alignItems: 'center',
                  justifyContent: 'center', borderWidth: 1.5 },
  passBtn:      { borderColor: Colors.accent, backgroundColor: Colors.bgSurface },
  passBtnActive:{ backgroundColor: Colors.accentSubtle },
  failBtn:      { borderColor: Colors.destructive, backgroundColor: Colors.bgSurface },
  failBtnActive:{ backgroundColor: 'rgba(185, 28, 28, 0.08)' },
  gateBtnText:  { fontSize: 16, fontWeight: '600' },
  passText:     { color: Colors.accent },
  failText:     { color: Colors.destructive },
  primaryBtn:   { backgroundColor: Colors.accent, borderRadius: Radii.button, paddingVertical: 16,
                  alignItems: 'center' },
  primaryBtnText:{ color: Colors.bgSurface, fontWeight: '600', fontSize: 15, letterSpacing: 0.2 },
  secondaryBtn: { borderWidth: 1.5, borderColor: Colors.accent, borderRadius: Radii.button,
                  paddingVertical: 16, alignItems: 'center', backgroundColor: 'transparent' },
  secondaryBtnText:{ color: Colors.accent, fontWeight: '600', fontSize: 15, letterSpacing: 0.2 },
  btnDisabled:  { opacity: 0.4 },
});
