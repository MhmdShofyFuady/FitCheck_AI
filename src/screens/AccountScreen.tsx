import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
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
      } catch { }
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Klub FitCheck</Text>
      <Text style={styles.subheading}>
        {user?.email ?? 'Pengguna'} ({isDemo ? 'Mode Demo Lokal' : 'Supabase Aktif'})
      </Text>

      <View style={styles.headerRow}>
        <Text style={styles.groupTitle}>Ukuran Tubuh Tersimpan</Text>
        <View style={styles.headerActions}>
          {!isEditing ? (
            <TouchableOpacity
              style={styles.pillOutline}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.pillOutlineText}>
                {profile ? 'Ubah' : 'Isi Ukuran'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.pillOutline}
              onPress={() => {
                syncFormWithProfile(profile);
                setIsEditing(false);
              }}
            >
              <Text style={styles.pillOutlineText}>Batal</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchProfile}>
            <Text style={styles.refreshText}>Segarkan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.cobalt} style={{ marginVertical: 20 }} />
      ) : isEditing ? (
        <View style={styles.formBlock}>
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

          <TouchableOpacity
            style={styles.pillFilled}
            disabled={saving}
            onPress={handleSaveProfile}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.paper} />
            ) : (
              <Text style={styles.pillFilledText}>Simpan Ukuran Tubuh</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : profile ? (
        <View style={styles.specTable}>
          <View style={styles.specRow}>
            <Text style={styles.specName}>Lingkar Dada</Text>
            <Text style={styles.specMeta}>Utama</Text>
            <Text style={styles.specVal}>{profile.chest_cm ?? '-'} cm</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specName}>Lebar Bahu</Text>
            <Text style={styles.specMeta}>Sekunder</Text>
            <Text style={styles.specVal}>{profile.shoulder_cm ?? '-'} cm</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specName}>Lingkar Pinggang</Text>
            <Text style={styles.specMeta}>Sekunder</Text>
            <Text style={styles.specVal}>{profile.waist_cm ?? '-'} cm</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specName}>Tinggi Badan</Text>
            <Text style={styles.specMeta}>Proporsi</Text>
            <Text style={styles.specVal}>{profile.height_cm ?? '-'} cm</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specName}>Berat Badan</Text>
            <Text style={styles.specMeta}>Proporsi</Text>
            <Text style={styles.specVal}>{profile.weight_kg ?? '-'} kg</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Ukuran tubuh Anda belum disimpan. Simpan sekali untuk digunakan otomatis di setiap uji coba kaos.
          </Text>
          <TouchableOpacity
            style={styles.pillFilled}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.pillFilledText}>Masukkan Ukuran Sekarang</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.dangerLink} onPress={handleDeleteAllData}>
          <Text style={styles.dangerLinkText}>Hapus Semua Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutPill} onPress={signOut}>
          <Text style={styles.logoutPillText}>Keluar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 40,
    backgroundColor: theme.colors.cream,
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.ink,
    letterSpacing: 0.2,
  },
  subheading: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 6,
    marginBottom: 22,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  pillOutline: {
    borderWidth: 1.2,
    borderColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillOutlineText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.cobalt,
    fontSize: 12,
    fontWeight: '600',
  },
  refreshBtn: {
    paddingVertical: 6,
  },
  refreshText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.muted,
  },
  specTable: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    marginBottom: 28,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  specName: {
    flex: 1.3,
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.ink,
  },
  specMeta: {
    flex: 1,
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.muted,
  },
  specVal: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.ink,
  },
  formBlock: {
    marginBottom: 24,
  },
  label: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.ink,
    marginBottom: 6,
  },
  input: {
    fontFamily: theme.fonts.mono,
    backgroundColor: theme.colors.sand,
    borderRadius: theme.radius.input,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: theme.colors.ink,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  pillFilled: {
    backgroundColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    marginTop: 6,
  },
  pillFilledText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.paper,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyBox: {
    backgroundColor: theme.colors.sand,
    borderRadius: theme.radius.card,
    padding: 18,
    marginBottom: 26,
  },
  emptyText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 20,
    marginBottom: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  dangerLink: {
    paddingVertical: 10,
  },
  dangerLinkText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  logoutPill: {
    borderWidth: 1.5,
    borderColor: theme.colors.ink,
    borderRadius: theme.radius.pill,
    paddingVertical: 11,
    paddingHorizontal: 24,
  },
  logoutPillText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
});
