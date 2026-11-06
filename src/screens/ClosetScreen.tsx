import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Heart, Plus, RotateCw, X } from 'lucide-react-native';
import { MainTabParamList } from '../navigation/types';
import { ClosetGarment, useCloset } from '../hooks/useCloset';
import { StretchType } from '../utils/estimator';
import { CircleButton, Pill, SegmentedControl, TopBar, useDockSpace } from '../components/ui';
import { theme } from '../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'ClosetTab'>;
type Segment = 'garments' | 'results';
type Filter = 'favorite' | 'all' | StretchType;

const FAVORITES_KEY = '@closet_favorites';

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'Favorit', value: 'favorite' },
  { label: 'Semua', value: 'all' },
  { label: 'Kaku', value: 'kaku' },
  { label: 'Semi Stretch', value: 'sedikit_stretch' },
  { label: 'Stretch', value: 'stretch' },
];

export default function ClosetScreen({ navigation }: Props) {
  const { enabled, garments, results, loading, refresh } = useCloset();
  const dockSpace = useDockSpace();
  const [segment, setSegment] = useState<Segment>('garments');
  const [filter, setFilter] = useState<Filter>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY)
      .then((raw) => raw && setFavorites(JSON.parse(raw)))
      .catch(() => {});
  }, []);

  const toggleFavorite = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const visibleGarments = useMemo(() => {
    if (filter === 'all') return garments;
    if (filter === 'favorite') return garments.filter((g) => favorites.includes(g.id));
    return garments.filter((g) => g.stretch_type === filter);
  }, [garments, favorites, filter]);

  const openInStudio = (garment: ClosetGarment) => {
    navigation.navigate('TryOnTab', { screen: 'PhotoUpload', params: { garment } });
  };

  const goUpload = () => navigation.navigate('TryOnTab', { screen: 'PhotoUpload' });

  const header = (
    <View style={styles.listHeader}>
      <SegmentedControl
        options={[
          { label: 'Kaos', value: 'garments' },
          { label: 'Hasil', value: 'results' },
        ]}
        value={segment}
        onChange={setSegment}
      />
      {segment === 'garments' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {FILTERS.map((f) => (
            <Pill
              key={f.value}
              label={f.label}
              variant={filter === f.value ? 'chipActive' : 'chip'}
              onPress={() => setFilter(f.value)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  const emptyText = !enabled
    ? 'Lemari tersimpan di akun Supabase. Masuk dengan akun untuk melihat kaos dan hasil try-on kamu.'
    : segment === 'results'
      ? 'Belum ada hasil try-on. Hasil AI akan muncul di sini setelah diproses.'
      : filter === 'all'
        ? 'Belum ada kaos tersimpan. Kaos yang kamu coba akan masuk ke lemari ini.'
        : 'Tidak ada kaos untuk filter ini.';

  return (
    <View style={styles.screen}>
      <TopBar
        title="Lemari"
        left={<Pill label="Segarkan" icon={RotateCw} onPress={refresh} disabled={!enabled} />}
        right={<Pill label="Unggah" icon={Plus} onPress={goUpload} />}
      />

      <FlatList<ClosetGarment | { id: string; uri: string }>
        data={segment === 'garments' ? visibleGarments : results}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.list, { paddingBottom: dockSpace }]}
        refreshControl={
          enabled ? <RefreshControl refreshing={loading} onRefresh={refresh} /> : undefined
        }
        ListEmptyComponent={
          loading ? undefined : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{emptyText}</Text>
              {enabled && segment === 'garments' && filter === 'all' ? (
                <Pill label="Coba kaos pertama" variant="chipActive" onPress={goUpload} />
              ) : null}
            </View>
          )
        }
        renderItem={({ item }) => {
          const garment = segment === 'garments' ? (item as ClosetGarment) : null;
          const isFav = garment ? favorites.includes(garment.id) : false;

          return (
            <Pressable
              onPress={() => (garment ? openInStudio(garment) : setPreview(item.uri))}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <View style={styles.well}>
                <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />
                {garment ? (
                  <>
                    <Pressable
                      hitSlop={10}
                      onPress={() => toggleFavorite(garment.id)}
                      style={styles.heart}
                      accessibilityLabel={isFav ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                    >
                      <Heart
                        size={22}
                        strokeWidth={1.8}
                        color={isFav ? theme.colors.heart : theme.colors.faint}
                        fill={isFav ? theme.colors.heart : theme.colors.glassStrong}
                      />
                    </Pressable>
                    <View style={styles.sizeTag}>
                      <Text style={styles.sizeTagText}>
                        {Number(garment.chest_width_cm)} cm
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />

      <Modal
        visible={preview !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.previewBackdrop}>
          {preview ? (
            <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="contain" />
          ) : null}
          <View style={styles.previewClose}>
            <CircleButton icon={X} accessibilityLabel="Tutup" onPress={() => setPreview(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  list: {
    paddingHorizontal: 16,
  },
  listHeader: {
    gap: 14,
    paddingTop: 4,
    paddingBottom: 16,
  },
  chipRow: {
    gap: 8,
  },
  column: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    maxWidth: '50%',
    padding: 5,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.card,
    ...theme.shadow,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
  },
  well: {
    aspectRatio: 0.8,
    borderRadius: theme.radius.tile,
    overflow: 'hidden',
    backgroundColor: theme.colors.well,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  sizeTag: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.glassStrong,
  },
  sizeTagText: {
    fontFamily: theme.font,
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.ink,
    fontVariant: ['tabular-nums'],
  },
  empty: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: theme.font,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.backdrop,
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
  previewClose: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
});

