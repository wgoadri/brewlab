export const Colors = {
  // Page / surface
  bgPage:        '#E8E5E1',
  bgSurface:     '#FFFFFF',
  bgElevated:    '#FFFFFF',

  // Text
  textPrimary:   '#111110',
  textSecondary: '#666260',
  textTertiary:  '#999592',

  // Borders
  border:        '#D4CFC8',

  // Accent (forest green — annotation ink, precision, craft)
  accent:        '#2D6A4F',
  accentSubtle:  'rgba(45, 106, 79, 0.10)',

  // Semantic
  destructive:   '#B91C1C',

  // Timer (dark surface)
  timerBg:       '#111110',
  timerTrack:    '#2A2A28',
  timerText:     '#F5F5F4',
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 40,
} as const;

export const Radii = {
  card:   12,
  chip:   8,
  button: 10,
  fab:    28,
  input:  8,
} as const;
