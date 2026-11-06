import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ios27 } from '../../theme/ios27';

export interface GlassHeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  backLabel?: string;
  onSettingsPress?: () => void;
  rightAccessory?: React.ReactNode;
  showBrandBadge?: boolean;
  includeSafeAreaTop?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GlassHeader({
  title,
  subtitle,
  onBackPress,
  backLabel = 'Kembali',
  onSettingsPress,
  rightAccessory,
  showBrandBadge = true,
  includeSafeAreaTop = true,
  style,
}: GlassHeaderProps) {
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (!onBackPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onBackPress();
  };

  const handleGearPress = () => {
    if (!onSettingsPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSettingsPress();
  };

  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop: includeSafeAreaTop ? Math.max(insets.top, 12) + 6 : 12,
        },
        style,
      ]}
    >
      <BlurView
        intensity={65}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.barRow}>
        <View style={styles.leftZone}>
          {onBackPress ? (
            <Pressable
              onPress={handleBackPress}
              hitSlop={10}
              style={styles.backButton}
            >
              <ChevronLeft
                size={20}
                strokeWidth={1.8}
                color={ios27.colors.textPrimary}
              />
              <Text style={styles.backText} numberOfLines={1}>
                {backLabel}
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.titleBlock}>
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitleText} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rightZone}>
          {rightAccessory !== undefined ? (
            rightAccessory
          ) : (
            <View style={styles.rightRow}>
              {showBrandBadge ? (
                <Text style={styles.brandWordmark}>FitCheck AI</Text>
              ) : null}

              {onSettingsPress ? (
                <Pressable
                  onPress={handleGearPress}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Pengaturan"
                  style={styles.settingsButton}
                >
                  <Settings
                    size={20}
                    strokeWidth={1.8}
                    color={ios27.colors.textSecondary}
                  />
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: ios27.colors.surfaceHeader,
    zIndex: 40,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftZone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  backText: {
    fontFamily: ios27.typography.families.sans,
    color: ios27.colors.textSecondary,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  titleBlock: {
    flex: 1,
  },
  titleText: {
    fontFamily: ios27.typography.families.sans,
    color: ios27.colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontFamily: ios27.typography.families.sans,
    color: ios27.colors.textSecondary,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: -0.2,
    marginTop: 1,
  },
  rightZone: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  brandWordmark: {
    fontFamily: ios27.typography.families.sans,
    color: ios27.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  settingsButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GlassHeader;
