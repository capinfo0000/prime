import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCachedWork } from '../../src/lib/store';
import { classifyChannel, channelsToServices, primeWatchUrl } from '../../src/lib/services';
import { summarizeSchedule, scheduleHeadline } from '../../src/lib/schedule';
import { isFavorite, toggleFavorite } from '../../src/lib/favorites';
import type { StreamingService } from '../../src/types';

const WD = ['日', '月', '火', '水', '木', '金', '土'];

function fmtDate(iso: string): string {
  const j = new Date(Date.parse(iso) + 9 * 3600 * 1000);
  return `${j.getUTCMonth() + 1}/${j.getUTCDate()}(${WD[j.getUTCDay()]})`;
}

export default function WorkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const work = id ? getCachedWork(id) : undefined;
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (id) isFavorite(id).then(setFav);
  }, [id]);

  const services = useMemo<StreamingService[]>(
    () => (work ? channelsToServices((work.programs?.nodes ?? []).map((p) => p.channel?.name)) : []),
    [work],
  );

  const primeSvc = services.find((s) => s.id === 'prime');
  const activeSvc = primeSvc ?? services[0];

  const episodes = useMemo(() => {
    if (!work || !activeSvc) return [];
    return (work.programs?.nodes ?? [])
      .filter((p) => classifyChannel(p.channel?.name).id === activeSvc.id && p.startedAt)
      .map((p) => Date.parse(p.startedAt as string))
      .sort((a, b) => a - b)
      .map((ms, i) => ({ ep: i + 1, at: new Date(ms).toISOString() }));
  }, [work, activeSvc]);

  const schedule = useMemo(
    () =>
      work && activeSvc
        ? summarizeSchedule(
            (work.programs?.nodes ?? []).filter(
              (p) => classifyChannel(p.channel?.name).id === activeSvc.id,
            ),
          )
        : null,
    [work, activeSvc],
  );

  if (!work) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <Text style={styles.notice}>作品が見つかりませんでした。一覧から開き直してください。</Text>
      </SafeAreaView>
    );
  }

  const onToggleFav = async () => {
    if (!id) return;
    setFav(await toggleFavorite(id));
  };

  const onWatch = async (svc: StreamingService) => {
    const url = svc.id === 'prime' ? primeWatchUrl(work.title) : null;
    if (!url) {
      Alert.alert('未対応', `${svc.label} への直接リンクは未対応です`);
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: work.title }} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.header}>
          {work.image?.recommendedImageUrl ? (
            <Image source={{ uri: work.image.recommendedImageUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]} />
          )}
          <View style={styles.headerBody}>
            <Text style={styles.title}>{work.title}</Text>
            {schedule && <Text style={styles.schedule}>{scheduleHeadline(schedule)}</Text>}
            <Pressable style={[styles.favBtn, fav && styles.favBtnOn]} onPress={onToggleFav}>
              <Text style={[styles.favText, fav && styles.favTextOn]}>
                {fav ? '★ お気に入り登録済み' : '☆ お気に入りに追加'}
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>視聴</Text>
        <View style={styles.watchRow}>
          {services.map((s) => (
            <Pressable key={s.id} style={styles.watchBtn} onPress={() => onWatch(s)}>
              <Text style={styles.watchText}>▶ {s.label}で見る</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          配信スケジュール{activeSvc ? `（${activeSvc.label}）` : ''}
        </Text>
        {episodes.length === 0 ? (
          <Text style={styles.notice}>配信日情報がありません。</Text>
        ) : (
          episodes.map((e) => (
            <View key={e.ep} style={styles.epRow}>
              <Text style={styles.epNum}>第{e.ep}話</Text>
              <Text style={styles.epDate}>{fmtDate(e.at)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  body: { padding: 16 },
  header: { flexDirection: 'row' },
  cover: { width: 110, height: 150, borderRadius: 10, backgroundColor: '#e5e7eb' },
  coverPlaceholder: {},
  headerBody: { flex: 1, marginLeft: 14 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  schedule: { marginTop: 6, fontSize: 14, color: '#2563eb', fontWeight: '700' },
  favBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  favBtnOn: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
  favText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  favTextOn: { color: '#b45309' },
  sectionTitle: { marginTop: 24, marginBottom: 10, fontSize: 15, fontWeight: '800', color: '#111827' },
  watchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  watchBtn: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  watchText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  epRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  epNum: { fontSize: 14, color: '#111827', fontWeight: '600' },
  epDate: { fontSize: 14, color: '#6b7280' },
  notice: { color: '#6b7280', lineHeight: 22 },
});
