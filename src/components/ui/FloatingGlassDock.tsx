import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ios27 } from '../../theme/ios27';

export interface DockItemConfig {
  key: string;
  label: string;
  badge?: string;
  icon?: (focused: boolean) => React.ReactNode;
}

export interface StandaloneDockProps {
  items: DockItemConfig[];
  activeKey: string;
  onSelect: (key: string) => void;
  style?: StyleProp<ViewStyle>;
}

export type FloatingGlassDockProps =
  | (BottomTabBarProps & { style?: StyleProp<ViewStyle> })
  | StandaloneDockProps;

interface TabBarItemProps {
  label: string;
  focused: boolean;
  icon?: (focused: boolean) => React.ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
}

function TabBarItem({
  label,
  focused,
  icon,
  onPress,
  onLongPress,
}: TabBarItemProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={styles.tabItem}
    >
      {icon ? icon(focused) : null}
      <Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          focused ? styles.tabLabelActive : styles.tabLabelInactive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function isBottomTabProps(
  props: FloatingGlassDockProps
): props is BottomTabBarProps & { style?: StyleProp<ViewStyle> } {
  return 'state' in props && 'navigation' in props && 'descriptors' in props;
}

export function FloatingGlassDock(props: FloatingGlassDockProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBarContainer,
        { paddingBottom: Math.max(insets.bottom, 10) },
        props.style,
      ]}
    >
      <BlurView
        intensity={65}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.itemsRow}>
        {isBottomTabProps(props)
          ? props.state.routes.map((route, index) => {
              const { options } = props.descriptors[route.key];
              const rawLabel =
                options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                    ? options.title
                    : route.name;
              const label = typeof rawLabel === 'string' ? rawLabel : route.name;
              const focused = props.state.index === index;

              const onPress = () => {
                const event = props.navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!focused && !event.defaultPrevented) {
                  props.navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                props.navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              return (
                <TabBarItem
                  key={route.key}
                  label={label}
                  focused={focused}
                  icon={
                    options.tabBarIcon
                      ? (isFocused) =>
                          options.tabBarIcon?.({
                            focused: isFocused,
                            color: isFocused
                              ? ios27.colors.textPrimary
                              : ios27.colors.textMuted,
                            size: 18,
                          })
                      : undefined
                  }
                  onPress={onPress}
                  onLongPress={onLongPress}
                />
              );
            })
          : props.items.map((item) => (
              <TabBarItem
                key={item.key}
                label={item.label}
                icon={item.icon}
                focused={props.activeKey === item.key}
                onPress={() => props.onSelect(item.key)}
              />
            ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: ios27.colors.surfaceTabBar,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  tabLabel: {
    fontFamily: ios27.typography.families.sans,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: ios27.colors.textPrimary,
    fontWeight: '600',
  },
  tabLabelInactive: {
    color: ios27.colors.textMuted,
    fontWeight: '500',
  },
});

export default FloatingGlassDock;
