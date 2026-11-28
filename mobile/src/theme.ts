import { Platform, TextStyle, ViewStyle } from 'react-native';

export const COLORS = {
  // Soft Jade (Ngọc nhạt) & Clean Ivory-Mint surfaces — WCAG 2.1 AA/AAA
  bg: '#F5FAF8',
  surface: '#FFFFFF',
  surfaceMuted: '#EBF5F2',
  surfaceTint: '#EEF7F4',

  // Deep Jade-Charcoal typography
  ink: '#132422',
  inkPressed: '#1F3835',
  inkSecondary: '#4A6360',
  inkMuted: '#6E8884',

  // Soft Jade borders
  border: '#D5E7E2',
  borderStrong: '#B4D6CC',

  // Primary Soft Jade / Celadon Heritage Accent (WCAG AA 5.1:1 on white, AAA 7.4:1 deep)
  accent: '#1F7A70',
  accentDeep: '#155E56',
  accentSoft: '#E3F3EE',
  accentSoftStrong: '#D0ECE3',
  accentBorder: '#B4DDD1',

  // Visited / Emerald accents
  visited: '#0F766E',
  visitedDot: '#10B981',
  visitedBg: '#E6F7F2',
  visitedBorder: '#99DFC9',

  // Ratings / Heritage Warm Gold accents
  amber: '#B47A1E',
  amberStar: '#C48A2C',
  amberBg: '#FDF8EC',
  amberBorder: '#F2DCAA',

  // GPS / Blue accent
  gpsBlue: '#2563EB',
  gpsBlueSoft: '#EFF6FF',

  // Pure & overlays
  white: '#FFFFFF',
  overlayDark: 'rgba(19, 36, 34, 0.84)',
  overlayScrim: 'rgba(19, 36, 34, 0.42)',
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
  lg: 14,
  xl: 18,
  pill: 999,
} as const;

export const APP_FONT = Platform.select({
  ios: 'Times New Roman',
  android: 'serif',
  web: '"Times New Roman", Times, serif',
  default: 'serif',
});

export const SERIF_FONT = APP_FONT;

export const TYPOGRAPHY: Record<string, TextStyle> = {
  brandTitle: {
    fontFamily: APP_FONT,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: COLORS.ink,
  },
  editorialTitle: {
    fontFamily: APP_FONT,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    color: COLORS.ink,
  },
  sectionHeading: {
    fontFamily: APP_FONT,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  body: {
    fontFamily: APP_FONT,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.inkSecondary,
  },
  caption: {
    fontFamily: APP_FONT,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.inkMuted,
  },
  badge: {
    fontFamily: APP_FONT,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
};

export const SHADOWS: Record<'card' | 'floating' | 'bar', ViewStyle> = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#132422',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#132422',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.07,
      shadowRadius: 10,
    },
  })!,
  floating: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#132422',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
    },
    android: {
      elevation: 8,
    },
    default: {
      shadowColor: '#132422',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
    },
  })!,
  bar: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#132422',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: '#132422',
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
