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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TryOnStackParamList } from '../navigation/types';
import {
  BodyMeasurements,
  calculateFit,
  GarmentMeasurements,
  StretchType,
} from '../utils/estimator';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type Props = NativeStackScreenProps<TryOnStackParamList, 'SizeInput'>;

const STRETCH_OPTIONS: { label: string; value: StretchType }[] = [
  { label: 'Kaku', value: 'kaku' },
  { label: 'Sedikit Stretch', value: 'sedikit_stretch' },
  { label: 'Stretch', value: 'stretch' },
];

export default function SizeInputScreen({ route, navigation }: Props) {
  const { personPhotoUri, garmentPhotoUri } = route.params;
  const { user, isDemo } = useAuth();

  // Ukuran Tubuh
  const [chestCm, setChestCm] = useState('96');
  const [heightCm, setHeightCm] = useState('172');
  const [weightKg, setWeightKg] = useState('68');
  const [waistCm, setWaistCm] = useState('82');
  const [shoulderCm, setShoulderCm] = useState('44');

  // Ukuran Kaos (Datar / Flat)
  const [chestWidthCm, setChestWidthCm] = useState('52');
  const [hemWidthCm, setHemWidthCm] = useState('52');
  const [garmentShoulderCm, setGarmentShoulderCm] = useState('45');
  const [lengthCm, setLengthCm] = useState('70');
  const [stretchType, setStretchType] = useState<StretchType>('kaku');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || isDemo || !isSupabaseConfigured) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.chest_cm != null) setChestCm(String(data.chest_cm));
        if (data.height_cm != null) setHeightCm(String(data.height_cm));
        if (data.weight_kg != null) setWeightKg(String(data.weight_kg));
        if (data.waist_cm != null) setWaistCm(String(data.waist_cm));
        if (data.shoulder_cm != null) setShoulderCm(String(data.shoulder_cm));
      });
  }, [user, isDemo]);

  const parseOptional = (val: string): number | undefined => {
    const n = parseFloat(val);
    return Number.isFinite(n) && n > 0 ? n : undefined;
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
    let createdJobId: string | undefined;

    setSubmitting(true);
    try {
      if (user && !isDemo && isSupabaseConfigured) {
        const ts = Date.now();
        const personImagePath = `${user.id}/person-${ts}.jpg`;
        const garmentImagePath = `${user.id}/garment-${ts}.jpg`;

        // 1. Upsert ukuran tubuh ke profiles
        await supabase.from('profiles').upsert({
          id: user.id,
          chest_cm: body.chest,
          height_cm: body.height ?? null,
          weight_kg: body.weight ?? null,
          waist_cm: body.waist ?? null,
          shoulder_cm: body.shoulder ?? null,
          updated_at: new Date().toISOString(),
        });

        // 2. Simpan data kaos ke garments
        await supabase.from('garments').insert({
          user_id: user.id,
          chest_width_cm: garment.chest_width,
          hem_width_cm: garment.hem_width ?? null,
          shoulder_width_cm: garment.shoulder ?? null,
          length_cm: garment.length ?? null,
          stretch_type: garment.stretch_type,
          image_path: garmentImagePath,
        });

        // 3. Buat antrean job try-on asinkron
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

        // 4. Simpan hasil perhitungan estimator ke fit_results
        await supabase.from('fit_results').insert({
          job_id: createdJobId ?? null,
          user_id: user.id,
          chest_ease_cm: fitResult.chest_ease_cm,
          fit_label: fitResult.fit_label,
          warnings: fitResult.warnings,
        });

        // 5. Panggil Edge Function secara asinkron di latar belakang
        if (createdJobId) {
          supabase.functions
            .invoke('process-tryon', {
              body: {
                job_id: createdJobId,
                person_image_path: personImagePath,
                garment_image_path: garmentImagePath,
              },
            })
            .catch(() => {});
        }
      }
    } catch {
      // Tetap lanjutkan ke layar hasil meski koneksi/penyimpanan gagal
    } finally {
      setSubmitting(false);
    }

    navigation.navigate('Result', {
      personPhotoUri,
      garmentPhotoUri,
      body,
      garment,
      fitResult,
      jobId: createdJobId,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ukuran Tubuh Pengguna</Text>
        <Text style={styles.sectionHint}>
          Gunakan ukuran lingkar tubuh (cm).
        </Text>

        <Text style={styles.label}>Lingkar Dada (cm) *</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={chestCm}
          onChangeText={setChestCm}
          placeholder="Contoh: 96"
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
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ukuran Kaos (Atasan)</Text>
        <Text style={styles.sectionHint}>
          Masukkan lebar datar (flat width) sesuai size chart kaos.
        </Text>

        <Text style={styles.label}>Lebar Dada Kaos Datar (cm) *</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={chestWidthCm}
          onChangeText={setChestWidthCm}
          placeholder="Contoh: 52"
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Lebar Bahu Kaos (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={garmentShoulderCm}
              onChangeText={setGarmentShoulderCm}
              placeholder="Contoh: 45"
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Lebar Bawah Datar (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={hemWidthCm}
              onChangeText={setHemWidthCm}
              placeholder="Contoh: 52"
            />
          </View>
        </View>

        <Text style={styles.label}>Panjang Kaos (cm)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={lengthCm}
          onChangeText={setLengthCm}
          placeholder="Contoh: 70"
        />

        <Text style={styles.label}>Kelenturan Bahan (Stretch Type)</Text>
        <View style={styles.stretchRow}>
          {STRETCH_OPTIONS.map((opt) => {
            const active = stretchType === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.stretchChip, active && styles.stretchChipActive]}
                onPress={() => setStretchType(opt.value)}
              >
                <Text
                  style={[styles.stretchChipText, active && styles.stretchChipTextActive]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        disabled={submitting}
        onPress={handleCalculate}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryBtnText}>Hitung Estimasi & Proses Try-On</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  stretchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  stretchChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  stretchChipActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  stretchChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  stretchChipTextActive: {
    color: '#2563EB',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 32,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
