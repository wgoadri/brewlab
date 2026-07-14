import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';

import { getGuide, type GuideBlock, type GuideSection } from '@/lib/brewingGuide';
import { METHODS, type BrewMethod } from '@/lib/methods';
import { Colors, Radii, Spacing } from '@/lib/theme';

/** Render text with **bold** runs, keeping everything on one <Text>. */
function RichText({ text, style }: { text: string; style?: object }) {
  const parts = text.split('**');
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={styles.bold}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.kind) {
    case 'para':
      return <RichText text={block.text} style={styles.para} />;
    case 'note':
      return (
        <View style={styles.note}>
          <RichText text={block.text} style={styles.noteText} />
        </View>
      );
    case 'bullets':
      return (
        <View style={styles.bullets}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <RichText text={item} style={styles.bulletText} />
            </View>
          ))}
        </View>
      );
    case 'facts':
      return (
        <View style={styles.factsRow}>
          {block.items.map((f, i) => (
            <View key={i} style={styles.factChip}>
              <Text style={styles.factLabel}>{f.label}</Text>
              <Text style={styles.factValue}>{f.value}</Text>
            </View>
          ))}
        </View>
      );
    case 'table':
      return (
        <View style={styles.table}>
          <View style={[styles.tRow, styles.tHead]}>
            {block.headers.map((h, i) => (
              <Text key={i} style={[styles.tCell, i === 0 && styles.tCellFirst, styles.tHeadText]}>
                {h}
              </Text>
            ))}
          </View>
          {block.rows.map((row, ri) => (
            <View key={ri} style={[styles.tRow, ri > 0 && styles.tRowBorder]}>
              {row.map((cell, ci) => (
                <Text
                  key={ci}
                  style={[styles.tCell, ci === 0 && styles.tCellFirst, ci === 0 && styles.tCellStrong]}
                >
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
  }
}

function Section({
  section,
  onLayout,
}: {
  section: GuideSection;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  return (
    <View onLayout={onLayout} style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{section.step}</Text>
        </View>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.optional && (
          <View style={styles.optionalBadge}>
            <Text style={styles.optionalText}>optional</Text>
          </View>
        )}
      </View>
      {section.tagline && <Text style={styles.tagline}>{section.tagline}</Text>}
      <View style={styles.card}>
        {section.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </View>
    </View>
  );
}

export default function GuideScreen() {
  const { method } = useLocalSearchParams<{ method: string }>();
  const guide = getGuide(method as BrewMethod);

  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});
  const navHeight = useRef(0);

  if (!guide) {
    return (
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Guide' }} />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No guide yet</Text>
          <Text style={styles.emptyBody}>
            There isn’t a brewing guide for {METHODS[method as BrewMethod]?.label ?? method} yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  function jumpTo(id: string) {
    const y = offsets.current[id];
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - navHeight.current - Spacing.sm), animated: true });
  }

  return (
    <SafeAreaView style={styles.flex} edges={['bottom']}>
      <Stack.Screen options={{ title: `${METHODS[guide.method].label} guide` }} />
      <ScrollView ref={scrollRef} stickyHeaderIndices={[0]} contentContainerStyle={styles.content}>
        {/* Sticky jump-nav */}
        <View
          style={styles.nav}
          onLayout={(e) => {
            navHeight.current = e.nativeEvent.layout.height;
          }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navInner}>
            {guide.sections.map((s) => (
              <Pressable key={s.id} style={styles.navChip} onPress={() => jumpTo(s.id)}>
                <Text style={styles.navChipText}>{s.title}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{guide.title}</Text>
          <Text style={styles.subtitle}>{guide.subtitle}</Text>
        </View>

        {/* Sections */}
        {guide.sections.map((s) => (
          <Section
            key={s.id}
            section={s}
            onLayout={(e) => {
              offsets.current[s.id] = e.nativeEvent.layout.y;
            }}
          />
        ))}

        {/* Starter recipe */}
        <View style={styles.section}>
          <Text style={styles.tagline}>A defensible starting point — the median of seventeen years of winners:</Text>
          <View style={[styles.card, styles.starterCard]}>
            <Text style={styles.starterText}>{guide.starter}</Text>
          </View>
        </View>

        {/* Debugging */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debugging a cup</Text>
          <View style={styles.card}>
            {guide.debugging.map((row, i) => (
              <View key={i} style={[styles.debugRow, i > 0 && styles.debugBorder]}>
                <Text style={styles.debugSymptom}>{row.symptom}</Text>
                <Text style={styles.debugFirst}>{row.first}</Text>
                <Text style={styles.debugThen}>{row.then}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.source}>{guide.source}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bgPage },
  content: { paddingBottom: Spacing.xxxl },

  // Sticky nav
  nav: {
    backgroundColor: Colors.bgPage,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  navInner: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.xs },
  navChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.chip,
    backgroundColor: Colors.accentSubtle,
  },
  navChipText: { fontSize: 12, fontWeight: '600', color: Colors.accent },

  // Header
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, lineHeight: 28 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  // Section
  section: { paddingHorizontal: Spacing.base, marginTop: Spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { color: Colors.bgSurface, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.chip,
    backgroundColor: Colors.accentSubtle,
  },
  optionalText: { fontSize: 10, fontWeight: '600', color: Colors.accent, textTransform: 'uppercase', letterSpacing: 0.6 },
  tagline: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.sm, fontStyle: 'italic' },

  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radii.card,
    padding: Spacing.base,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Blocks
  para: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
  bold: { fontWeight: '700' },
  note: {
    backgroundColor: Colors.accentSubtle,
    borderRadius: Radii.input,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    padding: Spacing.md,
  },
  noteText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 20 },
  bullets: { gap: Spacing.sm },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm },
  bulletDot: { fontSize: 14, color: Colors.accent, lineHeight: 21 },
  bulletText: { flex: 1, fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
  factsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  factChip: {
    backgroundColor: Colors.accentSubtle,
    borderRadius: Radii.chip,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  factLabel: { fontSize: 10, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  factValue: { fontSize: 14, fontWeight: '700', color: Colors.accent, fontVariant: ['tabular-nums'] },

  // Table
  table: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.input, overflow: 'hidden' },
  tRow: { flexDirection: 'row' },
  tRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  tHead: { backgroundColor: Colors.bgPage },
  tHeadText: { fontWeight: '700', color: Colors.textSecondary, fontSize: 12 },
  tCell: { flex: 1, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: Colors.textPrimary, lineHeight: 17 },
  tCellFirst: { flex: 0.9, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: Colors.border },
  tCellStrong: { fontWeight: '600', color: Colors.textSecondary },

  // Starter
  starterCard: { backgroundColor: Colors.accentSubtle, borderColor: 'transparent' },
  starterText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 22, fontWeight: '500' },

  // Debugging
  debugRow: { gap: 2, paddingVertical: Spacing.sm },
  debugBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  debugSymptom: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  debugFirst: { fontSize: 13, color: Colors.accent, fontWeight: '600' },
  debugThen: { fontSize: 13, color: Colors.textSecondary },

  source: { fontSize: 11, color: Colors.textTertiary, lineHeight: 16, paddingHorizontal: Spacing.base, marginTop: Spacing.xl },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptyBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
