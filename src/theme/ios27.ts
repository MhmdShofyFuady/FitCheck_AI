/*
 * Hallmark · v2.0.0 · redesign
 * theme: custom (by request: iOS Quiet Monochrome Spatial — #000000 canvas, #141416 surface, #FFFFFF primary, #8E8E93 secondary)
 * genre: modern-minimal · tone: austere
 * critique: Stripped purple-to-cyan AI slop gradients, neon icon rings, pill-in-pill chrome, and 1px border overload in favour of quiet #000000/#141416 surface contrast and crisp system sans-serif hierarchy.
 */

import { Platform, TextStyle, ViewStyle } from 'react-native';

export type GlassVariant =
  | 'chromeDark'
  | 'frostedElevated'
  | 'liquidSubtle'
  | 'adaptiveLight';

export interface GlassPreset {
  intensity: number;
  tint:
    | 'systemChromeMaterialDark'
    | 'systemMaterialDark'
    | 'systemThinMaterialDark'
    | 'systemChromeMaterialLight'
    | 'dark'
    | 'light';
  backgroundColor: string;
  borderColor: string;
}

export const ios27 = {
  colors: {
    // Quiet Monochrome Surfaces (#000000 vs #141416 vs #1C1C1E)
    canvasPrimary: '#000000',
    surfaceCard: '#141416',
    surfaceElevated: '#1C1C1E',
    surfaceTabBar: 'rgba(22, 22, 24, 0.85)',
    surfaceHeader: 'rgba(0, 0, 0, 0.82)',
    surfaceModal: 'rgba(0, 0, 0, 0.92)',

    // Typography & Iconography
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
    textMuted: '#636366',
    textInverse: '#000000',

    // Dividers & Subtle Hairline (used sparingly)
    hairline: 'rgba(255, 255, 255, 0.08)',
    subtleBorder: 'rgba(255, 255, 255, 0.08)',

    // Semantic States
    danger: '#FF453A',
    dangerBg: 'rgba(255, 69, 58, 0.14)',
    warning: '#FFD60A',
    warningBg: 'rgba(255, 214, 10, 0.12)',
    success: '#30D158',
  },

  glass: {
    chromeDark: {
      intensity: 65,
      tint: Platform.select({
        ios: 'systemChromeMaterialDark',
        default: 'dark',
      }),
      backgroundColor: '#141416',
      borderColor: 'transparent',
    },
    frostedElevated: {
      intensity: 75,
      tint: Platform.select({
        ios: 'systemMaterialDark',
        default: 'dark',
      }),
      backgroundColor: '#141416',
      borderColor: 'transparent',
    },
    liquidSubtle: {
      intensity: 50,
      tint: Platform.select({
        ios: 'systemThinMaterialDark',
        default: 'dark',
      }),
      backgroundColor: '#141416',
      borderColor: 'transparent',
    },
    adaptiveLight: {
      intensity: 65,
      tint: Platform.select({
        ios: 'systemChromeMaterialLight',
        default: 'light',
      }),
      backgroundColor: '#1C1C1E',
      borderColor: 'transparent',
    },
  } satisfies Record<GlassVariant, GlassPreset>,

  radius: {
    button: 14,
    sm: 14,
    md: 18,
    card: 20,
    lg: 24,
    xl: 28,
    pill: 999,
    borderCurve: 'continuous' as ViewStyle['borderCurve'],
  },

  typography: {
    families: {
      sans: Platform.select({
        ios: 'System',
        android: 'sans-serif',
        default: 'sans-serif',
      }),
      mono: Platform.select({
        ios: 'System',
        android: 'sans-serif-medium',
        default: 'sans-serif',
      }),
    },
    largeTitle: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
      letterSpacing: -0.4,
      color: '#FFFFFF',
    } satisfies TextStyle,
    title1: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
      letterSpacing: -0.4,
      color: '#FFFFFF',
    } satisfies TextStyle,
    title2: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600',
      letterSpacing: -0.3,
      color: '#FFFFFF',
    } satisfies TextStyle,
    body: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400',
      letterSpacing: -0.2,
      color: '#FFFFFF',
    } satisfies TextStyle,
    subheadline: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      letterSpacing: -0.2,
      color: '#8E8E93',
    } satisfies TextStyle,
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
      letterSpacing: -0.2,
      color: '#8E8E93',
    } satisfies TextStyle,
  },

  motion: {
    springSnappy: {
      damping: 18,
      stiffness: 180,
      mass: 0.9,
    },
    pressScale: 0.97,
    cardPressScale: 0.98,
  },

  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
} as const;

export type IOS27Theme = typeof ios27;
