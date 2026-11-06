import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList, MainTabParamList, TryOnStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import ClosetScreen from '../screens/ClosetScreen';
import PhotoUploadScreen from '../screens/PhotoUploadScreen';
import SizeInputScreen from '../screens/SizeInputScreen';
import ResultScreen from '../screens/ResultScreen';
import AccountScreen from '../screens/AccountScreen';
import { FloatingDock } from '../components/ui';
import { theme } from '../theme';

const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const TryOnStackNav = createNativeStackNavigator<TryOnStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.ink,
    background: theme.colors.canvas,
    card: theme.colors.canvas,
    text: theme.colors.ink,
    border: 'transparent',
  },
};

// Every screen draws its own TopBar, like the reference design.
const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: theme.colors.canvas },
};

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={screenOptions}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
    </AuthStackNav.Navigator>
  );
}

function TryOnStack() {
  return (
    <TryOnStackNav.Navigator screenOptions={screenOptions}>
      <TryOnStackNav.Screen name="PhotoUpload" component={PhotoUploadScreen} />
      <TryOnStackNav.Screen name="SizeInput" component={SizeInputScreen} />
      <TryOnStackNav.Screen name="Result" component={ResultScreen} />
    </TryOnStackNav.Navigator>
  );
}

function MainTab() {
  return (
    <Tab.Navigator
      initialRouteName="TryOnTab"
      tabBar={(props) => <FloatingDock {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.canvas },
      }}
    >
      <Tab.Screen name="ClosetTab" component={ClosetScreen} options={{ title: 'Lemari' }} />
      <Tab.Screen name="TryOnTab" component={TryOnStack} options={{ title: 'Try-On' }} />
      <Tab.Screen name="ProfileTab" component={AccountScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.ink} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? <MainTab /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.canvas,
  },
});
