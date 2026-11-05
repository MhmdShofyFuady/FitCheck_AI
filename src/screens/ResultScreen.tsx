import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TryOnStackParamList } from '../navigation/types';
import { FitLabel, StretchType } from '../utils/estimator';
import { theme } from '../theme';

type Props = NativeStackScreenProps<TryOnStackParamList, 'Result'>;

const FIT_VERDICT: Record<
  FitLabel,
  { title: string; subtitle: string; tag: string }
> = {
  snug: {
    title: 'Snug Fit (Ketat)',
    subtitle: 'Kaos menempel mengikuti lekuk dada dengan ruang minimal.',
    tag: 'Body Fit',
  },
  regular: {
    title: 'Regular Fit (Pas Ideal)',
    subtitle: 'Kelonggaran dada seimbang dan nyaman untuk bergerak harian.',
    tag: 'Ideal',
  },
  loose: {
    title: 'Loose Fit (Oversized)',
    subtitle: 'Ruang ekstra lega di area dada dengan siluet santai.',
    tag: 'Relaxed',
  },
};

const STRETCH_BADGE: Record<StretchType, string> = {
  kaku: 'Kaku',
  sedikit_stretch: 'Semi',
  stretch: 'Stretch',
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

export default function ResultScreen({ route, navigation }: Props) {
  const {
    personPhotoUri,
    garmentPhotoUri,
    body,
    garment,
    fitResult,
    resultImageUri,
    jobId,
  } = route.params;

  const verdict = FIT_VERDICT[fitResult.fit_label];
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const adjustZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    });
  };

  const activeImageUri = resultImageUri ?? personPhotoUri;
  const zoomPercent = `${Math.round(zoom * 100)}%`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{verdict.title}</Text>
      <Text style={styles.subheading}>{verdict.subtitle}</Text>

      <View style={styles.specTable}>
        <View style={styles.specRow}>
          <Text style={styles.specName}>Kelonggaran Dada</Text>
          <Text style={styles.specMeta}>2x Lebar - Dada</Text>
          <Text style={styles.specVal}>{fitResult.chest_ease_cm} cm</Text>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText} numberOfLines={1}>
              {verdict.tag}
            </Text>
          </View>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specName}>Lingkar Kaos</Text>
          <Text style={styles.specMeta}>Datar {garment.chest_width} cm</Text>
          <Text style={styles.specVal}>{2 * garment.chest_width} cm</Text>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText} numberOfLines={1}>
              {STRETCH_BADGE[garment.stretch_type]}
            </Text>
          </View>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specName}>Lingkar Dada Anda</Text>
          <Text style={styles.specMeta}>Ukuran profil</Text>
          <Text style={styles.specVal}>{body.chest} cm</Text>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText} numberOfLines={1}>
              Tubuh
            </Text>
          </View>
        </View>
      </View>

      {fitResult.warnings.length > 0 && (
        <View style={styles.noteBox}>
          {fitResult.warnings.map((w) => (
            <Text key={w} style={styles.noteText}>
              Catatan proporsi: {w}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.tryOnHeaderBlock}>
        <View style={styles.tryOnTitleRow}>
          <Text style={styles.zoomLabel}>
            {resultImageUri
              ? 'Hasil AI Try-On'
              : jobId
                ? 'Pratinjau Try-On'
                : 'Pratinjau Mode Demo'}
          </Text>
          <TouchableOpacity
            style={styles.fullscreenPill}
            onPress={() => setFullscreen(true)}
          >
            <Text style={styles.fullscreenPillText}>Layar Penuh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.zoomToolbar}>
          <Text style={styles.zoomHintLabel}>Kontrol Skala Gambar</Text>
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.resetPill}
              onPress={() => setZoom(1)}
            >
              <Text style={styles.resetPillText}>1:1</Text>
            </TouchableOpacity>

            <View style={styles.stepperPill}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustZoom(-ZOOM_STEP)}
              >
                <Text style={styles.stepBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepVal}>{zoomPercent}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustZoom(ZOOM_STEP)}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.stageFrame}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.stageScrollContent}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          maximumZoomScale={MAX_ZOOM}
          minimumZoomScale={MIN_ZOOM}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setFullscreen(true)}
            style={styles.stageImageWrap}
          >
            <Image
              source={{ uri: activeImageUri }}
              style={[
                styles.stageImage,
                { transform: [{ scale: zoom }] },
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.garmentThumbCard}>
          <Image
            source={{ uri: garmentPhotoUri }}
            style={styles.garmentThumb}
          />
          <Text style={styles.garmentThumbText}>Kaos</Text>
        </View>
      </View>

      <View style={styles.hintBox}>
        <Text style={styles.hintText}>
          Gunakan tombol - dan + untuk zoom out (50%) hingga zoom in (250%), atau ketuk gambar untuk mode layar penuh.
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={styles.progressBarActive} />
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backLinkText}>Ubah Ukuran</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextPill}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.nextPillText}>Coba Kaos Lain</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={fullscreen}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalTopBar}>
            <View style={styles.stepperPill}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustZoom(-ZOOM_STEP)}
              >
                <Text style={styles.stepBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepVal}>{zoomPercent}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustZoom(ZOOM_STEP)}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalResetBtn}
              onPress={() => setZoom(1)}
            >
              <Text style={styles.modalResetText}>Reset 100%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalClosePill}
              onPress={() => setFullscreen(false)}
            >
              <Text style={styles.modalCloseText}>Tutup</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalCanvas}
            maximumZoomScale={MAX_ZOOM}
            minimumZoomScale={MIN_ZOOM}
            centerContent
          >
            <Image
              source={{ uri: activeImageUri }}
              style={[
                styles.modalImage,
                { transform: [{ scale: zoom }] },
              ]}
              resizeMode="contain"
            />
          </ScrollView>
        </View>
      </Modal>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  specName: {
    flex: 1.25,
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.ink,
    lineHeight: 20,
  },
  specMeta: {
    flex: 1,
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 18,
  },
  specVal: {
    width: 68,
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.ink,
    textAlign: 'right',
    marginRight: 12,
  },
  pillBadge: {
    width: 86,
    height: 32,
    backgroundColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  pillBadgeText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.paper,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  noteBox: {
    backgroundColor: theme.colors.amberBg,
    borderRadius: theme.radius.input,
    padding: 13,
    marginBottom: 18,
  },
  noteText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.amberInk,
    lineHeight: 19,
  },
  tryOnHeaderBlock: {
    marginTop: 6,
    marginBottom: 16,
    gap: 12,
  },
  tryOnTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoomLabel: {
    fontFamily: theme.fonts.display,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.ink,
    letterSpacing: 0.2,
  },
  fullscreenPill: {
    borderWidth: 1.2,
    borderColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  fullscreenPillText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.cobalt,
  },
  zoomToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.sand,
    borderRadius: theme.radius.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  zoomHintLabel: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.muted,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetPill: {
    borderWidth: 1.2,
    borderColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: theme.colors.cream,
  },
  resetPillText: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.cobalt,
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    minWidth: 104,
    justifyContent: 'space-between',
  },
  stepBtn: {
    paddingHorizontal: 6,
  },
  stepBtnText: {
    fontFamily: theme.fonts.mono,
    color: theme.colors.paper,
    fontSize: 16,
    fontWeight: '600',
  },
  stepVal: {
    fontFamily: theme.fonts.mono,
    color: theme.colors.paper,
    fontSize: 12,
    fontWeight: '600',
  },
  stageFrame: {
    height: 360,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.sand,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
  },
  stageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '100%',
  },
  stageImageWrap: {
    width: 320,
    height: 360,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageImage: {
    width: 300,
    height: 340,
  },
  garmentThumbCard: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: theme.colors.paper,
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  garmentThumb: {
    width: 58,
    height: 58,
    borderRadius: 8,
  },
  garmentThumbText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.ink,
    marginTop: 4,
  },
  hintBox: {
    backgroundColor: theme.colors.sand,
    borderRadius: theme.radius.input,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 22,
  },
  hintText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 18,
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
    fontWeight: '700',
    color: theme.colors.ink,
  },
  nextPill: {
    backgroundColor: theme.colors.cobalt,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  nextPillText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.paper,
    fontSize: 14,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
  },
  modalResetBtn: {
    borderWidth: 1.2,
    borderColor: theme.colors.paper,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  modalResetText: {
    fontFamily: theme.fonts.mono,
    color: theme.colors.paper,
    fontSize: 12,
    fontWeight: '700',
  },
  modalClosePill: {
    backgroundColor: theme.colors.paper,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  modalCloseText: {
    fontFamily: theme.fonts.sans,
    color: theme.colors.cobalt,
    fontSize: 12,
    fontWeight: '800',
  },
  modalCanvas: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalImage: {
    width: 340,
    height: 460,
  },
});
