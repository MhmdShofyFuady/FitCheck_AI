import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { theme } from '../theme';

const FC_MONOGRAM = require('../../assets/android-icon-foreground.png');

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
      >
        <View style={styles.heroBlock}>
          <Image
            source={FC_MONOGRAM}
            style={styles.monogramImage}
            resizeMode="contain"
          />

          <View style={styles.wordmarkRow}>
            <Text style={styles.wordmarkText}>FitCheck</Text>
            <View style={styles.aiBadgePill}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>

          <Text style={styles.tagline}>
            datang untuk gayanya,{'\n'}nyaman karena ukurannya pas
          </Text>
        </View>

        <View style={styles.formBlock}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.colors.cobaltWash}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min. 6 karakter)"
            placeholderTextColor={theme.colors.cobaltWash}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {busy ? (
            <ActivityIndicator
              size="large"
              color={theme.colors.paper}
              style={styles.spinner}
            />
          ) : (
            <View style={styles.pillRow}>
              <TouchableOpacity style={styles.pillOutline} onPress={handleSignUp}>
                <Text style={styles.pillOutlineText}>Daftar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pillFilled} onPress={handleSignIn}>
                <Text style={styles.pillFilledText}>Masuk</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.demoLink}
            onPress={() => enterDemoMode(email.trim() || 'demo@fitcheck.ai')}
          >
            <Text style={styles.demoLinkText}>
              Lewati ke Mode Demo {!isSupabaseConfigured ? '(Tanpa Server)' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.cobalt,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 76,
    paddingBottom: 40,
  },
  heroBlock: {
    alignItems: 'center',
  },
  monogramImage: {
    width: 184,
    height: 184,
    marginBottom: 16,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  wordmarkText: {
    fontFamily: theme.fonts.display,
    fontSize: 40,
    fontWeight: '700',
    color: theme.colors.paper,
    letterSpacing: 0.3,
  },
  aiBadgePill: {
    backgroundColor: theme.colors.azure,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBadgeText: {
    fontFamily: theme.fonts.mono,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.paper,
  },
  tagline: {
    fontFamily: theme.fonts.mono,
    color: theme.colors.cobaltWash,
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  formBlock: {
    marginTop: 24,
  },
  input: {
    fontFamily: theme.fonts.sans,
    borderWidth: 1.5,
    borderColor: theme.colors.paper,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 13,
    fontSize: 15,
    color: theme.colors.paper,
    marginBottom: 12,
    backgroundColor: theme.colors.cobaltMuted,
  },
  spinner: {
    marginVertical: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  pillOutline: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: theme.colors.paper,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pillOutlineText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.paper,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pillFilled: {
    flex: 1,
    backgroundColor: theme.colors.paper,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pillFilledText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.cobalt,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  demoLink: {
    marginTop: 18,
    paddingVertical: 8,
    alignItems: 'center',
  },
  demoLinkText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.cobaltWash,
    fontSize: 13,
    fontWeight: '500',
  },
});
