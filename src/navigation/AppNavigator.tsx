import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import {
  AuthStackParamList,
  MainTabParamList,
  ProfileStackParamList,
  TryOnStackParamList,
} from './types';
import LoginScreen from '../screens/LoginScreen';
import PhotoUploadScreen from '../screens/PhotoUploadScreen';
import SizeInputScreen from '../screens/SizeInputScreen';
import ResultScreen from '../screens/ResultScreen';
import AccountScreen from '../screens/AccountScreen';
import { theme } from '../theme';

const APP_ICON = require('../../assets/icon.png');

const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const TryOnStackNav = createNativeStackNavigator<TryOnStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function BrandHeaderRight() {
  return (
    <View style={styles.brandBadge}>
      <Image source={APP_ICON} style={styles.brandIcon} />
      <Text style={styles.brandWord}>FitCheck</Text>
      <View style={styles.brandAiPill}>
        <Text style={styles.brandAiText}>AI</Text>
      </View>
    </View>
  );
}

const stackScreenOptions = {
  headerStyle: { backgroundColor: theme.colors.cream },
  headerTintColor: theme.colors.ink,
  headerTitleStyle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700' as const,
    fontSize: 17,
  },
  headerBackButtonDisplayMode: 'minimal' as const,
  headerShadowVisible: false,
  headerRight: () => <BrandHeaderRight />,
  contentStyle: { backgroundColor: theme.colors.cream },
};

export function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
    </AuthStackNav.Navigator>
  );
}

export function TryOnStack() {
  return (
    <TryOnStackNav.Navigator screenOptions={stackScreenOptions}>
      <TryOnStackNav.Screen
        name="PhotoUpload"
        component={PhotoUploadScreen}
        options={{ title: 'Studio Try-On' }}
      />
      <TryOnStackNav.Screen
        name="SizeInput"
        component={SizeInputScreen}
        options={{ title: 'Spesifikasi Ukuran' }}
      />
      <TryOnStackNav.Screen
        name="Result"
        component={ResultScreen}
        options={{ title: 'Hasil Fitting' }}
      />
    </TryOnStackNav.Navigator>
  );
}

export function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={stackScreenOptions}>
      <ProfileStackNav.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: 'Klub & Profil' }}
      />
    </ProfileStackNav.Navigator>
  );
}

export function MainTab() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.cobalt,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="TryOnTab"
        component={TryOnStack}
        options={{
          title: 'Try-On',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabDot, focused && styles.tabDotActive]} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabDot, focused && styles.tabDotActive]} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.paper} />
      </View>
    );
  }

  return <NavigationContainer>{user ? <MainTab /> : <AuthStack />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.cobalt,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  brandWord: {
    fontFamily: theme.fonts.display,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  brandAiPill: {
    backgroundColor: theme.colors.azure,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  brandAiText: {
    fontFamily: theme.fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.paper,
  },
  tabBar: {
    backgroundColor: theme.colors.cream,
    borderTopColor: theme.colors.line,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    fontWeight: '700',
  },
  tabDot: {
    width: 18,
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.line,
  },
  tabDotActive: {
    width: 28,
    backgroundColor: theme.colors.azure,
  },
});
