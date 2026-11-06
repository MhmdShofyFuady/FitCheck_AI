import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import { TryOnStackParamList } from '../navigation/types';
import { ClosetGarment, useCloset } from '../hooks/useCloset';
import { Pill, TopBar, useDockSpace } from '../components/ui';
import { theme } from '../theme';

type Props = NativeStackScreenProps<TryOnStackParamList, 'PhotoUpload'>;

const SAMPLE_PERSON_URI =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80';
const SAMPLE_GARMENT_URI =
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80';

export default function PhotoUploadScreen({ navigation, route }: Props) {
  const [personPhotoUri, setPersonPhotoUri] = useState<string | null>(null);
  const [garmentPhotoUri, setGarmentPhotoUri] = useState<string | null>(null);
  const [garmentPreset, setGarmentPreset] = useState<ClosetGarment | null>(null);
  const { garments } = useCloset();
  const dockSpace = useDockSpace();

  // A garment tapped in the Closet arrives here preselected.
  const incoming = route.params?.garment;
  useEffect(() => {
    if (incoming) {
      setGarmentPreset(incoming);
      setGarmentPhotoUri(incoming.uri);
    }
  }, [incoming]);

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
        setGarmentPreset(null);
        setGarmentPhotoUri(result.assets[0].uri);
      }
    }
  };

  const selectClosetGarment = (garment: ClosetGarment) => {
    setGarmentPreset(garment);
    setGarmentPhotoUri(garment.uri);
  };

  const clearGarment = () => {
    setGarmentPreset(null);
    setGarmentPhotoUri(null);
  };

  const canProceed = Boolean(personPhotoUri && garmentPhotoUri);
  const galleryGarmentSelected = Boolean(garmentPhotoUri && !garmentPreset);

  return (
    <View style={styles.screen}>
      {personPhotoUri ? (
        <Image source={{ uri: personPhotoUri }} style={styles.stageImage} resizeMode="cover" />
      ) : (
        <Pressable style={styles.emptyStage} onPress={() => pickImage('person')}>
          <Camera size={34} strokeWidth={1.8} color={theme.colors.muted} />
          <Text style={styles.emptyTitle}>Foto tubuh</Text>
          <Text style={styles.emptySub}>Ketuk untuk memilih, hadap depan</Text>
        </Pressable>
      )}

      <LinearGradient
        colors={['rgba(218, 218, 220, 0)', theme.colors.stage]}
        locations={[0, 0.55]}
        pointerEvents="none"
        style={styles.bottomFade}
      />

      <TopBar
        overlay
        title="Studio"
        left={
          <Pill
            label="Contoh"
            onPress={() => {
              setPersonPhotoUri(SAMPLE_PERSON_URI);
              setGarmentPreset(null);
              setGarmentPhotoUri(SAMPLE_GARMENT_URI);
            }}
          />
        }
        right={
          <Pill
            label={personPhotoUri ? 'Ganti' : 'Foto'}
            icon={Camera}
            onPress={() => pickImage('person')}
          />
        }
      />

      {garmentPhotoUri ? (
        <View style={styles.garmentTag}>
          <Image source={{ uri: garmentPhotoUri }} style={styles.garmentTagImage} />
          <Pressable
            hitSlop={10}
            onPress={clearGarment}
            style={styles.tagRemove}
            accessibilityLabel="Hapus kaos"
          >
            <X size={11} strokeWidth={3} color={theme.colors.onInk} />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.bottomPanel, { paddingBottom: dockSpace }]}>
        <Text style={styles.panelLabel}>Pilih kaos</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          <Pressable
            onPress={() => pickImage('garment')}
            style={[styles.tile, galleryGarmentSelected && styles.tileSelected]}
          >
            {galleryGarmentSelected && garmentPhotoUri ? (
              <Image source={{ uri: garmentPhotoUri }} style={styles.tileImage} />
            ) : (
              <>
                <ImagePlus size={24} strokeWidth={1.8} color={theme.colors.inkSoft} />
                <Text style={styles.tileText}>Galeri</Text>
              </>
            )}
          </Pressable>

          {garments.map((g) => {
            const selected = garmentPreset?.id === g.id;
            return (
              <Pressable
                key={g.id}
                onPress={() => selectClosetGarment(g)}
                style={[styles.tile, selected && styles.tileSelected]}
              >
                <Image source={{ uri: g.uri }} style={styles.tileImage} />
              </Pressable>
            );
          })}
        </ScrollView>

        <Pill
          variant="primary"
          label="Lanjut ukuran"
          disabled={!canProceed}
          style={styles.primary}
          onPress={() => {
            if (personPhotoUri && garmentPhotoUri) {
              navigation.navigate('SizeInput', {
                personPhotoUri,
                garmentPhotoUri,
                garmentPreset: garmentPreset ?? undefined,
              });
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.stage,
  },
  stageImage: {
    ...StyleSheet.absoluteFill,
  },
  emptyStage: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 220,
  },
  emptyTitle: {
    fontFamily: theme.font,
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.ink,
    marginTop: 8,
  },
  emptySub: {
    fontFamily: theme.font,
    fontSize: 14,
    color: theme.colors.muted,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 380,
  },
  garmentTag: {
    position: 'absolute',
    top: '30%',
    left: '16%',
    padding: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    ...theme.shadow,
  },
  garmentTagImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  tagRemove: {
    position: 'absolute',
    top: -7,
    left: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.danger,
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 12,
  },
  panelLabel: {
    fontFamily: theme.font,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.inkSoft,
    paddingHorizontal: 20,
  },
  carousel: {
    gap: 10,
    paddingHorizontal: 16,
  },
  tile: {
    width: 92,
    height: 104,
    borderRadius: theme.radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
    backgroundColor: theme.colors.glass,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tileSelected: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.card,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileText: {
    fontFamily: theme.font,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.inkSoft,
  },
  primary: {
    marginHorizontal: 16,
  },
});
