import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface ProfileData {
  height_cm: number | null;
  chest_cm: number | null;
  weight_kg: number | null;
  waist_cm: number | null;
  shoulder_cm: number | null;
}

export default function AccountScreen() {
  const { user, isDemo, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user || isDemo || !isSupabaseConfigured) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('height_cm, chest_cm, weight_kg, waist_cm, shoulder_cm')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(data ?? null);
    setLoading(false);
  }, [user, isDemo]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleDeleteAllData = () => {
    Alert.alert(
      'Hapus Semua Data',
      'Seluruh data ukuran tubuh, pakaian, riwayat try-on, dan foto Anda di server akan dihapus permanen. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Permanen',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            setLoading(true);
            try {
              if (!isDemo && isSupabaseConfigured) {
                const { data: files } = await supabase.storage
                  .from('tryon-photos')
                  .list(user.id);
                if (files && files.length > 0) {
                  await supabase.storage
                    .from('tryon-photos')
                    .remove(files.map((f) => `${user.id}/${f.name}`));
                }

                await supabase.from('fit_results').delete().eq('user_id', user.id);
                await supabase.from('tryon_jobs').delete().eq('user_id', user.id);
                await supabase.from('garments').delete().eq('user_id', user.id);
                await supabase.from('profiles').delete().eq('id', user.id);
              }
              setProfile(null);
              Alert.alert('Berhasil', 'Semua data Anda telah dihapus.');
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Gagal menghapus data';
              Alert.alert('Kesalahan', message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informasi Akun</Text>
        <Text style={styles.email}>{user?.email ?? 'Pengguna'}</Text>
        <Text style={styles.modeTag}>
          Status: {isDemo ? 'Mode Demo Lokal' : 'Terhubung ke Supabase'}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Profil Ukuran Tubuh</Text>
          <TouchableOpacity onPress={fetchProfile}>
            <Text style={styles.refreshText}>Muat Ulang</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#2563EB" style={{ marginVertical: 16 }} />
        ) : profile ? (
          <View style={styles.grid}>
            <Text style={styles.item}>Lingkar Dada: {profile.chest_cm ?? '-'} cm</Text>
            <Text style={styles.item}>Lebar Bahu: {profile.shoulder_cm ?? '-'} cm</Text>
            <Text style={styles.item}>Lingkar Pinggang: {profile.waist_cm ?? '-'} cm</Text>
            <Text style={styles.item}>Tinggi Badan: {profile.height_cm ?? '-'} cm</Text>
            <Text style={styles.item}>Berat Badan: {profile.weight_kg ?? '-'} kg</Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>
            Belum ada data profil ukuran tersimpan di server.
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAllData}>
        <Text style={styles.dangerBtnText}>Hapus Semua Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <Text style={styles.logoutBtnText}>Keluar (Logout)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  refreshText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  email: {
    fontSize: 16,
    color: '#1E293B',
    marginTop: 8,
    fontWeight: '600',
  },
  modeTag: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  grid: {
    marginTop: 12,
    gap: 6,
  },
  item: {
    fontSize: 14,
    color: '#334155',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 10,
  },
  dangerBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoutBtnText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 15,
  },
});
