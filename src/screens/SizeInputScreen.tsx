import React, { useEffect, useState } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TryOnStackParamList } from '../navigation/types';
import {
  BodyMeasurements,
  buildTryOnPrompt,
  calculateFit,
  GarmentMeasurements,
  StretchType,
} from '../utils/estimator';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { theme } from '../theme';

type Props = NativeStackScreenProps<TryOnStackParamList, 'SizeInput'>;

const STORAGE_KEY = '@user_profile_measurements';

const STRETCH_OPTIONS: { label: string; value: StretchType }[] = [
  { label: 'Kaku', value: 'kaku' },
  { label: 'Semi Stretch', value: 'sedikit_stretch' },
  { label: 'Stretch', value: 'stretch' },
];

export default function SizeInputScreen({ route, navigation }: Props) {
  const { personPhotoUri, garmentPhotoUri } = route.params;
  const { user, isDemo } = useAuth();

  const [chestCm, setChestCm] = useState('96');
  const [heightCm, setHeightCm] = useState('172');
  const [weightKg, setWeightKg] = useState('68');
  const [waistCm, setWaistCm] = useState('82');
  const [shoulderCm, setShoulderCm] = useState('44');

  const [chestWidthCm, setChestWidthCm] = useState('52');
  const [hemWidthCm, setHemWidthCm] = useState('52');
  const [garmentShoulderCm, setGarmentShoulderCm] = useState('45');
  const [lengthCm, setLengthCm] = useState('70');
  const [stretchType, setStretchType] = useState<StretchType>('kaku');

  const [submitting, setSubmitting] = useState(false);
  const [savingBody, setSavingBody] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      let found = false;
      if (user && !isDemo && isSupabaseConfigured) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (data && (data.chest_cm != null || data.height_cm != null)) {
            if (data.chest_cm != null) setChestCm(String(data.chest_cm));
            if (data.height_cm != null) setHeightCm(String(data.height_cm));
            if (data.weight_kg != null) setWeightKg(String(data.weight_kg));
            if (data.waist_cm != null) setWaistCm(String(data.waist_cm));
            if (data.shoulder_cm != null) setShoulderCm(String(data.shoulder_cm));
            found = true;
          }
        } catch {}
      }

      if (!found) {
        try {
          const cached = await AsyncStorage.getItem(STORAGE_KEY);
          if (cached) {
            const data = JSON.parse(cached);
            if (data.chest_cm != null) setChestCm(String(data.chest_cm));
            if (data.height_cm != null) setHeightCm(String(data.height_cm));
            if (data.weight_kg != null) setWeightKg(String(data.weight_kg));
            if (data.waist_cm != null) setWaistCm(String(data.waist_cm));
            if (data.shoulder_cm != null) setShoulderCm(String(data.shoulder_cm));
          }
        } catch {}
      }
    };

    loadProfile();
  }, [user, isDemo]);

  const parseOptional = (val: string): number | undefined => {
    const n = parseFloat(val);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  const stepValue = (val: string, delta: number, setter: (next: string) => void) => {
    const current = parseFloat(val) || 0;
    const next = Math.max(1, current + delta);
    setter(String(next));
  };

  const handleSaveBodyOnly = async () => {
    const chest = parseFloat(chestCm);
    if (!Number.isFinite(chest) || chest <= 0) {
      Alert.alert(
        'Input Wajib',
        'Lingkar dada tubuh wajib diisi angka lebih dari 0 untuk disimpan.'
      );
      return;
    }

    setSavingBody(true);
    const bodyData = {
      chest_cm: chest,
      height_cm: parseOptional(heightCm) ?? null,
      weight_kg: parseOptional(weightKg) ?? null,
      waist_cm: parseOptional(waistCm) ?? null,
      shoulder_cm: parseOptional(shoulderCm) ?? null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (user && !isDemo && isSupabaseConfigured) {
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          ...bodyData,
        });
        if (error) throw error;
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bodyData));
      Alert.alert('Tersimpan', 'Ukuran tubuh berhasil disimpan sebagai profil default Anda.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan profil';
      Alert.alert('Gagal', message);
    } finally {
      setSavingBody(false);
    }
  };

  const handleCalculate = async () => {
    const chest = parseFloat(chestCm);
    const chestWidth = parseFloat(chestWidthCm);

    if (!Number.isFinite(chest) || chest <= 0 || !Number.isFinite(chestWidth) || chestWidth <= 0) {
      Alert.alert(
        'Data Wajib Belum Valid',
        'Lingkar dada tubuh dan lebar dada kaos wajib diisi dengan angka lebih dari 0.'
      );
      return;
    }

    const body: BodyMeasurements = {
      chest,
      height: parseOptional(heightCm),
      weight: parseOptional(weightKg),
      waist: parseOptional(waistCm),
      shoulder: parseOptional(shoulderCm),
    };

    const garment: GarmentMeasurements = {
      chest_width: chestWidth,
      hem_width: parseOptional(hemWidthCm),
      shoulder: parseOptional(garmentShoulderCm),
      length: parseOptional(lengthCm),
      stretch_type: stretchType,
    };

    const fitResult = calculateFit(body, garment);
    const tryOnPrompt = buildTryOnPrompt(fitResult);
    let createdJobId: string | undefined;
    let resultImageUri: string | undefined;

    setSubmitting(true);
    try {
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          chest_cm: body.chest,
          height_cm: body.height ?? null,
          weight_kg: body.weight ?? null,
          waist_cm: body.waist ?? null,
          shoulder_cm: body.shoulder ?? null,
        })
      ).catch(() => {});

      if (user && !isDemo && isSupabaseConfigured) {
        const ts = Date.now();
        const personImagePath = `${user.id}/person-${ts}.jpg`;
        const garmentImagePath = `${user.id}/garment-${ts}.jpg`;

        const uploadPhoto = async (uri: string, storagePath: string) => {
          const res = await fetch(uri);
          const blob = await res.blob();
          await supabase.storage
            .from('tryon-photos')
            .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: true });
        };
        await Promise.all([
          uploadPhoto(personPhotoUri, personImagePath),
          uploadPhoto(garmentPhotoUri, garmentImagePath),
        ]).catch(() => {});

        await supabase.from('profiles').upsert({
          id: user.id,
          chest_cm: body.chest,
          height_cm: body.height ?? null,
          weight_kg: body.weight ?? null,
          waist_cm: body.waist ?? null,
          shoulder_cm: body.shoulder ?? null,
          updated_at: new Date().toISOString(),
        });

        await supabase.from('garments').insert({
          user_id: user.id,
          chest_width_cm: garment.chest_width,
          hem_width_cm: garment.hem_width ?? null,
          shoulder_width_cm: garment.shoulder ?? null,
          length_cm: garment.length ?? null,
          stretch_type: garment.stretch_type,
          image_path: garmentImagePath,
        });

        const { data: jobData } = await supabase
          .from('tryon_jobs')
          .insert({
            user_id: user.id,
            status: 'queued',
            person_image_path: personImagePath,
            garment_image_path: garmentImagePath,
          })
          .select('id')
          .single();

        createdJobId = jobData?.id;

        await supabase.from('fit_results').insert({
          job_id: createdJobId ?? null,
          user_id: user.id,
          chest_ease_cm: fitResult.chest_ease_cm,
          fit_label: fitResult.fit_label,
          warnings: fitResult.warnings,
        });

        if (createdJobId) {
          const { data: fnData } = await supabase.functions
            .invoke('process-tryon', {
              body: {
                job_id: createdJobId,
                person_image_path: personImagePath,
                garment_image_path: garmentImagePath,
                prompt: tryOnPrompt,
              },
            })
            .catch(() => ({ data: null }));

          if (!resultImageUri && fnData?.result_url) {
            resultImageUri = fnData.result_url;
          }
        }
      }
    } catch {
      // Tetap lanjutkan ke layar hasil meski koneksi gagal
    } finally {
      setSubmitting(false);
    }

    navigation.navigate('Result', {
      personPhotoUri,
      garmentPhotoUri,
      body,
      garment,
      fitResult,
      resultImageUri,
      jobId: createdJobId,
    });
  };

  const renderSpecRow = (
    label: string,
    unit: string,
    val: string,
    setter: (next: string) => void
  ) => (
    <View style={styles.specRow} key={label}>
      <Text style={styles.specName}>{label}</Text>
      <Text style={styles.specUnit}>{unit}</Text>
      <TextInput
        style={styles.specInput}
        keyboardType="numeric"
        value={val}
        onChangeText={setter}
      />
      <View style={styles.stepperPill}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => stepValue(val, -1, setter)}
        >
          <Text style={styles.stepBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.stepValueText}>{val || '0'}</Text>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => stepValue(val, 1, setter)}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Ukuran Tubuh & Kaos</Text>
      <Text style={styles.subheading}>
        Sesuaikan ukuran lingkar tubuh Anda dan lebar datar kaos dari size chart toko.
      </Text>

      <Text style={styles.groupTitle}>Profil Tubuh Anda</Text>
      <View style={styles.specTable}>
        {renderSpecRow('Lingkar Dada *', 'cm', chestCm, setChestCm)}
        {renderSpecRow('Lebar Bahu', 'cm', shoulderCm, setShoulderCm)}
        {renderSpecRow('Lingkar Pinggang', 'cm', waistCm, setWaistCm)}
        {renderSpecRow('Tinggi Badan', 'cm', heightCm, setHeightCm)}
        {renderSpecRow('Berat Badan', 'kg', weightKg, setWeightKg)}
      </View>

      <TouchableOpacity
        style={styles.saveProfilePill}
        onPress={handleSaveBodyOnly}
        disabled={savingBody}
      >
        {savingBody ? (
          <ActivityIndicator size="small" color={theme.colors.cobalt} />
        ) : (
          <Text style={styles.saveProfilePillText}>Simpan Ukuran ke Profil</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.groupTitle}>Size Chart Kaos (Datar)</Text>
      <View style={styles.specTable}>
        {renderSpecRow('Lebar Dada *', 'cm', chestWidthCm, setChestWidthCm)}
        {renderSpecRow('Lebar Bahu', 'cm', garmentShoulderCm, setGarmentShoulderCm)}
        {renderSpecRow('Lebar Bawah', 'cm', hemWidthCm, setHemWidthCm)}
        {renderSpecRow('Panjang Kaos', 'cm', lengthCm, setLengthCm)}
      </View>

      <Text style={styles.groupTitle}>Karakter Bahan</Text>
      <View style={styles.stretchRow}>
        {STRETCH_OPTIONS.map((opt) => {
          const active = stretchType === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.stretchPill, active && styles.stretchPillActive]}
              onPress={() => setStretchType(opt.value)}
            >
              <Text
                style={[
                  styles.stretchPillText,
                  active && styles.stretchPillTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.progressTrack}>
        <View style={styles.progressDot} />
        <View style={styles.progressBarActive} />
        <View style={styles.progressDot} />
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backLinkText}>Kembali</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitPill}
          disabled={submitting}
          onPress={handleCalculate}
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.paper} />
          ) : (
            <Text style={styles.submitPillText}>Proses Try-On</Text>
          )}
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
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.muted,
    marginTop: 6,
    lineHeight: 22,
    marginBottom: 18,
  },
  groupTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.ink,
    marginBottom: 8,
    marginTop: 6,
    letterSpacing: 0.2,
  },
  specTable: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
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
  specUnit: {
    width: 34,
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.muted,
  },
  specInput: {
    width: 54,
    backgroundColor: theme.colors.sand,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.ink,
    textAlign: 'center',
    marginRight: 10,
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 86,
    justifyContent: 'space-between',
  },
  stepBtn: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  stepBtnText: {
    fontFamily: theme.fonts.mono,
    color: theme.colors.paper,
    fontSize: 15,
    fontWeight: '600',
  },
  stepValueText: {
    fontFamily: theme.fonts.mono,
    color: theme.colors.paper,
    fontSize: 12,
    fontWeight: '600',
  },
  saveProfilePill: {
    alignSelf: 'flex-start',
    borderWidth: 1.2,
    borderColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  saveProfilePillText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.cobalt,
  },
  stretchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  stretchPill: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    paddingVertical: 9,
    alignItems: 'center',
  },
  stretchPillActive: {
    backgroundColor: theme.colors.cobalt,
  },
  stretchPillText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.cobalt,
  },
  stretchPillTextActive: {
    color: theme.colors.paper,
  },
  progressTrack: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 22,
  },
  progressBarActive: {
    width: 34,
    height: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.ink,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.line,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backLink: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  backLinkText: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.ink,
  },
  submitPill: {
    backgroundColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 26,
    minWidth: 160,
    alignItems: 'center',
  },
  submitPillText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.paper,
    fontSize: 14,
    fontWeight: '700',
  },
});
