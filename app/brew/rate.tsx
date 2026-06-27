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

// ── ScoreRow ───────────────────────────────────────────────────────────────────

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
  row:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  circle:      { width: 30, height: 30, borderRadius: 15, backgroundColor: '#eaded2',
                 alignItems: 'center', justifyContent: 'center' },
  circleActive:{ backgroundColor: '#7a4a2b' },
  num:         { fontSize: 12, fontWeight: '600', color: '#5a4636' },
  numActive:   { color: '#fff' },
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

  // Step state
  const [step, setStep]           = useState<Step>('pass-fail');
  const [passed, setPassed]       = useState<boolean | null>(null);
  const [failReasons, setFailReasons] = useState<string[]>([]);
  // Quick Score
  const [enjoyment, setEnjoyment] = useState<number | null>(null);
  const [harmony, setHarmony]     = useState<number | null>(null);
  const [brewIntent, setBrewIntent] =
    useState<'definitely-yes' | 'maybe' | 'no' | null>(null);
  // Detailed
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [descriptors, setDescriptors] = useState<string[]>([]);
  const [saving, setSaving]       = useState(false);

  // ── helpers ──────────────────────────────────────────────────────────────────

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

  // ── context card ─────────────────────────────────────────────────────────────

  const methodDef = brew ? METHODS[brew.method as BrewMethod] : null;

  const contextCard = (
    <View style={s.card}>
      <Text style={s.methodLabel}>{methodDef?.label ?? brew?.method ?? '…'}</Text>
      <Text style={s.beanName}>
        {brew?.bean ? brew.bean.name : 'No bean'}
      </Text>
      {brew?.brewedAt && (
        <Text style={s.muted}>{brew.brewedAt.toLocaleDateString()}</Text>
      )}
    </View>
  );

  // ── step indicator ────────────────────────────────────────────────────────────

  const stepNum = step === 'pass-fail' ? 1 : step === 'quick-score' ? 2 : 3;
  const stepIndicator = step !== 'detailed' && (
    <Text style={s.stepIndicator}>Step {stepNum} of 3</Text>
  );

  // ── Pass/Fail step ────────────────────────────────────────────────────────────

  const passFail = (
    <View style={{ gap: 12 }}>
      <Text style={s.sectionTitle}>Is this cup acceptable?</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          style={[s.gateBtn, s.passBtn, passed === true && s.passBtnActive]}
          onPress={() => { setPassed(true); setFailReasons([]); }}
        >
          <Text style={[s.gateBtnText, s.passText]}>✅ Pass</Text>
        </Pressable>
        <Pressable
          style={[s.gateBtn, s.failBtn, passed === false && s.failBtnActive]}
          onPress={() => setPassed(false)}
        >
          <Text style={[s.gateBtnText, s.failText]}>❌ Fail</Text>
        </Pressable>
      </View>

      {passed === false && (
        <View style={{ gap: 8 }}>
          <Text style={s.sectionTitle}>What went wrong?</Text>
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
            <Text style={s.primaryBtnText}>Save fail →</Text>
          </Pressable>
        </View>
      )}

      {passed === true && (
        <Pressable style={s.primaryBtn} onPress={() => setStep('quick-score')}>
          <Text style={s.primaryBtnText}>Continue →</Text>
        </Pressable>
      )}
    </View>
  );

  // ── Quick Score step ──────────────────────────────────────────────────────────

  const quickScore = (
    <View style={{ gap: 12 }}>
      <Text style={s.sectionTitle}>Overall Enjoyment (0–10)</Text>
      <View style={s.card}>
        <ScoreRow max={10} value={enjoyment} onChange={setEnjoyment} />
        <Text style={s.hint}>0 = dislike extremely · 10 = like extremely</Text>
      </View>

      <Text style={s.sectionTitle}>Harmony (0–5)</Text>
      <View style={s.card}>
        <ScoreRow max={5} value={harmony} onChange={setHarmony} />
        <Text style={s.hint}>How balanced and integrated is the cup?</Text>
      </View>

      <Text style={s.sectionTitle}>Brew Intent</Text>
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

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        <Pressable
          style={[s.primaryBtn, { flex: 1 }, (enjoyment == null || saving) && s.btnDisabled]}
          disabled={enjoyment == null || saving}
          onPress={() => save(false)}
        >
          <Text style={s.primaryBtnText}>Save →</Text>
        </Pressable>
        <Pressable
          style={[s.secondaryBtn, { flex: 1 }, enjoyment == null && s.btnDisabled]}
          disabled={enjoyment == null}
          onPress={() => setStep('detailed')}
        >
          <Text style={s.secondaryBtnText}>Add detail →</Text>
        </Pressable>
      </View>
    </View>
  );

  // ── Detailed step ─────────────────────────────────────────────────────────────

  const detailed = (
    <View style={{ gap: 12 }}>
      <Text style={s.sectionTitle}>Sensory Dimensions</Text>
      <View style={s.card}>
        {SENSORY_DIMS.map((dim, idx) => (
          <View key={dim.key}>
            {idx > 0 && <View style={s.divider} />}
            <Text style={s.dimLabel}>{dim.label}</Text>
            <Text style={s.hint}>{dim.hint}</Text>
            <ScoreRow
              max={10}
              value={dimensions[dim.key] ?? null}
              onChange={v => setDimensions(d => ({ ...d, [dim.key]: v }))}
            />
          </View>
        ))}
      </View>

      <Text style={s.sectionTitle}>Descriptors</Text>
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
        <Text style={s.primaryBtnText}>Save with detail →</Text>
      </Pressable>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fbf7f2' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
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
  card:          { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 6 },
  methodLabel:   { fontSize: 18, fontWeight: '700', color: '#3a2a1c' },
  beanName:      { fontSize: 14, color: '#8a7a6c' },
  muted:         { color: '#8a7a6c', fontSize: 13 },
  hint:          { color: '#8a7a6c', fontSize: 12, marginBottom: 6 },
  stepIndicator: { color: '#8a7a6c', fontSize: 13, textAlign: 'center' },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: '#3a2a1c', marginTop: 12, marginBottom: 4 },
  dimLabel:      { fontSize: 14, fontWeight: '600', color: '#3a2a1c', marginBottom: 2, marginTop: 6 },
  groupLabel:    { fontSize: 11, fontWeight: '700', color: '#8a7a6c', letterSpacing: 0.8, marginBottom: 6 },
  divider:       { height: 1, backgroundColor: '#f0e8de', marginVertical: 10 },
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { backgroundColor: '#eaded2', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive:    { backgroundColor: '#7a4a2b' },
  chipText:      { fontSize: 13, color: '#5a4636' },
  chipTextActive:{ color: '#fff' },
  // Pass/Fail gate buttons
  gateBtn:       { flex: 1, borderRadius: 14, paddingVertical: 20, alignItems: 'center',
                   justifyContent: 'center', borderWidth: 2 },
  passBtn:       { borderColor: '#2e7d32', backgroundColor: '#fff' },
  passBtnActive: { backgroundColor: '#e8f5e9' },
  failBtn:       { borderColor: '#c62828', backgroundColor: '#fff' },
  failBtnActive: { backgroundColor: '#ffebee' },
  gateBtnText:   { fontSize: 16, fontWeight: '700' },
  passText:      { color: '#2e7d32' },
  failText:      { color: '#c62828' },
  // Action buttons
  primaryBtn:    { backgroundColor: '#7a4a2b', borderRadius: 10, paddingVertical: 14,
                   alignItems: 'center' },
  primaryBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn:  { borderWidth: 2, borderColor: '#7a4a2b', borderRadius: 10, paddingVertical: 14,
                   alignItems: 'center' },
  secondaryBtnText: { color: '#7a4a2b', fontWeight: '700', fontSize: 15 },
  btnDisabled:   { opacity: 0.4 },
});
