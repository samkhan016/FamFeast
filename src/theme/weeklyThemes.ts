import {colors} from './tokens';

export type WeeklyThemeId =
  | 'regular'
  | 'party'
  | 'healthy'
  | 'comfort'
  | 'cheat'
  | 'quick'
  | 'budget';

export type WeeklyTheme = {
  id: WeeklyThemeId;
  label: string;
  tagline: string;
  icon: string;
  emoji: string;
  bannerFrom: string;
  bannerVia?: string;
  bannerTo: string;
  accent: string;
  wash: string;
  motif: 'none' | 'confetti' | 'leaves' | 'steam' | 'spark' | 'bolt';
};

export const WEEKLY_THEMES: Record<WeeklyThemeId, WeeklyTheme> = {
  regular: {
    id: 'regular',
    label: 'Regular Week',
    tagline: 'Calm plates, familiar favorites',
    icon: 'House',
    emoji: '🏠',
    bannerFrom: colors.surfaceHigh,
    bannerTo: colors.surfaceContainer,
    accent: colors.primary,
    wash: colors.surfaceLow,
    motif: 'none',
  },
  party: {
    id: 'party',
    label: 'Party Week',
    tagline: 'Bright flavors, family prep & casual treats',
    icon: 'Confetti',
    emoji: '🎉',
    bannerFrom: colors.primaryContainer,
    bannerVia: colors.primary,
    bannerTo: colors.tertiaryContainer,
    accent: colors.primaryFixedDim,
    wash: colors.primaryFixed,
    motif: 'confetti',
  },
  healthy: {
    id: 'healthy',
    label: 'Health Reset',
    tagline: 'Fresh, light, and garden-bright',
    icon: 'Leaf',
    emoji: '🥑',
    bannerFrom: colors.secondary,
    bannerTo: '#0F8A42',
    accent: colors.secondaryContainer,
    wash: colors.garden,
    motif: 'leaves',
  },
  comfort: {
    id: 'comfort',
    label: 'Comfort Food',
    tagline: 'Warm, cozy, and hearty',
    icon: 'BowlSteam',
    emoji: '🍲',
    bannerFrom: colors.tertiary,
    bannerTo: colors.tertiaryContainer,
    accent: colors.tertiaryFixed,
    wash: colors.cream,
    motif: 'steam',
  },
  cheat: {
    id: 'cheat',
    label: 'Cheat Weekend',
    tagline: 'Treat nights and celebration bites',
    icon: 'Pizza',
    emoji: '🍕',
    bannerFrom: '#9A3412',
    bannerTo: colors.primary,
    accent: colors.tertiaryFixedDim,
    wash: colors.primaryFixed,
    motif: 'spark',
  },
  quick: {
    id: 'quick',
    label: '20-Min Fast',
    tagline: 'Low-effort dinners after packed days',
    icon: 'Lightning',
    emoji: '⚡️',
    bannerFrom: colors.tertiaryContainer,
    bannerTo: colors.primary,
    accent: colors.tertiaryFixed,
    wash: colors.tertiaryFixed,
    motif: 'bolt',
  },
  budget: {
    id: 'budget',
    label: 'Budget Comfort',
    tagline: 'Cozy plates that stretch the weekly shop',
    icon: 'Coins',
    emoji: '💰',
    bannerFrom: colors.tertiary,
    bannerTo: colors.primaryContainer,
    accent: colors.tertiaryFixed,
    wash: colors.tertiaryFixed,
    motif: 'spark',
  },
};

export const THEME_LIST = Object.values(WEEKLY_THEMES);

export const SPIN_THEMES = THEME_LIST.filter(theme =>
  ['party', 'healthy', 'cheat', 'quick', 'budget'].includes(theme.id),
);
