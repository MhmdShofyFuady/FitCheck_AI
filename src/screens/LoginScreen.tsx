import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

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
      Alert.alert('Berhasil', 'Akun berhasil dibuat. Silakan cek email atau langsung masuk.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>FitCheck AI</Text>
        <Text style={styles.subtitle}>
          Virtual Try-On & Estimasi Ukuran Kaos Presisi
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="nama@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Minimal 6 karakter"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {busy ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 16 }} />
        ) : (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSignIn}>
              <Text style={styles.primaryBtnText}>Masuk</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleSignUp}>
              <Text style={styles.secondaryBtnText}>Daftar Akun Baru</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.demoBtn}
          onPress={() => enterDemoMode(email.trim() || 'demo@fitcheck.ai')}
        >
          <Text style={styles.demoBtnText}>
            Masuk Mode Demo {!isSupabaseConfigured ? '(Tanpa .env)' : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryBtnText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  demoBtn: {
    marginTop: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
  demoBtnText: {
    color: '#475569',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
