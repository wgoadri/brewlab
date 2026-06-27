import { useState } from 'react';
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
});
