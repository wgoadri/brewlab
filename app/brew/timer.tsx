import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';

import { db } from '@/db/client';
import { brews } from '@/db/schema';
import { METHODS } from '@/lib/methods';
import { getPendingBrew, clearPendingBrew, type BrewDraft } from '@/lib/brewDraft';

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Wrapper ─────────────────────────────────────────────────────────────────

export default function TimerScreen() {
  const router = useRouter();
  const draft = getPendingBrew();

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

// ── Content ──────────────────────────────────────────────────────────────────

function TimerContent({ draft }: { draft: BrewDraft }) {
  const router = useRouter();
  useKeepAwake();

  const steps = METHODS[draft.method].defaultSteps;
  const timerMode = METHODS[draft.method].timerMode;

  const [stepIndex, setStepIndex] = useState(0);
  const [stepStartMs, setStepStartMs] = useState(() => Date.now());
  const [brewStartMs] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);
  const [completedMs, setCompletedMs] = useState<number[]>([]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const currentStep = steps[stepIndex];
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
      setStepStartMs(Date.now());
    }
  }

  useEffect(() => {
    if (timerMode !== 'guided') return;
    if (currentStep.durationSec && stepElapsedMs >= durationMs) {
      // schedule outside effect body to satisfy react-hooks/set-state-in-effect
      const id = setTimeout(advanceStep, 0);
      return () => clearTimeout(id);
    }
    // advanceStep closes over stepIndex/stepStartMs which change each render;
    // re-registering on `now` (the tick) is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  async function onDone() {
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const finalElapsed = Date.now() - stepStartMs;
    const allMs = [...completedMs, finalElapsed];
    const stepsJson = steps.map((s, i) => ({
      label: s.label,
      durationSec: Math.round((allMs[i] ?? 0) / 1000),
    }));
    const totalTimeS = Math.round((Date.now() - brewStartMs) / 1000);
    try {
      const result = await db.insert(brews).values({
        method: draft.method,
        beanId: draft.beanId,
        doseG: draft.doseG,
        waterG: draft.waterG,
        ratio: draft.ratio,
        grindSetting: draft.grindSetting,
        waterTempC: draft.waterTempC,
        bloomWaterG: draft.bloomWaterG,
        bloomTimeS: draft.bloomTimeS,
        paramsJson: draft.paramsJson,
        notes: draft.notes,
        totalTimeS,
        stepsJson,
      });
      clearPendingBrew();
      router.replace(`/brew/${result.lastInsertRowId}`);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  const countdownWarning = timerMode === 'guided' && remaining < 5000 && remaining > 0;

  let advanceBtnLabel: string;
  if (isLastStep) {
    advanceBtnLabel = 'Done ✓';
  } else if (timerMode === 'guided') {
    advanceBtnLabel = 'Skip →';
  } else {
    advanceBtnLabel = 'Next →';
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Total elapsed */}
      <Text style={styles.totalElapsed}>{formatMs(totalElapsedMs)} total</Text>

      {/* Step info */}
      <View style={styles.stepInfo}>
        <Text style={styles.stepCounter}>
          Step {stepIndex + 1} of {steps.length}
        </Text>
        <Text style={styles.stepLabel}>{currentStep.label}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as `${number}%` }]} />
      </View>

      {/* Countdown / count-up */}
      <Text style={[styles.timeDisplay, countdownWarning && styles.timeDisplayWarning]}>
        {timerMode === 'guided' ? formatMs(remaining) : formatMs(stepElapsedMs)}
      </Text>

      {/* Advance / Done button */}
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
    backgroundColor: '#1a1008',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#f5ede3',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  totalElapsed: {
    color: '#a89080',
    fontSize: 14,
    position: 'absolute',
    top: 24,
  },
  stepInfo: {
    alignItems: 'center',
    gap: 8,
  },
  stepCounter: {
    color: '#a89080',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stepLabel: {
    color: '#f5ede3',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#3a2a1c',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: '#e8a87c',
    borderRadius: 3,
  },
  timeDisplay: {
    color: '#e8a87c',
    fontSize: 56,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timeDisplayWarning: {
    color: '#e84c4c',
  },
  btn: {
    backgroundColor: '#7a4a2b',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
