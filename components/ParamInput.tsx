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

  const label =
    spec.unit ? `${spec.label} (${spec.unit})` : spec.label;

  if (spec.type === 'boolean') {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Switch
          value={Boolean(value)}
          onValueChange={onChange}
          thumbColor='#fff'
          trackColor={{ false: '#ccc', true: '#7a4a2b' }}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  if (spec.type === 'enum' && spec.options) {
    return (
      <View>
        <Text style={styles.label}>{label}</Text>
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
    return (
      <View>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          keyboardType={keyboard}
          value={raw}
          onChangeText={(t) => setRaw(t)}
          onBlur={() => {
            const parsed = spec.type === 'int' ? parseInt(raw, 10) : parseFloat(raw);
            onChange(parsed);
          }}
          placeholder={spec.default != null ? String(spec.default) : undefined}
          placeholderTextColor='#bbb'
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  // text
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={typeof value === 'string' ? value : ''}
        onChangeText={(t) => onChange(t)}
        placeholder={spec.default != null ? String(spec.default) : undefined}
        placeholderTextColor='#bbb'
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: '#3a2a1c', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d6cbbe',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#3a2a1c',
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#b00020' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eaded2',
  },
  chipActive: { backgroundColor: '#7a4a2b' },
  chipText: { color: '#5a4636', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  error: { color: '#b00020', fontSize: 12, marginTop: 4 },
});
