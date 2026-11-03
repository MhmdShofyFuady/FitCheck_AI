import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
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

const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const TryOnStackNav = createNativeStackNavigator<TryOnStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

export function AuthStack() {
  return (
    <AuthStackNav.Navigator>
      <AuthStackNav.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'FitCheck AI - Masuk' }}
      />
    </AuthStackNav.Navigator>
  );
}

export function TryOnStack() {
  return (
    <TryOnStackNav.Navigator>
      <TryOnStackNav.Screen
        name="PhotoUpload"
        component={PhotoUploadScreen}
        options={{ title: '1. Unggah Foto' }}
      />
      <TryOnStackNav.Screen
        name="SizeInput"
        component={SizeInputScreen}
        options={{ title: '2. Ukuran Tubuh & Kaos' }}
      />
      <TryOnStackNav.Screen
        name="Result"
        component={ResultScreen}
        options={{ title: '3. Hasil Estimasi & Try-On' }}
      />
    </TryOnStackNav.Navigator>
  );
}

export function ProfileStack() {
  return (
    <ProfileStackNav.Navigator>
      <ProfileStackNav.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: 'Profil & Data Saya' }}
      />
    </ProfileStackNav.Navigator>
  );
}

export function MainTab() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tab.Screen
        name="TryOnTab"
        component={TryOnStack}
        options={{
          title: 'Try-On & Fit',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>👕</Text>,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Akun',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <NavigationContainer>{user ? <MainTab /> : <AuthStack />}</NavigationContainer>;
}
