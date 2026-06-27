import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ParameterChart } from '@/components/analysis/ParameterChart';
import { ProgressChart } from '@/components/analysis/ProgressChart';
import { db } from '@/db/client';
import { beans, brews, grinders } from '@/db/schema';
import { diagnose, getParamValue, toObservations } from '@/lib/analysis';
import { setSuggestion } from '@/lib/brewSuggestion';
import { METHOD_LIST, optimizableParams, type BrewMethod } from '@/lib/methods';
import { suggestNextBrew } from '@/lib/optimizer';
import { Colors, Radii, Spacing } from '@/lib/theme';

// ── Selector ───────────────────────────────────────────────────────────────────

function ChipRow<T extends string | number>({
  items,
  selected,
  onSelect,
  label,
  noneLabel,
}: {
  items: { id: T; label: string }[];
  selected: T | null;
  onSelect: (id: T | null) => void;
  label: string;
  noneLabel?: string;
}) {
  return (
    <View style={s.selectorGroup}>
      <Text style={s.selectorLabel}>{label}</Text>
      <View style={s.chipRow}>
        {noneLabel && (
          <Pressable
            style={[s.chip, selected === null && s.chipActive]}
            onPress={() => onSelect(null)}
          >
            <Text style={[s.chipText, selected === null && s.chipTextActive]}>{noneLabel}</Text>
          </Pressable>
        )}
        {items.map(item => (
          <Pressable
            key={item.id}
            style={[s.chip, selected === item.id && s.chipActive]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={[s.chipText, selected === item.id && s.chipTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ── Sensory diagnosis ──────────────────────────────────────────────────────────

function SensorySection({ brew }: { brew: { tastingJson: Record<string, number> } }) {
  const diagnosis = diagnose(brew.tastingJson);
  // index ∈ [-1, 1]; 0 = balanced. Map to [0, 1] for the gauge fill.
  const fillRatio = (diagnosis.index + 1) / 2;
  const stateColor =
    diagnosis.state === 'Balanced'
      ? Colors.accent
      : diagnosis.state === 'Under-extracted'
        ? '#C2793A'
        : Colors.destructive;

  return (
    <>
      <Text style={s.sectionHeader}>Sensory Diagnosis</Text>
      <View style={s.card}>
        <Text style={[s.diagnosisState, { color: stateColor }]}>{diagnosis.state}</Text>
        <Text style={s.hint}>Based on the latest brew{"'"}s tasting scores.</Text>

        {/* Extraction gauge */}
        <View style={s.gaugeRow}>
          <Text style={s.gaugeEnd}>Under</Text>
          <View style={s.gaugeTrack}>
            <View style={[s.gaugeFilled, { flex: fillRatio }]} />
            <View style={s.gaugeMarker} />
            <View style={{ flex: 1 - fillRatio }} />
          </View>
          <Text style={s.gaugeEnd}>Over</Text>
        </View>

        <Text style={s.diagnosisLabel}>Try next</Text>
        <View style={s.chipRow}>
          {diagnosis.actions.map(a => (
            <View key={a} style={s.actionChip}>
              <Text style={s.actionChipText}>{a}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

// ── Compare + suggest ──────────────────────────────────────────────────────────

function CompareSection({
  brews: brewSet,
  method,
  beanId,
  grinderId,
}: {
  brews: (typeof brews.$inferSelect)[];
  method: BrewMethod;
  beanId: number | null;
  grinderId: number | null;
}) {
  const router = useRouter();
  const last = brewSet[brewSet.length - 1];
  const best = brewSet.reduce((a, b) =>
    (b.overallRating ?? -1) > (a.overallRating ?? -1) ? b : a,
  );
  const observations = toObservations(brewSet, method);
  const suggestion = suggestNextBrew(method, observations);
  const params = optimizableParams(method).filter(
    s => s.type === 'number' || s.type === 'int',
  );

  function prefill() {
    setSuggestion({
      method,
      beanId: beanId ?? undefined,
      grinderId: grinderId ?? undefined,
      params: suggestion.params,
      rationale: suggestion.rationale,
    });
    router.push('/brew/new');
  }

  return (
    <>
      <Text style={s.sectionHeader}>Last vs Best</Text>
      <View style={[s.card, { paddingVertical: 0 }]}>
        {/* Header row */}
        <View style={[s.deltaRow, s.deltaHeader]}>
          <Text style={[s.deltaCol, s.deltaLabelCol, s.deltaHeaderText]}>Param</Text>
          <Text style={[s.deltaCol, s.deltaHeaderText]}>Last</Text>
          <Text style={[s.deltaCol, s.deltaHeaderText]}>Best</Text>
          <Text style={[s.deltaCol, s.deltaHeaderText]}>Δ</Text>
        </View>
        {params.map((spec, idx) => {
          const lastVal = getParamValue(last, spec);
          const bestVal = getParamValue(best, spec);
          const delta =
            lastVal != null && bestVal != null ? lastVal - bestVal : null;
          const fmt = (v: number) =>
            spec.type === 'int' ? String(Math.round(v)) : v.toFixed(1);
          const unit = spec.unit ? ` ${spec.unit}` : '';
          const deltaColor =
            delta == null
              ? Colors.textTertiary
              : Math.abs(delta) < 0.05
                ? Colors.textTertiary
                : Colors.textSecondary;
          return (
            <View key={spec.key} style={[s.deltaRow, idx > 0 && s.deltaRowBorder]}>
              <Text style={[s.deltaCol, s.deltaLabelCol, s.deltaLabelText]}>{spec.label}</Text>
              <Text style={[s.deltaCol, s.deltaValueText]}>
                {lastVal != null ? `${fmt(lastVal)}${unit}` : '–'}
              </Text>
              <Text style={[s.deltaCol, s.deltaValueText]}>
                {bestVal != null ? `${fmt(bestVal)}${unit}` : '–'}
              </Text>
              <Text style={[s.deltaCol, s.deltaValueText, { color: deltaColor }]}>
                {delta == null
                  ? '–'
                  : `${delta > 0 ? '+' : ''}${fmt(delta)}${unit}`}
              </Text>
            </View>
          );
        })}
        {/* Score row */}
        {(() => {
          const lScore = last.overallRating;
          const bScore = best.overallRating;
          const delta =
            lScore != null && bScore != null ? lScore - bScore : null;
          return (
            <View style={[s.deltaRow, s.deltaRowBorder, s.deltaScoreRow]}>
              <Text style={[s.deltaCol, s.deltaLabelCol, s.deltaLabelText]}>Score</Text>
              <Text style={[s.deltaCol, s.deltaValueText, { color: Colors.accent }]}>
                {lScore ?? '–'}
              </Text>
              <Text style={[s.deltaCol, s.deltaValueText, { color: Colors.accent }]}>
                {bScore ?? '–'}
              </Text>
              <Text
                style={[
                  s.deltaCol,
                  s.deltaValueText,
                  {
                    color:
                      delta == null
                        ? Colors.textTertiary
                        : delta >= 0
                          ? Colors.accent
                          : Colors.destructive,
                  },
                ]}
              >
                {delta == null
                  ? '–'
                  : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`}
              </Text>
            </View>
          );
        })()}
      </View>

      <Text style={s.sectionHeader}>Next Suggestion</Text>
      <View style={s.card}>
        <Text style={s.rationaleText}>{suggestion.rationale}</Text>
        {/* Key params from suggestion */}
        <View style={s.suggestionParams}>
          {params.slice(0, 4).map(spec => {
            const v = suggestion.params[spec.key];
            if (v == null) return null;
            const fmt =
              typeof v === 'number'
                ? spec.type === 'int'
                  ? String(Math.round(v as number))
                  : (v as number).toFixed(1)
                : String(v);
            return (
              <View key={spec.key} style={s.suggestionParam}>
                <Text style={s.suggestionParamLabel}>{spec.label}</Text>
                <Text style={s.suggestionParamValue}>
                  {fmt}
                  {spec.unit ? ` ${spec.unit}` : ''}
                </Text>
              </View>
            );
          })}
        </View>
        <Pressable style={s.primaryBtn} onPress={prefill}>
          <Text style={s.primaryBtnText}>Prefill next brew</Text>
        </Pressable>
      </View>
    </>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function AnalysisScreen() {
  const [selectedBeanId, setSelectedBeanId] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<BrewMethod | null>(null);
  const [selectedGrinderId, setSelectedGrinderId] = useState<number | null>(null);
  const [selectedParamKey, setSelectedParamKey] = useState<string | null>(null);

  const { data: beanList } = useLiveQuery(db.select().from(beans).orderBy(beans.name));
  const { data: grinderList } = useLiveQuery(
    db.select().from(grinders).orderBy(grinders.name),
  );

  const comparableQuery = useMemo(
    () =>
      db.query.brews.findMany({
        where: and(
          selectedBeanId != null ? eq(brews.beanId, selectedBeanId) : undefined,
          selectedMethod != null ? eq(brews.method, selectedMethod) : undefined,
          selectedGrinderId != null ? eq(brews.grinderId, selectedGrinderId) : undefined,
          eq(brews.isPass, true),
          isNotNull(brews.overallRating),
        ),
        orderBy: [asc(brews.brewedAt)],
      }),
    [selectedBeanId, selectedMethod, selectedGrinderId],
  );
  const { data: comparable } = useLiveQuery(comparableQuery);
  const brewSet = useMemo(() => comparable ?? [], [comparable]);
  const n = brewSet.length;

  const tunable = selectedMethod ? optimizableParams(selectedMethod) : [];
  const numericTunable = tunable.filter(s => s.type === 'number' || s.type === 'int');

  // Active param spec for View 2
  const activeParamKey = selectedParamKey ?? numericTunable[0]?.key ?? null;
  const activeSpec = numericTunable.find(s => s.key === activeParamKey) ?? null;

  // Optimizer suggestion (for View 2 dashed line + View 3)
  const observations = useMemo(
    () => (selectedMethod ? toObservations(brewSet, selectedMethod) : []),
    [brewSet, selectedMethod],
  );
  const suggestion = useMemo(
    () =>
      selectedMethod && observations.length > 0
        ? suggestNextBrew(selectedMethod, observations)
        : null,
    [selectedMethod, observations],
  );

  // Grinder for active selection (for paramRange override on grindSetting)
  const activeGrinder = useMemo(
    () => grinderList?.find(g => g.id === selectedGrinderId) ?? null,
    [grinderList, selectedGrinderId],
  );

  // Latest brew with tasting scores (for sensory diagnosis)
  const latestWithTasting = useMemo(
    () =>
      [...brewSet]
        .reverse()
        .find(b => b.tastingJson && Object.keys(b.tastingJson).length > 0) ?? null,
    [brewSet],
  );

  const ready = selectedBeanId != null && selectedMethod != null;

  return (
    <SafeAreaView style={s.flex} edges={['bottom']}>
      {/* ── Sticky selector ─────────────────────────────────────────────── */}
      <View style={s.selectorPanel}>
        <ChipRow
          label="Bean"
          items={(beanList ?? []).map(b => ({ id: b.id, label: b.name }))}
          selected={selectedBeanId}
          onSelect={setSelectedBeanId}
        />
        <ChipRow
          label="Method"
          items={METHOD_LIST.map(m => ({ id: m.id as BrewMethod, label: m.label }))}
          selected={selectedMethod}
          onSelect={id => {
            setSelectedMethod(id);
            setSelectedParamKey(null);
          }}
        />
        {grinderList && grinderList.length > 1 && (
          <ChipRow
            label="Grinder (optional)"
            noneLabel="All"
            items={grinderList.map(g => ({ id: g.id, label: g.name }))}
            selected={selectedGrinderId}
            onSelect={setSelectedGrinderId}
          />
        )}
      </View>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <ScrollView style={s.flex} contentContainerStyle={s.content}>
        {!ready ? (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>Select a bean and method</Text>
            <Text style={s.emptyBody}>
              The analysis conditions on one bean + brewing method at a time{' — '}that{"'"}s
              the smallest comparable unit.
            </Text>
          </View>
        ) : n === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>No rated brews yet</Text>
            <Text style={s.emptyBody}>
              Log a few brews with this bean on this method, rate them, and come back.
            </Text>
          </View>
        ) : (
          <>
            {/* ── View 1: Progress ──────────────────────────────────────── */}
            <Text style={s.sectionHeader}>Progress</Text>
            <View style={s.card}>
              <ProgressChart brews={brewSet} />
              {n <= 2 && (
                <Text style={s.hint}>
                  {3 - n} more rated brew{3 - n !== 1 ? 's' : ''} to unlock parameter analysis.
                </Text>
              )}
            </View>

            {/* ── View 2: Parameter explorer (Early+) ───────────────────── */}
            {n >= 3 && numericTunable.length > 0 && activeSpec && (
              <>
                <Text style={s.sectionHeader}>Parameter Explorer</Text>
                <View style={s.card}>
                  {/* Param picker */}
                  <View style={s.chipRow}>
                    {numericTunable.map(spec => (
                      <Pressable
                        key={spec.key}
                        style={[
                          s.chip,
                          activeParamKey === spec.key && s.chipActive,
                        ]}
                        onPress={() => setSelectedParamKey(spec.key)}
                      >
                        <Text
                          style={[
                            s.chipText,
                            activeParamKey === spec.key && s.chipTextActive,
                          ]}
                        >
                          {spec.label}
                          {spec.unit ? ` (${spec.unit})` : ''}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <ParameterChart
                    brews={brewSet}
                    spec={activeSpec}
                    grinder={activeGrinder}
                    suggestionX={
                      suggestion?.params[activeSpec.key] != null
                        ? Number(suggestion.params[activeSpec.key])
                        : undefined
                    }
                  />
                </View>

                {/* ── View 3: Compare + suggest ───────────────────────── */}
                <CompareSection
                  brews={brewSet}
                  method={selectedMethod}
                  beanId={selectedBeanId}
                  grinderId={selectedGrinderId}
                />
              </>
            )}

            {/* ── View 4: Sensory diagnosis ─────────────────────────────── */}
            {latestWithTasting?.tastingJson && (
              <SensorySection
                brew={{ tastingJson: latestWithTasting.tastingJson as Record<string, number> }}
              />
            )}

            {/* Bottom breathing room */}
            <View style={{ height: Spacing.xl }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bgPage },

  // Selector panel
  selectorPanel: {
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  selectorGroup: { gap: 6 },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Content
  content: { padding: Spacing.base, gap: 0 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radii.card,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  hint: { fontSize: 12, fontStyle: 'italic', color: Colors.textTertiary },

  // Empty states
  emptyState: {
    marginTop: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  emptyBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.chip,
    backgroundColor: Colors.accentSubtle,
  },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { fontSize: 12, fontWeight: '600', color: Colors.bgSurface },

  // Sensory diagnosis
  diagnosisState: { fontSize: 16, fontWeight: '600' },
  diagnosisLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  gaugeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  gaugeEnd: { fontSize: 11, color: Colors.textTertiary, width: 36 },
  gaugeTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    flexDirection: 'row',
    overflow: 'visible',
  },
  gaugeFilled: { borderRadius: 4, backgroundColor: Colors.accentSubtle },
  gaugeMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
    marginTop: -2,
    borderWidth: 2,
    borderColor: Colors.bgSurface,
  },
  actionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.chip,
    backgroundColor: Colors.accentSubtle,
  },
  actionChipText: { fontSize: 12, fontWeight: '500', color: Colors.accent },

  // Compare / delta table
  deltaHeader: { paddingVertical: Spacing.sm, backgroundColor: Colors.bgPage },
  deltaHeaderText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  deltaRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  deltaScoreRow: { paddingBottom: 2 },
  deltaCol: { flex: 1, textAlign: 'right' },
  deltaLabelCol: { flex: 1.5, textAlign: 'left' },
  deltaLabelText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  deltaValueText: { fontSize: 13, fontVariant: ['tabular-nums'], color: Colors.textPrimary },

  // Suggestion
  rationaleText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  suggestionParams: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 2,
  },
  suggestionParam: {
    backgroundColor: Colors.accentSubtle,
    borderRadius: Radii.chip,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  suggestionParamLabel: { fontSize: 10, color: Colors.textTertiary, marginBottom: 1 },
  suggestionParamValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
    fontVariant: ['tabular-nums'],
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: Colors.bgSurface, fontWeight: '600', fontSize: 15, letterSpacing: 0.2 },
});
