import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { CircleButton, Pill, TopBar } from '../components/ui';
import { theme } from '../theme';

type Props = NativeStackScreenProps<TryOnStackParamList, 'SizeInput'>;

const STORAGE_KEY = '@user_profile_measurements';

const STRETCH_OPTIONS: { label: string; value: StretchType }[] = [
  { label: 'Kaku', value: 'kaku' },
  { label: 'Semi Stretch', value: 'sedikit_stretch' },
  { label: 'Stretch', value: 'stretch' },
];

export default function SizeInputScreen({ route, navigation }: Props) {
  const { personPhotoUri, garmentPhotoUri, garmentPreset } = route.params;
  const { user, isDemo } = useAuth();
  const insets = useSafeAreaInsets();

  const [chestCm, setChestCm] = useState('96');
  const [heightCm, setHeightCm] = useState('172');
  const [weightKg, setWeightKg] = useState('68');
  const [waistCm, setWaistCm] = useState('82');
  const [shoulderCm, setShoulderCm] = useState('44');

  const [chestWidthCm, setChestWidthCm] = useState(
    garmentPreset?.chest_width_cm != null ? String(garmentPreset.chest_width_cm) : '52'
  );
  const [hemWidthCm, setHemWidthCm] = useState(
    garmentPreset?.hem_width_cm != null ? String(garmentPreset.hem_width_cm) : '52'
  );
  const [garmentShoulderCm, setGarmentShoulderCm] = useState(
    garmentPreset?.shoulder_width_cm != null ? String(garmentPreset.shoulder_width_cm) : '45'
  );
  const [lengthCm, setLengthCm] = useState(
    garmentPreset?.length_cm != null ? String(garmentPreset.length_cm) : '70'
  );
  const [stretchType, setStretchType] = useState<StretchType>(
    garmentPreset?.stretch_type ?? 'kaku'
  );

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
        const garmentImagePath =
          garmentPreset?.image_path ?? `${user.id}/garment-${ts}.jpg`;

        const uploadPhoto = async (uri: string, storagePath: string) => {
          const res = await fetch(uri);
          const blob = await res.blob();
          await supabase.storage
            .from('tryon-photos')
            .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: true });
        };

        await Promise.all([
          uploadPhoto(personPhotoUri, personImagePath),
          garmentPreset?.image_path
            ? Promise.resolve()
            : uploadPhoto(garmentPhotoUri, garmentImagePath),
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

        if (!garmentPreset) {
          await supabase.from('garments').insert({
            user_id: user.id,
            chest_width_cm: garment.chest_width,
            hem_width_cm: garment.hem_width ?? null,
            shoulder_width_cm: garment.shoulder ?? null,
            length_cm: garment.length ?? null,
            stretch_type: garment.stretch_type,
            image_path: garmentImagePath,
          });
        }

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
    setter: (next: string) => void,
    isLast = false
  ) => (
    <View key={label}>
      <View style={styles.specRow}>
        <Text style={styles.specName}>{label}</Text>
        <Text style={styles.specUnit}>{unit}</Text>
        <TextInput
          style={styles.specInput}
          keyboardType="numeric"
          value={val}
          onChangeText={setter}
        />
        <View style={styles.stepperGroup}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => stepValue(val, -1, setter)}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <Pressable
            style={styles.stepBtn}
            onPress={() => stepValue(val, 1, setter)}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>
      </View>
      {!isLast && <View style={styles.hairline} />}
    </View>
  );

  return (
    <View style={styles.screen}>
      <TopBar
        title="Ukuran"
        subtitle="Tubuh & Size Chart Kaos"
        left={
          <CircleButton
            icon={ArrowLeft}
            accessibilityLabel="Kembali"
            onPress={() => navigation.goBack()}
          />
        }
        right={
          <Pill
            label="Simpan"
            icon={Check}
            loading={savingBody}
            onPress={handleSaveBodyOnly}
          />
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom + 24, 36) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionBlock}>
          <Text style={styles.groupTitle}>Profil Tubuh Anda</Text>
          <View style={styles.card}>
            <View style={styles.well}>
              {renderSpecRow('Lingkar Dada *', 'cm', chestCm, setChestCm)}
              {renderSpecRow('Lebar Bahu', 'cm', shoulderCm, setShoulderCm)}
              {renderSpecRow('Lingkar Pinggang', 'cm', waistCm, setWaistCm)}
              {renderSpecRow('Tinggi Badan', 'cm', heightCm, setHeightCm)}
              {renderSpecRow('Berat Badan', 'kg', weightKg, setWeightKg, true)}
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.groupTitle}>Size Chart Kaos (Datar)</Text>
          <View style={styles.card}>
            <View style={styles.well}>
              {renderSpecRow('Lebar Dada *', 'cm', chestWidthCm, setChestWidthCm)}
              {renderSpecRow('Lebar Bahu', 'cm', garmentShoulderCm, setGarmentShoulderCm)}
              {renderSpecRow('Lebar Bawah', 'cm', hemWidthCm, setHemWidthCm)}
              {renderSpecRow('Panjang Kaos', 'cm', lengthCm, setLengthCm, true)}
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.groupTitle}>Karakter Bahan</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {STRETCH_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                label={opt.label}
                variant={stretchType === opt.value ? 'chipActive' : 'chip'}
                onPress={() => setStretchType(opt.value)}
              />
            ))}
          </ScrollView>
        </View>

        <Pill
          variant="primary"
          label="Proses Try-On"
          loading={submitting}
          disabled={submitting}
          onPress={handleCalculate}
          style={styles.submitBtn}
        />
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
    gap: 18,
  },
  sectionBlock: {
    gap: 10,
  },
  groupTitle: {
    fontFamily: theme.font,
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    paddingHorizontal: 4,
  },
  card: {
    padding: 5,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.card,
    ...theme.shadow,
  },
  well: {
    borderRadius: theme.radius.tile,
    backgroundColor: theme.colors.well,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  hairline: {
    height: 1,
    backgroundColor: theme.colors.hairline,
    marginHorizontal: 14,
  },
  specName: {
    flex: 1.3,
    fontFamily: theme.font,
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  specUnit: {
    width: 30,
    fontFamily: theme.font,
    color: theme.colors.muted,
    fontSize: 13,
  },
  specInput: {
    width: 56,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontFamily: theme.font,
    fontVariant: ['tabular-nums'],
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.ink,
    textAlign: 'center',
    marginRight: 8,
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.chip,
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  stepBtnText: {
    fontFamily: theme.font,
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  chipRow: {
    gap: 8,
  },
  submitBtn: {
    marginTop: 'auto',
  },
});
