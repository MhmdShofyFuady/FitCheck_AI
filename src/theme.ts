/*
 * Hallmark · v2.0.0 · redesign
 * theme: figcraft-brand (Deep Navy #0E2C75, Electric Azure #2F80ED, Warm Cream #FBF7EE, Soft Beige #EBE4D5)
 * genre: editorial · tone: relaxed-cozy
 * critique: 3-font relaxed & comfortable system (Arial Rounded MT Bold soft display, Avenir airy humanist sans, American Typewriter warm artisanal accent).
 */

import { Platform } from 'react-native';

export const theme = {
  colors: {
    cream: '#FBF7EE',
    sand: '#EBE4D5',
    paper: '#FBF7EE',
    cobalt: '#0E2C75',
    azure: '#2F80ED',
    cobaltMuted: '#173B94',
    cobaltWash: '#D6E3FA',
    ink: '#0E2C75',
    muted: '#5C6479',
    line: '#D9D0C1',
    amberInk: '#8A4200',
    amberBg: '#F3E3C6',
    greenInk: '#125430',
    greenBg: '#D9ECDF',
    danger: '#B42318',
    overlay: 'rgba(14, 44, 117, 0.92)',
  },
  fonts: {
    display: Platform.select({
      ios: 'Arial Rounded MT Bold',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }),
    sans: Platform.select({
      ios: 'Avenir',
      android: 'sans-serif',
      default: 'sans-serif',
    }),
    mono: Platform.select({
      ios: 'American Typewriter',
      android: 'serif',
      default: 'monospace',
    }),
  },
  radius: {
    pill: 999,
    card: 18,
    input: 12,
  },
} as const;
