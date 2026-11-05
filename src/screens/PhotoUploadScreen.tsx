import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TryOnStackParamList } from '../navigation/types';
import { theme } from '../theme';

type Props = NativeStackScreenProps<TryOnStackParamList, 'PhotoUpload'>;

const SAMPLE_PERSON_URI =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80';
const SAMPLE_GARMENT_URI =
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80';

export default function PhotoUploadScreen({ navigation }: Props) {
  const [personPhotoUri, setPersonPhotoUri] = useState<string | null>(null);
  const [garmentPhotoUri, setGarmentPhotoUri] = useState<string | null>(null);

  const pickImage = async (target: 'person' | 'garment') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin Diperlukan', 'Izinkan akses galeri untuk memilih foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      if (target === 'person') {
        setPersonPhotoUri(result.assets[0].uri);
      } else {
        setGarmentPhotoUri(result.assets[0].uri);
      }
    }
  };

  const canProceed = Boolean(personPhotoUri && garmentPhotoUri);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Pilih Foto Try-On</Text>
      <Text style={styles.subheading}>
        Siapkan satu foto tubuh menghadap depan dan satu foto kaos yang ingin dicoba.
      </Text>

      <View style={styles.specTable}>
        <View style={styles.specRow}>
          <Text style={styles.specName}>Foto Tubuh</Text>
          <Text style={styles.specMeta}>Hadap depan</Text>
          <Text style={styles.specStatus}>
            {personPhotoUri ? 'Siap' : 'Kosong'}
          </Text>
          <TouchableOpacity
            style={personPhotoUri ? styles.pillFilled : styles.pillOutline}
            onPress={() => pickImage('person')}
          >
            <Text
              style={
                personPhotoUri ? styles.pillFilledText : styles.pillOutlineText
              }
            >
              {personPhotoUri ? 'Ganti' : 'Pilih'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specName}>Foto Kaos</Text>
          <Text style={styles.specMeta}>Atasan datar</Text>
          <Text style={styles.specStatus}>
            {garmentPhotoUri ? 'Siap' : 'Kosong'}
          </Text>
          <TouchableOpacity
            style={garmentPhotoUri ? styles.pillFilled : styles.pillOutline}
            onPress={() => pickImage('garment')}
          >
            <Text
              style={
                garmentPhotoUri ? styles.pillFilledText : styles.pillOutlineText
              }
            >
              {garmentPhotoUri ? 'Ganti' : 'Pilih'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.showcaseRow}>
        <TouchableOpacity
          style={styles.photoSlot}
          onPress={() => pickImage('person')}
          activeOpacity={0.85}
        >
          {personPhotoUri ? (
            <Image source={{ uri: personPhotoUri }} style={styles.photoImage} />
          ) : (
            <View style={styles.emptySlot}>
              <Text style={styles.emptySlotTitle}>Tubuh</Text>
              <Text style={styles.emptySlotSub}>Ketuk untuk unggah</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.photoSlot}
          onPress={() => pickImage('garment')}
          activeOpacity={0.85}
        >
          {garmentPhotoUri ? (
            <Image source={{ uri: garmentPhotoUri }} style={styles.photoImage} />
          ) : (
            <View style={styles.emptySlot}>
              <Text style={styles.emptySlotTitle}>Kaos</Text>
              <Text style={styles.emptySlotSub}>Ketuk untuk unggah</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.progressTrack}>
        <View style={styles.progressBarActive} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => {
            setPersonPhotoUri(SAMPLE_PERSON_URI);
            setGarmentPhotoUri(SAMPLE_GARMENT_URI);
          }}
        >
          <Text style={styles.skipText}>Pakai Contoh</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextPill, !canProceed && styles.disabledPill]}
          disabled={!canProceed}
          onPress={() => {
            if (personPhotoUri && garmentPhotoUri) {
              navigation.navigate('SizeInput', { personPhotoUri, garmentPhotoUri });
            }
          }}
        >
          <Text style={styles.nextPillText}>Lanjut Ukuran</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
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
    marginBottom: 20,
  },
  specTable: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    marginBottom: 22,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  specName: {
    flex: 1.2,
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.ink,
  },
  specMeta: {
    flex: 1.1,
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.muted,
  },
  specStatus: {
    width: 58,
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.ink,
    textAlign: 'right',
    marginRight: 12,
  },
  pillOutline: {
    width: 82,
    borderWidth: 1.2,
    borderColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    paddingVertical: 7,
    alignItems: 'center',
  },
  pillOutlineText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.cobalt,
    fontSize: 13,
    fontWeight: '600',
  },
  pillFilled: {
    width: 82,
    backgroundColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    paddingVertical: 7,
    alignItems: 'center',
  },
  pillFilledText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.paper,
    fontSize: 13,
    fontWeight: '600',
  },
  showcaseRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  photoSlot: {
    flex: 1,
    height: 220,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.sand,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  emptySlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  emptySlotTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  emptySlotSub: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 5,
    textAlign: 'center',
  },
  progressTrack: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
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
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  skipText: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.cobalt,
  },
  nextPill: {
    backgroundColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 26,
  },
  disabledPill: {
    backgroundColor: theme.colors.line,
  },
  nextPillText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.paper,
    fontSize: 14,
    fontWeight: '700',
  },
});
