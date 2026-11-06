import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogOut, Pencil, RotateCw, Trash2, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Pill, TopBar, useDockSpace } from '../components/ui';
import { theme } from '../theme';

interface ProfileData {
  height_cm: number | null;
  chest_cm: number | null;
  weight_kg: number | null;
  waist_cm: number | null;
  shoulder_cm: number | null;
}

const STORAGE_KEY = '@user_profile_measurements';

export default function AccountScreen() {
  const { user, isDemo, signOut } = useAuth();
  const dockSpace = useDockSpace();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [chestCm, setChestCm] = useState('');
  const [shoulderCm, setShoulderCm] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  const syncFormWithProfile = (data: ProfileData | null) => {
    setChestCm(data?.chest_cm != null ? String(data.chest_cm) : '');
    setShoulderCm(data?.shoulder_cm != null ? String(data.shoulder_cm) : '');
    setWaistCm(data?.waist_cm != null ? String(data.waist_cm) : '');
    setHeightCm(data?.height_cm != null ? String(data.height_cm) : '');
    setWeightKg(data?.weight_kg != null ? String(data.weight_kg) : '');
  };

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    let loadedData: ProfileData | null = null;

    if (user && !isDemo && isSupabaseConfigured) {
      const { data } = await supabase
        .from('profiles')
        .select('height_cm, chest_cm, weight_kg, waist_cm, shoulder_cm')
        .eq('id', user.id)
        .maybeSingle();

      if (data && (data.chest_cm != null || data.height_cm != null)) {
        loadedData = data;
      }
    }

    if (!loadedData) {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          loadedData = JSON.parse(cached);
        }
      } catch {}
    }

    setProfile(loadedData);
    syncFormWithProfile(loadedData);
    setLoading(false);
  }, [user, isDemo]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const parseOptional = (val: string): number | null => {
    const n = parseFloat(val);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const handleSaveProfile = async () => {
    const chest = parseFloat(chestCm);
    if (!Number.isFinite(chest) || chest <= 0) {
      Alert.alert(
        'Input Wajib',
        'Lingkar dada wajib diisi dengan angka lebih dari 0 untuk estimasi ukuran.'
      );
      return;
    }

    const payload: ProfileData = {
      chest_cm: chest,
      shoulder_cm: parseOptional(shoulderCm),
      waist_cm: parseOptional(waistCm),
      height_cm: parseOptional(heightCm),
      weight_kg: parseOptional(weightKg),
    };

    setSaving(true);
    try {
      if (user && !isDemo && isSupabaseConfigured) {
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          ...payload,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setProfile(payload);
      setIsEditing(false);
      Alert.alert('Berhasil', 'Ukuran tubuh Anda berhasil disimpan.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan profil';
      Alert.alert('Gagal Menyimpan', message);
    } finally {
      setSaving(false);
    }
  };

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
                const [rootFiles, resultFiles] = await Promise.all([
                  supabase.storage.from('tryon-photos').list(user.id),
                  supabase.storage.from('tryon-photos').list(`${user.id}/results`),
                ]);
                const pathsToRemove: string[] = [];
                if (rootFiles.data) {
                  pathsToRemove.push(
                    ...rootFiles.data
                      .filter((f) => f.name !== 'results')
                      .map((f) => `${user.id}/${f.name}`)
                  );
                }
                if (resultFiles.data) {
                  pathsToRemove.push(
                    ...resultFiles.data.map((f) => `${user.id}/results/${f.name}`)
                  );
                }
                if (pathsToRemove.length > 0) {
                  await supabase.storage.from('tryon-photos').remove(pathsToRemove);
                }

                await supabase.from('fit_results').delete().eq('user_id', user.id);
                await supabase.from('tryon_jobs').delete().eq('user_id', user.id);
                await supabase.from('garments').delete().eq('user_id', user.id);
                await supabase.from('profiles').delete().eq('id', user.id);
              }
              await AsyncStorage.removeItem(STORAGE_KEY);
              setProfile(null);
              syncFormWithProfile(null);
              setIsEditing(false);
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
    <View style={styles.screen}>
      <TopBar
        title="Profil"
        subtitle={user?.email ?? 'Pengguna'}
        left={<Pill label="Segarkan" icon={RotateCw} onPress={fetchProfile} />}
        right={
          !isEditing ? (
            <Pill
              label={profile ? 'Ubah' : 'Isi'}
              icon={Pencil}
              onPress={() => setIsEditing(true)}
            />
          ) : (
            <Pill
              label="Batal"
              icon={X}
              onPress={() => {
                syncFormWithProfile(profile);
                setIsEditing(false);
              }}
            />
          )
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.container, { paddingBottom: dockSpace }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.accountBadgeCard}>
          <View style={styles.accountInfoCol}>
            <Text style={styles.accountEmail} numberOfLines={1}>
              {user?.email ?? 'Pengguna'}
            </Text>
            <Text style={styles.accountMode}>
              {isDemo ? 'Mode Demo Lokal' : 'Sinkronisasi Supabase Aktif'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ukuran Tubuh Tersimpan</Text>

        {loading ? (
          <ActivityIndicator color={theme.colors.ink} style={styles.spinner} />
        ) : isEditing ? (
          <View style={styles.card}>
            <Text style={styles.label}>Lingkar Dada (cm) *</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={chestCm}
              onChangeText={setChestCm}
              placeholder="Contoh: 96"
              placeholderTextColor={theme.colors.muted}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Lebar Bahu (cm)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={shoulderCm}
                  onChangeText={setShoulderCm}
                  placeholder="Contoh: 44"
                  placeholderTextColor={theme.colors.muted}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Lingkar Pinggang (cm)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={waistCm}
                  onChangeText={setWaistCm}
                  placeholder="Contoh: 82"
                  placeholderTextColor={theme.colors.muted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Tinggi Badan (cm)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={heightCm}
                  onChangeText={setHeightCm}
                  placeholder="Contoh: 172"
                  placeholderTextColor={theme.colors.muted}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Berat Badan (kg)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={weightKg}
                  onChangeText={setWeightKg}
                  placeholder="Contoh: 68"
                  placeholderTextColor={theme.colors.muted}
                />
              </View>
            </View>

            <Pill
              variant="primary"
              label="Simpan ukuran tubuh"
              loading={saving}
              disabled={saving}
              onPress={handleSaveProfile}
              style={styles.saveBtn}
            />
          </View>
        ) : profile ? (
          <View style={styles.grid}>
            {[
              { label: 'Lingkar Dada', sub: 'Utama', val: `${profile.chest_cm ?? '-'} cm` },
              { label: 'Lebar Bahu', sub: 'Sekunder', val: `${profile.shoulder_cm ?? '-'} cm` },
              { label: 'Pinggang', sub: 'Sekunder', val: `${profile.waist_cm ?? '-'} cm` },
              { label: 'Tinggi Badan', sub: 'Proporsi', val: `${profile.height_cm ?? '-'} cm` },
              { label: 'Berat Badan', sub: 'Proporsi', val: `${profile.weight_kg ?? '-'} kg` },
            ].map((item) => (
              <View key={item.label} style={styles.metricTile}>
                <View style={styles.metricWell}>
                  <Text style={styles.metricSub}>{item.sub}</Text>
                  <Text style={styles.metricValue}>{item.val}</Text>
                  <Text style={styles.metricLabel}>{item.label}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.emptyText}>
              Ukuran tubuh Anda belum disimpan. Simpan sekali untuk digunakan otomatis di setiap uji coba kaos.
            </Text>
            <Pill
              variant="primary"
              label="Masukkan ukuran sekarang"
              onPress={() => setIsEditing(true)}
            />
          </View>
        )}

        <View style={styles.actionsStack}>
          <Pill
            variant="chip"
            icon={LogOut}
            label="Keluar akun"
            onPress={signOut}
            style={styles.actionPill}
          />
          <Pill
            variant="danger"
            icon={Trash2}
            label="Hapus semua data"
            onPress={handleDeleteAllData}
            style={styles.actionPill}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  accountBadgeCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: 16,
    ...theme.shadow,
  },
  accountInfoCol: {
    gap: 3,
  },
  accountEmail: {
    fontFamily: theme.font,
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  accountMode: {
    fontFamily: theme.font,
    color: theme.colors.muted,
    fontSize: 13,
  },
  sectionTitle: {
    fontFamily: theme.font,
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  spinner: {
    marginVertical: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricTile: {
    width: '48%',
    flexGrow: 1,
    padding: 5,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.card,
    ...theme.shadow,
  },
  metricWell: {
    backgroundColor: theme.colors.well,
    borderRadius: theme.radius.tile,
    padding: 16,
    gap: 6,
  },
  metricSub: {
    fontFamily: theme.font,
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    fontFamily: theme.font,
    color: theme.colors.ink,
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  metricLabel: {
    fontFamily: theme.font,
    color: theme.colors.inkSoft,
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: 18,
    gap: 10,
    ...theme.shadow,
  },
  label: {
    fontFamily: theme.font,
    color: theme.colors.inkSoft,
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    fontFamily: theme.font,
    backgroundColor: theme.colors.well,
    borderRadius: theme.radius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.ink,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
    gap: 6,
  },
  saveBtn: {
    marginTop: 6,
  },
  emptyText: {
    fontFamily: theme.font,
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  actionsStack: {
    marginTop: 'auto',
    paddingTop: 12,
    gap: 10,
  },
  actionPill: {
    height: 48,
  },
});
