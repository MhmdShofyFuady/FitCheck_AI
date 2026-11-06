import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { theme } from '../../theme';

interface CircleButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
}

export function CircleButton({ icon: Icon, onPress, accessibilityLabel }: CircleButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [styles.circle, pressed && styles.pressed]}
    >
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <Icon size={20} strokeWidth={1.8} color={theme.colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: theme.colors.glass,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
});

