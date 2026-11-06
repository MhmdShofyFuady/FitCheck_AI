import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Camera, Shirt, User, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';

const ICONS: Record<string, LucideIcon> = {
  ClosetTab: Shirt,
  TryOnTab: Camera,
  ProfileTab: User,
};

// Full-screen steps (like the reference "Model" screen) hide the dock.
const HIDDEN_ON = ['SizeInput', 'Result'];

/** Bottom padding a scrollable tab screen needs so content clears the dock. */
export function useDockSpace() {
  return useSafeAreaInsets().bottom + 96;
}

export function FloatingDock({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const nested = getFocusedRouteNameFromRoute(state.routes[state.index]);
  if (nested && HIDDEN_ON.includes(nested)) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.anchor, { bottom: Math.max(insets.bottom - 6, 14) }]}
    >
      <View style={styles.dock}>
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = ICONS[route.name] ?? Shirt;
          const color = focused ? theme.colors.ink : theme.colors.muted;
          const label = descriptors[route.key].options.title ?? route.name;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={styles.item}
            >
              <Icon size={22} strokeWidth={focused ? 2.2 : 1.8} color={color} />
              <Text style={[styles.label, { color }, focused && styles.labelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dock: {
    flexDirection: 'row',
    height: 64,
    paddingHorizontal: 8,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    backgroundColor: theme.colors.glassStrong,
    ...theme.shadow,
    shadowOpacity: 0.12,
  },
  item: {
    width: 78,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontFamily: theme.font,
    fontSize: 11,
    fontWeight: '500',
  },
  labelActive: {
    fontWeight: '600',
  },
});

