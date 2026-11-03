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
      <Text style={styles.heading}>Unggah Foto Try-On</Text>
      <Text style={styles.subheading}>
        Pilih foto tubuh Anda (hadap depan) dan foto kaos yang ingin dicoba.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Foto Tubuh</Text>
        {personPhotoUri ? (
          <Image source={{ uri: personPhotoUri }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Belum ada foto tubuh</Text>
          </View>
        )}
        <TouchableOpacity style={styles.outlineBtn} onPress={() => pickImage('person')}>
          <Text style={styles.outlineBtnText}>
            {personPhotoUri ? 'Ganti Foto Tubuh' : 'Pilih Foto Tubuh dari Galeri'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Foto Kaos (Atasan)</Text>
        {garmentPhotoUri ? (
          <Image source={{ uri: garmentPhotoUri }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Belum ada foto kaos</Text>
          </View>
        )}
        <TouchableOpacity style={styles.outlineBtn} onPress={() => pickImage('garment')}>
          <Text style={styles.outlineBtnText}>
            {garmentPhotoUri ? 'Ganti Foto Kaos' : 'Pilih Foto Kaos dari Galeri'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.sampleBtn}
        onPress={() => {
          setPersonPhotoUri(SAMPLE_PERSON_URI);
          setGarmentPhotoUri(SAMPLE_GARMENT_URI);
        }}
      >
        <Text style={styles.sampleBtnText}>Gunakan Foto Contoh (Cepat)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryBtn, !canProceed && styles.disabledBtn]}
        disabled={!canProceed}
        onPress={() => {
          if (personPhotoUri && garmentPhotoUri) {
            navigation.navigate('SizeInput', { personPhotoUri, garmentPhotoUri });
          }
        }}
      >
        <Text style={styles.primaryBtnText}>Lanjut ke Input Ukuran</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  subheading: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  placeholder: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  sampleBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  sampleBtnText: {
    color: '#475569',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 28,
  },
  disabledBtn: {
    backgroundColor: '#94A3B8',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
