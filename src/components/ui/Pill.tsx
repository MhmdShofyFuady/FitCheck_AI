import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { theme } from '../../theme';

type Variant = 'glass' | 'chip' | 'chipActive' | 'primary' | 'danger';

interface PillProps {
  label?: string;
  icon?: LucideIcon;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Pill({
  label,
  icon: Icon,
  onPress,
  variant = 'glass',
  disabled = false,
  loading = false,
  style,
}: PillProps) {
  const inactive = disabled || loading;
  const isPrimary = variant === 'primary';
  const textColor = isPrimary
    ? inactive
      ? theme.colors.muted
      : theme.colors.onInk
    : variant === 'chipActive'
      ? theme.colors.onInk
      : variant === 'danger'
        ? theme.colors.danger
        : theme.colors.ink;

  const handlePress = () => {
    if (inactive || !onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isPrimary && inactive && styles.primaryDisabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {variant === 'glass' ? (
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      ) : null}
      {loading ? <ActivityIndicator size="small" color={textColor} /> : null}
      {!loading && Icon ? <Icon size={isPrimary ? 18 : 16} strokeWidth={1.8} color={textColor} /> : null}
      {label ? (
        <Text style={[styles.label, isPrimary && styles.primaryLabel, { color: textColor }]}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
  },
  glass: {
    backgroundColor: theme.colors.glassStrong,
  },
  chip: {
    height: 36,
    backgroundColor: theme.colors.chip,
  },
  chipActive: {
    height: 36,
    backgroundColor: theme.colors.primary,
  },
  primary: {
    height: 54,
    backgroundColor: theme.colors.primary,
  },
  primaryDisabled: {
    backgroundColor: theme.colors.primaryDisabled,
  },
  danger: {
    height: 50,
    backgroundColor: theme.colors.dangerBg,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  label: {
    fontFamily: theme.font,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

