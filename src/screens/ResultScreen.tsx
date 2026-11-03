import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TryOnStackParamList } from '../navigation/types';
import { FitLabel } from '../utils/estimator';

type Props = NativeStackScreenProps<TryOnStackParamList, 'Result'>;

const FIT_BADGE_CONFIG: Record<
  FitLabel,
  { title: string; subtitle: string; bg: string; text: string }
> = {
  snug: {
    title: 'SNUG (Ketat / Body Fit)',
    subtitle: 'Kaos menempel mengikuti lekuk dada.',
    bg: '#FEF3C7',
    text: '#B45309',
  },
  regular: {
    title: 'REGULAR (Pas Ideal)',
    subtitle: 'Kelonggaran dada proporsional dan nyaman untuk harian.',
    bg: '#DCFCE7',
    text: '#15803D',
  },
  loose: {
    title: 'LOOSE (Longgar / Oversized)',
    subtitle: 'Ruang ekstra lega di area dada.',
    bg: '#DBEAFE',
    text: '#1D4ED8',
  },
};

export default function ResultScreen({ route, navigation }: Props) {
  const { personPhotoUri, garmentPhotoUri, body, garment, fitResult, jobId } =
    route.params;
  const badge = FIT_BADGE_CONFIG[fitResult.fit_label];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.badgeCard, { backgroundColor: badge.bg }]}>
        <Text style={styles.badgeCaption}>ESTIMASI UKURAN & FIT</Text>
        <Text style={[styles.badgeTitle, { color: badge.text }]}>{badge.title}</Text>
        <Text style={styles.badgeSubtitle}>{badge.subtitle}</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Chest Ease</Text>
            <Text style={styles.metricValue}>{fitResult.chest_ease_cm} cm</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Lingkar Kaos</Text>
            <Text style={styles.metricValue}>{2 * garment.chest_width} cm</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Lingkar Dada</Text>
            <Text style={styles.metricValue}>{body.chest} cm</Text>
          </View>
        </View>
      </View>

      {fitResult.warnings.length > 0 && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Catatan Area Sekunder:</Text>
          {fitResult.warnings.map((w) => (
            <Text key={w} style={styles.warningItem}>
              • {w}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.tryOnCard}>
        <Text style={styles.sectionTitle}>Simulasi AI Virtual Try-On (Mock)</Text>
        <Text style={styles.sectionHint}>
          {jobId
            ? `Job ID: ${jobId} (diproses via Edge Function process-tryon)`
            : 'Pratinjau simulasi penggabungan foto tubuh & kaos'}
        </Text>

        <View style={styles.mockComposite}>
          <Image source={{ uri: personPhotoUri }} style={styles.resultMainImage} />
          <View style={styles.overlayGarmentBox}>
            <Image source={{ uri: garmentPhotoUri }} style={styles.overlayGarmentImage} />
            <Text style={styles.overlayTag}>Target Kaos</Text>
          </View>
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>
              Mock Hasil Try-On ({fitResult.fit_label.toUpperCase()})
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.popToTop()}
      >
        <Text style={styles.primaryBtnText}>Coba Kaos Lain</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  badgeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  badgeCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.8,
  },
  badgeTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  badgeSubtitle: {
    fontSize: 14,
    color: '#334155',
    marginTop: 4,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  warningCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A3412',
    marginBottom: 4,
  },
  warningItem: {
    fontSize: 14,
    color: '#C2410C',
    fontWeight: '600',
    marginTop: 2,
  },
  tryOnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  mockComposite: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  resultMainImage: {
    width: '100%',
    height: 320,
  },
  overlayGarmentBox: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  overlayGarmentImage: {
    width: 72,
    height: 72,
    borderRadius: 6,
  },
  overlayTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  mockBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  mockBannerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
