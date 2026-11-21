import { Platform, TextStyle, ViewStyle } from 'react-native';

export const COLORS = {
  // Warm parchment & stone surfaces
  bg: '#FAF9F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F1EC',
  surfaceTint: '#F7F5F0',

  // Deep charcoal / ink typography
  ink: '#141413',
  inkPressed: '#2C2B29',
  inkSecondary: '#57554F',
  inkMuted: '#8A877F',

  // Borders
  border: '#E6E4DD',
  borderStrong: '#D4D0C5',

  // Heritage terracotta accent
  accent: '#B93815',
  accentSoft: 'rgba(185, 56, 21, 0.10)',
  accentBorder: 'rgba(185, 56, 21, 0.25)',

  // Visited / Emerald accents
  visited: '#047857',
  visitedDot: '#10B981',
  visitedBg: '#ECFDF5',
  visitedBorder: '#A7F3D0',

  // Ratings / Amber accents
  amber: '#D97706',
  amberStar: '#F59E0B',
  amberBg: '#FFFBEB',
  amberBorder: '#FDE68A',

  // GPS / Blue accent
  gpsBlue: '#2563EB',
  gpsBlueSoft: '#EFF6FF',

  // Pure & overlays
  white: '#FFFFFF',
  overlayDark: 'rgba(20, 20, 19, 0.80)',
  overlayScrim: 'rgba(20, 20, 19, 0.50)',
} as const;

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const RADII = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, "Times New Roman", serif',
  default: 'serif',
});

export const TYPOGRAPHY: Record<string, TextStyle> = {
  brandTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: COLORS.ink,
  },
  editorialTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    color: COLORS.ink,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.inkSecondary,
  },
  caption: {
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.inkMuted,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
};

export const SHADOWS: Record<'card' | 'floating' | 'bar', ViewStyle> = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#141413',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#141413',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
  })!,
  floating: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#141413',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 14,
    },
    android: {
      elevation: 8,
    },
    default: {
      shadowColor: '#141413',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 14,
    },
  })!,
  bar: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#141413',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: '#141413',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
  })!,
};

export const theme = {
  colors: COLORS,
  spacing: SPACING,
  radii: RADII,
  typography: TYPOGRAPHY,
  shadows: SHADOWS,
  serifFont: SERIF_FONT,
} as const;

export default theme;
