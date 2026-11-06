import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  ChevronDown,
  EllipsisVertical,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TryOnStackParamList } from '../navigation/types';
import { FitLabel, StretchType } from '../utils/estimator';
import { CircleButton, Pill, TopBar } from '../components/ui';
import { theme } from '../theme';

type Props = NativeStackScreenProps<TryOnStackParamList, 'Result'>;

const FIT_VERDICT: Record<
  FitLabel,
  { title: string; subtitle: string; tag: string }
> = {
  snug: {
    title: 'Snug Fit (Ketat)',
    subtitle: 'Kaos menempel mengikuti lekuk dada dengan ruang minimal.',
    tag: 'Snug Fit',
  },
  regular: {
    title: 'Regular Fit (Pas Ideal)',
    subtitle: 'Kelonggaran dada seimbang dan nyaman untuk bergerak harian.',
    tag: 'Regular Fit',
  },
  loose: {
    title: 'Loose Fit (Oversized)',
    subtitle: 'Ruang ekstra lega di area dada dengan siluet santai.',
    tag: 'Loose Fit',
  },
};

const STRETCH_BADGE: Record<StretchType, string> = {
  kaku: 'Kaku',
  sedikit_stretch: 'Semi Stretch',
  stretch: 'Stretch',
};

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2];

export default function ResultScreen({ route, navigation }: Props) {
  const {
    personPhotoUri,
    garmentPhotoUri,
    body,
    garment,
    fitResult,
    resultImageUri,
  } = route.params;

  const insets = useSafeAreaInsets();
  const verdict = FIT_VERDICT[fitResult.fit_label];

  const primaryUri = resultImageUri ?? personPhotoUri;
  const [selectedSlot, setSelectedSlot] = useState<'result' | 'person' | 'garment'>('result');
  const [zoomIndex, setZoomIndex] = useState(1);
  const [showFitSheet, setShowFitSheet] = useState(false);

  const zoom = ZOOM_STEPS[zoomIndex] ?? 1;
  const activeImageUri =
    selectedSlot === 'result'
      ? primaryUri
      : selectedSlot === 'person'
        ? personPhotoUri
        : garmentPhotoUri;

  const cycleZoom = () => {
    setZoomIndex((prev) => (prev + 1) % ZOOM_STEPS.length);
  };

  const easePrefix = fitResult.chest_ease_cm >= 0 ? '+' : '';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.stageScroll}
        maximumZoomScale={2.5}
        minimumZoomScale={0.5}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        centerContent
      >
        <Image
          source={{ uri: activeImageUri }}
          style={[styles.stageImage, { transform: [{ scale: zoom }] }]}
          resizeMode="cover"
        />
      </ScrollView>

      <LinearGradient
        colors={['rgba(218, 218, 220, 0)', theme.colors.stage]}
        locations={[0, 0.58]}
        pointerEvents="none"
        style={styles.bottomFade}
      />

      <TopBar
        overlay
        title="Model"
        left={
          <CircleButton
            icon={ArrowLeft}
            accessibilityLabel="Kembali"
            onPress={() => navigation.goBack()}
          />
        }
        right={
          <CircleButton
            icon={EllipsisVertical}
            accessibilityLabel="Detail Ukuran"
            onPress={() => setShowFitSheet(true)}
          />
        }
      />

      <View style={styles.garmentPinLeft}>
        <Image source={{ uri: garmentPhotoUri }} style={styles.pinThumb} />
        <Pressable
          hitSlop={10}
          onPress={() => navigation.popToTop()}
          style={styles.pinRemove}
          accessibilityLabel="Ganti kaos"
        >
          <X size={11} strokeWidth={3} color={theme.colors.onInk} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => setShowFitSheet(true)}
        style={styles.fitPinRight}
      >
        <Text style={styles.fitPinVal}>
          {easePrefix}
          {fitResult.chest_ease_cm} cm
        </Text>
        <Text style={styles.fitPinSub}>{verdict.tag}</Text>
      </Pressable>

      <View
        style={[
          styles.bottomPanel,
          { paddingBottom: Math.max(insets.bottom + 10, 22) },
        ]}
      >
        <View style={styles.controlsRow}>
          <Pill
            label={`${verdict.tag} · ${easePrefix}${fitResult.chest_ease_cm} cm`}
            icon={SlidersHorizontal}
            onPress={() => setShowFitSheet(true)}
          />
          <Pill
            label={`Skala ${Math.round(zoom * 100)}%`}
            icon={ChevronDown}
            onPress={cycleZoom}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {[
            { key: 'result' as const, uri: primaryUri, label: 'Hasil AI' },
            { key: 'person' as const, uri: personPhotoUri, label: 'Tubuh' },
            { key: 'garment' as const, uri: garmentPhotoUri, label: 'Kaos' },
          ].map((slot) => {
            const active = selectedSlot === slot.key;
            return (
              <Pressable
                key={slot.key}
                onPress={() => setSelectedSlot(slot.key)}
                style={[styles.tile, active && styles.tileSelected]}
              >
                <Image
                  source={{ uri: slot.uri }}
                  style={[styles.tileImage, !active && styles.tileImageMuted]}
                  resizeMode="cover"
                />
              </Pressable>
            );
          })}
        </ScrollView>

        <Pill
          variant="primary"
          label="Simpan ke koleksi"
          style={styles.saveCollectionBtn}
          onPress={() => {
            Alert.alert(
              'Tersimpan di Lemari',
              'Hasil try-on dan spesifikasi kaos telah tersimpan di tab Lemari.',
              [
                {
                  text: 'Coba Kaos Lain',
                  onPress: () => navigation.popToTop(),
                },
                { text: 'Tutup', style: 'cancel' },
              ]
            );
          }}
        />
      </View>

      <Modal
        visible={showFitSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFitSheet(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setShowFitSheet(false)}
        >
          <Pressable style={styles.sheetCard} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>{verdict.title}</Text>
                <Text style={styles.sheetSubtitle}>{verdict.subtitle}</Text>
              </View>
              <CircleButton
                icon={X}
                accessibilityLabel="Tutup"
                onPress={() => setShowFitSheet(false)}
              />
            </View>

            <View style={styles.sheetWell}>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Kelonggaran Dada</Text>
                <Text style={styles.sheetMeta}>2x Lebar − Dada</Text>
                <Text style={styles.sheetVal}>
                  {easePrefix}
                  {fitResult.chest_ease_cm} cm
                </Text>
              </View>
              <View style={styles.hairline} />
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Lingkar Kaos</Text>
                <Text style={styles.sheetMeta}>
                  Datar {garment.chest_width} cm · {STRETCH_BADGE[garment.stretch_type]}
                </Text>
                <Text style={styles.sheetVal}>{2 * garment.chest_width} cm</Text>
              </View>
              <View style={styles.hairline} />
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Lingkar Dada Anda</Text>
                <Text style={styles.sheetMeta}>Ukuran profil</Text>
                <Text style={styles.sheetVal}>{body.chest} cm</Text>
              </View>
            </View>

            {fitResult.warnings.length > 0 ? (
              <View style={styles.warningBox}>
                {fitResult.warnings.map((w) => (
                  <Text key={w} style={styles.warningText}>
                    Catatan proporsi: {w}
                  </Text>
                ))}
              </View>
            ) : null}

            <View style={styles.sheetActions}>
              <Pill
                variant="chip"
                label="Ubah ukuran"
                onPress={() => {
                  setShowFitSheet(false);
                  navigation.goBack();
                }}
                style={styles.sheetBtn}
              />
              <Pill
                variant="primary"
                label="Coba kaos lain"
                onPress={() => {
                  setShowFitSheet(false);
                  navigation.popToTop();
                }}
                style={styles.sheetBtn}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.stage,
  },
  stageScroll: {
    flexGrow: 1,
  },
  stageImage: {
    width: '100%',
    height: '100%',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 360,
  },
  garmentPinLeft: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    padding: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    ...theme.shadow,
  },
  pinThumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  pinRemove: {
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
  fitPinRight: {
    position: 'absolute',
    top: '50%',
    right: '12%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    ...theme.shadow,
  },
  fitPinVal: {
    fontFamily: theme.font,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.ink,
    fontVariant: ['tabular-nums'],
  },
  fitPinSub: {
    fontFamily: theme.font,
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.muted,
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  carousel: {
    gap: 10,
    paddingHorizontal: 16,
  },
  tile: {
    width: 104,
    height: 112,
    borderRadius: theme.radius.tile,
    overflow: 'hidden',
    backgroundColor: theme.colors.glass,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  tileSelected: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.card,
    ...theme.shadow,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileImageMuted: {
    opacity: 0.65,
  },
  saveCollectionBtn: {
    marginHorizontal: 16,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 34,
    gap: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  sheetTitle: {
    fontFamily: theme.font,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.ink,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontFamily: theme.font,
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 3,
    maxWidth: 260,
  },
  sheetWell: {
    backgroundColor: theme.colors.well,
    borderRadius: theme.radius.tile,
    overflow: 'hidden',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  hairline: {
    height: 1,
    backgroundColor: theme.colors.hairline,
    marginHorizontal: 14,
  },
  sheetLabel: {
    flex: 1.2,
    fontFamily: theme.font,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.ink,
  },
  sheetMeta: {
    flex: 1.2,
    fontFamily: theme.font,
    fontSize: 12,
    color: theme.colors.muted,
  },
  sheetVal: {
    fontFamily: theme.font,
    fontVariant: ['tabular-nums'],
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  warningBox: {
    backgroundColor: theme.colors.warningBg,
    borderRadius: 14,
    padding: 12,
  },
  warningText: {
    fontFamily: theme.font,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.warningInk,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetBtn: {
    flex: 1,
  },
});
