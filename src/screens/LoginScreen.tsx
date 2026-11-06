import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Pill } from '../components/ui';
import { theme } from '../theme';

const FC_MONOGRAM = require('../../assets/icon.png');

export default function LoginScreen() {
  const { enterDemoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const validate = () => {
    if (!email.trim() || !password) {
      Alert.alert('Input Belum Lengkap', 'Masukkan email dan password terlebih dahulu.');
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Supabase Belum Dikonfigurasi',
        'Isi EXPO_PUBLIC_SUPABASE_URL & EXPO_PUBLIC_SUPABASE_ANON_KEY di .env atau gunakan Mode Demo.'
      );
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      Alert.alert('Gagal Masuk', error.message);
    }
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Supabase Belum Dikonfigurasi',
        'Isi EXPO_PUBLIC_SUPABASE_URL & EXPO_PUBLIC_SUPABASE_ANON_KEY di .env atau gunakan Mode Demo.'
      );
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      Alert.alert('Gagal Daftar', error.message);
    } else {
      Alert.alert('Berhasil', 'Akun berhasil dibuat. Silakan langsung masuk.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBlock}>
          <View style={styles.logoCard}>
            <Image
              source={FC_MONOGRAM}
              style={styles.monogramImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.wordmarkText}>FitCheck</Text>
          <Text style={styles.tagline}>
            Virtual Closet & AI Fitting Studio
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formWell}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password (min. 6 karakter)"
              placeholderTextColor={theme.colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Pill
              variant="primary"
              label="Masuk"
              loading={busy}
              disabled={busy}
              onPress={handleSignIn}
            />

            <View style={styles.secondaryRow}>
              <Pill
                variant="chip"
                label="Daftar akun"
                disabled={busy}
                onPress={handleSignUp}
                style={styles.halfPill}
              />
              <Pill
                variant="chip"
                label="Mode Demo"
                disabled={busy}
                onPress={() => enterDemoMode(email.trim() || 'demo@fitcheck.ai')}
                style={styles.halfPill}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 84,
    paddingBottom: 40,
  },
  heroBlock: {
    alignItems: 'center',
  },
  logoCard: {
    padding: 6,
    borderRadius: 28,
    backgroundColor: theme.colors.card,
    marginBottom: 18,
    ...theme.shadow,
  },
  monogramImage: {
    width: 96,
    height: 96,
    borderRadius: 22,
  },
  wordmarkText: {
    fontFamily: theme.font,
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.ink,
    letterSpacing: -0.6,
  },
  tagline: {
    fontFamily: theme.font,
    color: theme.colors.muted,
    fontSize: 15,
    fontWeight: '400',
    marginTop: 6,
    textAlign: 'center',
  },
  formCard: {
    padding: 6,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.card,
    ...theme.shadow,
  },
  formWell: {
    backgroundColor: theme.colors.well,
    borderRadius: theme.radius.tile,
    padding: 16,
    gap: 12,
  },
  input: {
    fontFamily: theme.font,
    borderRadius: theme.radius.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.ink,
    backgroundColor: theme.colors.card,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfPill: {
    flex: 1,
    height: 44,
  },
});
