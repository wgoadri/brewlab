import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Line,
  Polyline,
  Text as SvgText,
} from 'react-native-svg';

import type { Brew } from '@/db/schema';
import { bestSoFarSeries } from '@/lib/analysis';
import { Colors } from '@/lib/theme';

const PAD = { t: 12, r: 16, b: 28, l: 28 };
const HEIGHT = 160;

interface Props {
  brews: Brew[]; // ordered by brewedAt asc, all have overallRating
}

export function ProgressChart({ brews }: Props) {
  const [width, setWidth] = useState(0);

  const chartW = Math.max(0, width - PAD.l - PAD.r);
  const chartH = HEIGHT - PAD.t - PAD.b;
  const n = brews.length;

  const xAt = (i: number) =>
    PAD.l + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const yAt = (score: number) =>
    PAD.t + chartH - (score / 10) * chartH;

  const bsf = bestSoFarSeries(brews);
  const bsfPoints = bsf.map((s, i) => `${xAt(i)},${yAt(s)}`).join(' ');

  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={styles.axisLabel}>Score</Text>
        <Text style={styles.axisLabel}>Brew order →</Text>
      </View>
      <View onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            {/* Y-axis ticks */}
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
            {/* Best-so-far line */}
            {n > 1 && (
              <Polyline
                points={bsfPoints}
                fill="none"
                stroke={Colors.accent}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            {/* Raw score dots */}
            {brews.map((b, i) =>
              b.overallRating != null ? (
                <Circle
                  key={b.id}
                  cx={xAt(i)}
                  cy={yAt(b.overallRating)}
                  r={4}
                  fill={Colors.textTertiary}
                  opacity={0.55}
                />
              ) : null,
            )}
            {/* Best dot — highlighted */}
            {(() => {
              const bestIdx = bsf.lastIndexOf(Math.max(...bsf));
              const bestBrew = brews[bestIdx];
              if (!bestBrew?.overallRating) return null;
              return (
                <>
                  <Circle
                    cx={xAt(bestIdx)}
                    cy={yAt(bestBrew.overallRating)}
                    r={7}
                    fill="none"
                    stroke={Colors.accent}
                    strokeWidth={1.5}
                  />
                  <Circle
                    cx={xAt(bestIdx)}
                    cy={yAt(bestBrew.overallRating)}
                    r={4}
                    fill={Colors.accent}
                  />
                </>
              );
            })()}
          </Svg>
        )}
      </View>
      <Text style={styles.legend}>
        <Text style={styles.legendAccent}>— </Text>Best so far{'   '}
        <Text style={styles.legendDot}>● </Text>Each brew
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  axisLabel: { fontSize: 11, color: Colors.textTertiary },
  legend: { fontSize: 11, color: Colors.textTertiary, marginTop: 4, textAlign: 'center' },
  legendAccent: { color: Colors.accent, fontWeight: '700' },
  legendDot: { color: Colors.textTertiary },
});
