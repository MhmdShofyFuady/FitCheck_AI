import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { GlassVariant, ios27 } from '../../theme/ios27';

export interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassVariant;
  borderRadius?: number;
  padding?: number;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  haptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({
  children,
  borderRadius = ios27.radius.card,
  padding = ios27.spacing.lg,
  bordered = false,
  style,
  contentStyle,
  onPress,
  disabled = false,
  haptic = true,
}: GlassCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!onPress || disabled) return;
    scale.value = withSpring(ios27.motion.cardPressScale, ios27.motion.springSnappy);
  };

  const handlePressOut = () => {
    if (!onPress || disabled) return;
    scale.value = withSpring(1, ios27.motion.springSnappy);
  };

  const handlePress = () => {
    if (!onPress || disabled) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const cardSurface = (
    <View
      style={[
        styles.surface,
        {
          borderRadius,
          padding,
          borderWidth: bordered ? 1 : 0,
          borderColor: bordered ? ios27.colors.subtleBorder : 'transparent',
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={[animatedStyle, style]}
      >
        {cardSurface}
      </AnimatedPressable>
    );
  }

  return <View style={style}>{cardSurface}</View>;
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: ios27.colors.surfaceCard,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
});

export default GlassCard;
