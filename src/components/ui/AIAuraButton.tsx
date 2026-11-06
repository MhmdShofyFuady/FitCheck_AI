import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ios27 } from '../../theme/ios27';

export interface AIAuraButtonProps {
  label: string;
  loadingLabel?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'aura' | 'glass' | 'subtle' | 'link';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  hapticStyle?: 'light' | 'medium' | 'success';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AIAuraButton({
  label,
  loadingLabel = 'Memproses...',
  onPress,
  loading = false,
  disabled = false,
  variant = 'aura',
  style,
  textStyle,
  hapticStyle = 'light',
}: AIAuraButtonProps) {
  const scale = useSharedValue(1);
  const isInactive = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isInactive) return;
    scale.value = withSpring(ios27.motion.pressScale, ios27.motion.springSnappy);
  };

  const handlePressOut = () => {
    if (isInactive) return;
    scale.value = withSpring(1, ios27.motion.springSnappy);
  };

  const handlePress = () => {
    if (isInactive) return;
    if (hapticStyle === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (hapticStyle === 'medium') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  if (variant === 'link') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isInactive}
        style={[styles.linkButton, style]}
      >
        <Text style={[styles.linkText, textStyle]}>{label}</Text>
      </Pressable>
    );
  }

  const isPrimary = variant === 'aura';

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={isInactive}
      style={[
        styles.buttonBase,
        isPrimary
          ? isInactive
            ? styles.primaryDisabled
            : styles.primaryActive
          : styles.secondarySurface,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary && !disabled ? ios27.colors.textInverse : ios27.colors.textPrimary}
        />
      ) : null}
      <Text
        style={[
          styles.buttonLabel,
          isPrimary
            ? isInactive
              ? styles.primaryLabelDisabled
              : styles.primaryLabelActive
            : styles.secondaryLabel,
          textStyle,
        ]}
      >
        {loading ? loadingLabel : label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderCurve: 'continuous',
  },
  primaryActive: {
    backgroundColor: ios27.colors.textPrimary,
  },
  primaryDisabled: {
    backgroundColor: ios27.colors.surfaceElevated,
  },
  secondarySurface: {
    backgroundColor: ios27.colors.surfaceElevated,
  },
  buttonLabel: {
    fontFamily: ios27.typography.families.sans,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  primaryLabelActive: {
    color: ios27.colors.textInverse,
  },
  primaryLabelDisabled: {
    color: ios27.colors.textMuted,
  },
  secondaryLabel: {
    color: ios27.colors.textPrimary,
  },
  linkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  linkText: {
    fontFamily: ios27.typography.families.sans,
    color: ios27.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});

export default AIAuraButton;
