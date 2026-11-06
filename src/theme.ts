import { Platform } from 'react-native';

// Light closet & model studio aesthetic (matching reference UI)
export const theme = {
  colors: {
    canvas: '#EEEEEF',
    stage: '#DADADC',
    card: '#FFFFFF',
    well: '#F2F2F3',
    chip: '#E3E3E5',
    glass: 'rgba(255, 255, 255, 0.55)',
    glassStrong: 'rgba(255, 255, 255, 0.82)',
    ink: '#1C1C1E',
    inkSoft: '#3A3A3C',
    muted: '#8E8E93',
    faint: '#C7C7CC',
    onInk: '#FFFFFF',
    primary: '#2C2C2E',
    primaryDisabled: '#D1D1D6',
    heart: '#FF3B30',
    danger: '#FF3B30',
    dangerBg: 'rgba(255, 59, 48, 0.10)',
    warningInk: '#8A5A00',
    warningBg: '#FFF2CC',
    hairline: 'rgba(0, 0, 0, 0.06)',
    backdrop: '#000000',
  },
  radius: {
    pill: 999,
    card: 22,
    tile: 18,
    inner: 16,
    input: 14,
  },
  font: Platform.select({ ios: 'System', default: 'sans-serif' }),
  shadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
