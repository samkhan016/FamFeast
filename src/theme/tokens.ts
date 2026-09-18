export const colors = {
  primary: '#A33900',
  primaryContainer: '#CC4900',
  onPrimary: '#FFFFFF',
  primaryFixed: '#FFDBCE',
  primaryFixedDim: '#FFB599',
  onPrimaryFixed: '#370E00',
  onPrimaryFixedVariant: '#7F2B00',

  secondary: '#006E2D',
  secondaryContainer: '#7CF994',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#007230',
  secondaryFixed: '#7FFC97',
  secondaryFixedDim: '#62DF7D',
  onSecondaryFixed: '#002109',
  onSecondaryFixedVariant: '#005320',

  tertiary: '#825100',
  tertiaryContainer: '#A36700',
  onTertiary: '#FFFFFF',
  tertiaryFixed: '#FFDDB8',
  tertiaryFixedDim: '#FFB95F',
  onTertiaryFixed: '#2A1700',
  onTertiaryFixedVariant: '#653E00',

  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',

  background: '#F8F9FF',
  onBackground: '#121C2A',
  surface: '#F8F9FF',
  surfaceDim: '#D0DBED',
  surfaceBright: '#F8F9FF',
  surfaceLowest: '#FFFFFF',
  surfaceLow: '#EFF4FF',
  surfaceContainer: '#E6EEFF',
  surfaceHigh: '#DEE9FC',
  surfaceHighest: '#D9E3F6',
  onSurface: '#121C2A',
  onSurfaceVariant: '#5A4138',
  outline: '#8E7166',
  outlineVariant: '#E2BFB2',
  inverseSurface: '#27313F',
  inverseOnSurface: '#EAF1FF',
  inversePrimary: '#FFB599',

  linen: '#FDFBF7',
  cream: '#FFF7ED',
  garden: '#F0FDF4',
  oatmeal: '#F3E8DF',
  charcoal: '#111827',
  slate: '#4B5563',
} as const;

export const splash = {
  canvas: '#FFFDF9',
  title: '#C2410C',
  motto: '#57534E',
  status: '#78716C',
  muted: '#A8A29E',
  mutedSoft: 'rgba(168, 162, 158, 0.8)',
  pillText: '#44403C',
  pillFill: 'rgba(255, 255, 255, 0.82)',
  pillBorder: 'rgba(254, 215, 170, 0.7)',
  track: '#FFEDD5',
  ember: '#EA580C',
  amber: '#F59E0B',
  amberDeep: '#D97706',
  spark: '#F59E0B',
  sparkSoft: '#FB923C',
  ringFrom: '#FFF5EC',
  ringTo: '#FCE8D5',
  ringBorder: 'rgba(254, 215, 170, 0.6)',
  glow: '#C2410C',
  halo: '#F97316',
  divider: 'rgba(255, 237, 213, 0.8)',
  pattern: '#EA580C',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  gutter: 16,
  margin: 20,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  card: 24,
  pill: 999,
} as const;

export const fonts = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extrabold: 'PlusJakartaSans-ExtraBold',
} as const;

export const typography = {
  headlineXl: {
    fontFamily: fonts.extrabold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  headlineLg: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.36,
  },
  headlineMd: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  bodyLg: {
    fontFamily: fonts.medium,
    fontSize: 18,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySm: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  labelLg: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.15,
  },
  labelMd: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.26,
  },
  labelSm: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.44,
  },
} as const;

export const shadows = {
  card: {
    shadowColor: '#EA580C',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  lifted: {
    shadowColor: '#EA580C',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  modal: {
    shadowColor: '#1F2937',
    shadowOffset: {width: 0, height: 16},
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 12,
  },
  tabBar: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const hitSlop = {top: 8, bottom: 8, left: 8, right: 8};

export const minTouch = {
  ios: 44,
  android: 48,
} as const;
