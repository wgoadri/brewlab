import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Line,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

import type { Brew, Grinder } from '@/db/schema';
import { getParamValue, paramRange } from '@/lib/analysis';
import type { ParamSpec } from '@/lib/methods';
import { Colors } from '@/lib/theme';

const PAD = { t: 12, r: 16, b: 48, l: 28 };
const HEIGHT = 200;
const BAND_Y_OFFSET = 12; // gap below chart area before coverage band
const BAND_H = 8;

interface Props {
  brews: Brew[];
  spec: ParamSpec;
  grinder?: Grinder | null;
  suggestionX?: number; // optimizer's suggested value for this param
}

export function ParameterChart({ brews, spec, grinder, suggestionX }: Props) {
  const [width, setWidth] = useState(0);

  const chartW = Math.max(0, width - PAD.l - PAD.r);
  const chartH = HEIGHT - PAD.t - PAD.b;

  const { min: minX, max: maxX } = paramRange(spec, grinder);
  const rangeX = maxX - minX || 1;

  const xAt = (v: number) => PAD.l + ((v - minX) / rangeX) * chartW;
  const yAt = (score: number) => PAD.t + chartH - (score / 10) * chartH;

  // Explored range
  const vals = brews
    .map(b => getParamValue(b, spec))
    .filter((v): v is number => v != null);
  const exploredMin = vals.length ? Math.min(...vals) : minX;
  const exploredMax = vals.length ? Math.max(...vals) : minX;

  // Best brew
  const best = brews.reduce<Brew | null>((acc, b) => {
    if (!acc) return b;
    return (b.overallRating ?? -1) > (acc.overallRating ?? -1) ? b : acc;
  }, null);

  const bandY = PAD.t + chartH + BAND_Y_OFFSET;
  const exploredX = xAt(exploredMin);
  const exploredW = Math.max(0, xAt(exploredMax) - exploredX);

  return (
    <View>
      <View onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            {/* Gridlines */}
            {[0, 5, 10].map(v => (
              <Line
                key={v}
                x1={PAD.l}
                y1={yAt(v)}
                x2={PAD.l + chartW}
                y2={yAt(v)}
                stroke={Colors.border}
                strokeWidth={0.5}
              />
            ))}
            {/* Y-axis labels */}
            {[0, 5, 10].map(v => (
              <SvgText
                key={v}
                x={PAD.l - 6}
                y={yAt(v) + 4}
                textAnchor="end"
                fontSize={10}
                fill={Colors.textTertiary}
              >
                {v}
              </SvgText>
            ))}

            {/* Coverage band — full range */}
            <Rect
              x={PAD.l}
              y={bandY}
              width={chartW}
              height={BAND_H}
              rx={BAND_H / 2}
              fill={Colors.border}
            />
            {/* Coverage band — explored sub-range */}
            {exploredW > 0 && (
              <Rect
                x={exploredX}
                y={bandY}
                width={exploredW}
                height={BAND_H}
                rx={BAND_H / 2}
                fill={Colors.accent}
                opacity={0.45}
              />
            )}
            {/* X-axis min/max labels */}
            <SvgText
              x={PAD.l}
              y={bandY + BAND_H + 14}
              fontSize={10}
              fill={Colors.textTertiary}
            >
              {minX}{spec.unit ? ` ${spec.unit}` : ''}
            </SvgText>
            <SvgText
              x={PAD.l + chartW}
              y={bandY + BAND_H + 14}
              textAnchor="end"
              fontSize={10}
              fill={Colors.textTertiary}
            >
              {maxX}{spec.unit ? ` ${spec.unit}` : ''}
            </SvgText>

            {/* Optimizer suggestion — vertical dashed line */}
            {suggestionX != null && (
              <Line
                x1={xAt(suggestionX)}
                y1={PAD.t}
                x2={xAt(suggestionX)}
                y2={PAD.t + chartH}
                stroke={Colors.accent}
                strokeWidth={1}
                strokeDasharray="4,3"
                opacity={0.6}
              />
            )}

            {/* Brew dots */}
            {brews.map(b => {
              const x = getParamValue(b, spec);
              const y = b.overallRating;
              if (x == null || y == null) return null;
              const isBest = b.id === best?.id;
              return (
                <React.Fragment key={b.id}>
                  {isBest && (
                    <Circle
                      cx={xAt(x)}
                      cy={yAt(y)}
                      r={8}
                      fill="none"
                      stroke={Colors.accent}
                      strokeWidth={1.5}
                    />
                  )}
                  <Circle
                    cx={xAt(x)}
                    cy={yAt(y)}
                    r={4.5}
                    fill={isBest ? Colors.accent : Colors.textSecondary}
                    opacity={isBest ? 1 : 0.65}
                  />
                </React.Fragment>
              );
            })}
          </Svg>
        )}
      </View>

      {/* Coverage annotation below chart */}
      <View style={styles.coverageRow}>
        <Text style={styles.coverageText}>
          Explored:{' '}
          <Text style={styles.coverageHighlight}>
            {exploredMin.toFixed(spec.type === 'int' ? 0 : 1)}–
            {exploredMax.toFixed(spec.type === 'int' ? 0 : 1)}
            {spec.unit ? ` ${spec.unit}` : ''}
          </Text>
          {'  '}of {minX}–{maxX}
          {spec.unit ? ` ${spec.unit}` : ''}
        </Text>
        {suggestionX != null && (
          <Text style={styles.suggestionLabel}>
            Suggested: {typeof suggestionX === 'number' ? suggestionX.toFixed(spec.type === 'int' ? 0 : 1) : suggestionX}
            {spec.unit ? ` ${spec.unit}` : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  coverageRow: { marginTop: 2, gap: 2 },
  coverageText: { fontSize: 11, color: Colors.textTertiary },
  coverageHighlight: { color: Colors.accent, fontWeight: '500' },
  suggestionLabel: {
    fontSize: 11,
    color: Colors.accent,
    fontStyle: 'italic',
  },
});
