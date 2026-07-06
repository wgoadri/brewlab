import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';

import { db } from '@/db/client';
import { brews } from '@/db/schema';
import { METHODS } from '@/lib/methods';
import { applyMeasuredDurations, buildTimerSteps } from '@/lib/recipeSteps';
import { getPendingBrew, clearPendingBrew, type BrewDraft } from '@/lib/brewDraft';
import { Colors } from '@/lib/theme';

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimerScreen() {
  const router = useRouter();
  // Consume the draft once (same pattern as the suggestion prefill in new.tsx):
  // backing out of the timer must not leave a stale draft for the next visit.
  const [draft] = useState<BrewDraft | null>(() => {
    const d = getPendingBrew();
    if (d) clearPendingBrew();
    return d;
  });

  if (!draft) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Text style={styles.errorText}>No brew in progress.</Text>
        <Pressable style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return <TimerContent draft={draft} />;
}

function TimerContent({ draft }: { draft: BrewDraft }) {
  const router = useRouter();
  useKeepAwake();

  // Prep step + recipe steps (or method defaults), with linked durations read
  // from the brew's params and {placeholder} instructions resolved.
  const [steps] = useState(() => buildTimerSteps(draft));
  const timerMode = METHODS[draft.method].timerMode;

  const [stepIndex, setStepIndex] = useState(0);
  const [stepStartMs, setStepStartMs] = useState(() => Date.now());
  // Reset when leaving the prep step: grinding time is not brew time.
  const [brewStartMs, setBrewStartMs] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);
  const [completedMs, setCompletedMs] = useState<number[]>([]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const currentStep = steps[stepIndex];
  const instruction = currentStep.instruction ?? null;
  const durationMs = (currentStep.durationSec ?? 0) * 1000;
  const stepElapsedMs = now - stepStartMs;
  const totalElapsedMs = now - brewStartMs;
  const remaining = Math.max(0, durationMs - stepElapsedMs);
  const progress = durationMs > 0 ? Math.min(1, stepElapsedMs / durationMs) : 0;
  const isLastStep = stepIndex === steps.length - 1;

  function advanceStep() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const elapsed = Date.now() - stepStartMs;
    setCompletedMs((prev) => [...prev, elapsed]);
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      const now = Date.now();
      setStepStartMs(now);
      if (currentStep.isPrep) setBrewStartMs(now);
    }
  }

  useEffect(() => {
    if (timerMode !== 'guided') return;
    // Last step never auto-advances: advanceStep() would re-fire on every tick
    // (haptic loop + duplicate completedMs entries) — the user ends it with Done.
    if (isLastStep) return;
    if (currentStep.durationSec && stepElapsedMs >= durationMs) {
      const id = setTimeout(advanceStep, 0);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  // Set when Done is pressed: freezes the recorded times while the (optional)
  // final-yield prompt is shown. The brew is inserted from these values.
  const [pendingResult, setPendingResult] = useState<{
    stepsJson: { label: string; durationSec: number }[];
    totalTimeS: number;
    /** Aligned with `steps` (prep included) for the param write-back. */
    measuredSec: number[];
  } | null>(null);
  const [yieldText, setYieldText] = useState('');

  function onDone() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const finalElapsed = Date.now() - stepStartMs;
    const allMs = [...completedMs, finalElapsed];
    const measuredSec = steps.map((_, i) => Math.round((allMs[i] ?? 0) / 1000));
    const stepsJson = steps
      .map((s, i) => ({ label: s.label, durationSec: measuredSec[i], isPrep: s.isPrep }))
      .filter((s) => !s.isPrep)
      .map(({ label, durationSec }) => ({ label, durationSec }));
    const totalTimeS = Math.round((Date.now() - brewStartMs) / 1000);
    setPendingResult({ stepsJson, totalTimeS, measuredSec });
  }

  async function saveBrew(finalYieldG?: number) {
    if (!pendingResult) return;
    setSaving(true);
    const { stepsJson, totalTimeS, measuredSec } = pendingResult;
    // Linked steps write their measured time back into the brew's params.
    const adjusted = applyMeasuredDurations(draft, steps, measuredSec);
    try {
      const result = await db.insert(brews).values({
        method: adjusted.method,
        beanId: adjusted.beanId,
        grinderId: adjusted.grinderId,
        doseG: adjusted.doseG,
        waterG: adjusted.waterG,
        ratio: adjusted.ratio,
        grindSetting: adjusted.grindSetting,
        waterTempC: adjusted.waterTempC,
        bloomWaterG: adjusted.bloomWaterG,
        bloomTimeS: adjusted.bloomTimeS,
        paramsJson: adjusted.paramsJson,
        notes: adjusted.notes,
        totalTimeS,
        stepsJson,
        finalYieldG,
        recipeId: adjusted.recipeId,
      });
      router.replace(`/brew/${result.lastInsertRowId}`);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  function onSaveWithYield() {
    const parsed = parseFloat(yieldText.replace(',', '.'));
    saveBrew(Number.isFinite(parsed) && parsed > 0 ? parsed : undefined);
  }

  const countdownWarning = timerMode === 'guided' && remaining < 5000 && remaining > 0;

  let advanceBtnLabel: string;
  if (isLastStep) {
    advanceBtnLabel = 'Done';
  } else if (currentStep.isPrep) {
    advanceBtnLabel = 'Start brew';
  } else if (timerMode === 'guided') {
    advanceBtnLabel = 'Skip';
  } else {
    advanceBtnLabel = 'Next';
  }

  if (pendingResult) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.stepInfo}>
          <Text style={styles.stepCounter}>Brew finished · {formatMs(pendingResult.totalTimeS * 1000)}</Text>
          <Text style={styles.stepLabel}>Final yield?</Text>
          <Text style={styles.yieldHint}>Weight of coffee in the cup — skip if you didn’t measure.</Text>
        </View>
        <View style={styles.yieldRow}>
          <TextInput
            style={styles.yieldInput}
            value={yieldText}
            onChangeText={setYieldText}
            keyboardType='decimal-pad'
            placeholder='0'
            placeholderTextColor={Colors.textTertiary}
            autoFocus
          />
          <Text style={styles.yieldUnit}>g</Text>
        </View>
        <Pressable
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={onSaveWithYield}
          disabled={saving}
        >
          <Text style={styles.btnText}>Save brew</Text>
        </Pressable>
        <Pressable onPress={() => saveBrew(undefined)} disabled={saving}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.totalElapsed}>{formatMs(totalElapsedMs)} total</Text>

      <View style={styles.stepInfo}>
        <Text style={styles.stepCounter}>
          Step {stepIndex + 1} of {steps.length}
        </Text>
        <Text style={styles.stepLabel}>{currentStep.label}</Text>
        {instruction ? <Text style={styles.stepInstruction}>{instruction}</Text> : null}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as `${number}%` }]} />
      </View>

      <Text style={[styles.timeDisplay, countdownWarning && styles.timeDisplayWarning]}>
        {timerMode === 'guided' ? formatMs(remaining) : formatMs(stepElapsedMs)}
      </Text>

      <Pressable
        style={[styles.btn, saving && styles.btnDisabled]}
        onPress={isLastStep ? onDone : advanceStep}
        disabled={saving}
      >
        <Text style={styles.btnText}>{advanceBtnLabel}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.timerBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 24,
  },
  errorText: {
    color: Colors.timerText,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  totalElapsed: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    position: 'absolute',
    top: 0,
  },
  stepInfo: {
    alignItems: 'center',
    gap: 8,
  },
  stepCounter: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  stepLabel: {
    color: Colors.timerText,
    fontSize: 30,
    fontWeight: '300',
    textAlign: 'center',
  },
  stepInstruction: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: Colors.timerTrack,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  timeDisplay: {
    color: Colors.timerText,
    fontSize: 64,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  timeDisplayWarning: {
    color: Colors.destructive,
  },
  btn: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 56,
    alignItems: 'center',
    minWidth: 200,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: Colors.timerText,
    fontSize: 18,
    fontWeight: '600',
  },
  yieldHint: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  yieldRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  yieldInput: {
    color: Colors.timerText,
    fontSize: 64,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    minWidth: 120,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.timerTrack,
    paddingBottom: 4,
  },
  yieldUnit: {
    color: Colors.textSecondary,
    fontSize: 24,
    fontWeight: '300',
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
    padding: 8,
  },
});
