import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { ParamSpec } from '@/lib/methods';
import { Colors, Radii } from '@/lib/theme';

export interface ParamInputProps {
  spec: ParamSpec;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
  error?: string;
}

// Use a slider when the param has a bounded range that fits comfortably on a track.
function shouldUseSlider(spec: ParamSpec): boolean {
  if (spec.min == null || spec.max == null) return false;
  const range = spec.max - spec.min;
  if (range < 3) return false;
  if (spec.type === 'int') return range <= 60;
  if (spec.type === 'number' && spec.step != null) return range / spec.step <= 30;
  return false;
}

export function ParamInput({ spec, value, onChange, error }: ParamInputProps) {
  const [raw, setRaw] = useState<string>(
    value != null && value !== '' ? String(value) : '',
  );

  if (spec.type === 'boolean') {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{spec.label}</Text>
        <Switch
          value={Boolean(value)}
          onValueChange={onChange}
          thumbColor={Colors.bgSurface}
          trackColor={{ false: Colors.border, true: Colors.accent }}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  if (spec.type === 'enum' && spec.options) {
    return (
      <View>
        <Text style={styles.label}>{spec.label}</Text>
        <View style={styles.chipRow}>
          {spec.options.map((opt) => {
            const active = value === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => onChange(opt)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  if ((spec.type === 'number' || spec.type === 'int') && shouldUseSlider(spec)) {
    return (
      <SliderInput
        spec={spec}
        value={value}
        onChange={onChange}
        error={error}
      />
    );
  }

  if (spec.type === 'number' || spec.type === 'int') {
    const keyboard = spec.type === 'int' ? 'numeric' : 'decimal-pad';
    const rangeHint =
      spec.min != null && spec.max != null
        ? `${spec.min} – ${spec.max}${spec.unit ? ' ' + spec.unit : ''}`
        : null;
    return (
      <View>
        <Text style={styles.label}>{spec.label}</Text>
        <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
          <TextInput
            style={styles.inputInner}
            keyboardType={keyboard}
            value={raw}
            onChangeText={(t) => setRaw(t)}
            onBlur={() => {
              const parsed = spec.type === 'int' ? parseInt(raw, 10) : parseFloat(raw);
              onChange(parsed);
            }}
            placeholder={spec.default != null ? String(spec.default) : undefined}
            placeholderTextColor={Colors.textTertiary}
          />
          {spec.unit ? <Text style={styles.inputUnit}>{spec.unit}</Text> : null}
        </View>
        {rangeHint ? <Text style={styles.rangeHint}>{rangeHint}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  // text
  return (
    <View>
      <Text style={styles.label}>{spec.label}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <TextInput
          style={styles.inputInner}
          value={typeof value === 'string' ? value : ''}
          onChangeText={(t) => onChange(t)}
          placeholder={spec.default != null ? String(spec.default) : undefined}
          placeholderTextColor={Colors.textTertiary}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

// ── Slider variant ────────────────────────────────────────────────────────────

function SliderInput({ spec, value, onChange, error }: ParamInputProps) {
  const initial =
    typeof value === 'number'
      ? value
      : spec.default != null
        ? Number(spec.default)
        : (spec.min ?? 0);

  const [sliderVal, setSliderVal] = useState<number>(initial);

  useEffect(() => {
    if (typeof value === 'number') setSliderVal(value);
  }, [value]);

  const formatted =
    spec.step != null && spec.step < 1
      ? sliderVal.toFixed(1)
      : String(Math.round(sliderVal));

  return (
    <View>
      <View style={styles.sliderHeaderRow}>
        <Text style={styles.label}>{spec.label}</Text>
        <View style={styles.sliderValueRow}>
          <Text style={styles.sliderNumber}>{formatted}</Text>
          {spec.unit ? <Text style={styles.sliderUnit}>{spec.unit}</Text> : null}
        </View>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={spec.min ?? 0}
        maximumValue={spec.max ?? 100}
        step={spec.step ?? 1}
        value={sliderVal}
        onValueChange={setSliderVal}
        onSlidingComplete={(v) => {
          const rounded = spec.type === 'int' ? Math.round(v) : v;
          setSliderVal(rounded);
          onChange(rounded);
        }}
        minimumTrackTintColor={Colors.accent}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={Colors.accent}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.input,
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputRowError: { borderColor: Colors.destructive },
  inputInner: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  inputUnit: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginLeft: 4,
  },
  rangeHint: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.textTertiary,
    marginTop: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.chip,
    backgroundColor: Colors.accentSubtle,
  },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { fontSize: 13, fontWeight: '600', color: Colors.bgSurface },
  error: { color: Colors.destructive, fontSize: 12, marginTop: 4 },
  // Slider
  sliderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  sliderValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  sliderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  sliderUnit: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  slider: {
    width: '100%',
    height: 40,
    marginHorizontal: -8,
    alignSelf: 'center',
  },
});
