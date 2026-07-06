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

import { SHOW_COVER_IMAGES, DATA_SOURCE_NAME, DATA_SOURCE_URL } from '../../src/config';
import { getCachedWork } from '../../src/lib/store';
import { classifyChannel, channelsToServices, primeWatchUrl } from '../../src/lib/services';
import { summarizeSchedule, scheduleHeadline } from '../../src/lib/schedule';
import { isFavorite, toggleFavorite } from '../../src/lib/favorites';
import { colors, radius, space, type } from '../../src/theme';
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
      .map((ms, i) => ({ ep: i + 1, at: new Date(ms).toISOString(), past: ms <= Date.now() }));
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

  const initial = work.title.trim().charAt(0) || '?';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: work.title }} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.header}>
          {SHOW_COVER_IMAGES && (work.image?.recommendedImageUrl || work.image?.facebookOgImageUrl) ? (
            <Image
              source={{ uri: work.image.recommendedImageUrl || work.image.facebookOgImageUrl! }}
              style={styles.cover}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cover, styles.coverMono]}>
              <Text style={styles.coverInitial}>{initial}</Text>
            </View>
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
          {services.map((s) => {
            const isPrime = s.id === 'prime';
            return (
              <Pressable
                key={s.id}
                style={[styles.watchBtn, isPrime ? styles.watchPrimary : styles.watchSecondary]}
                onPress={() => onWatch(s)}
              >
                <Text style={[styles.watchText, !isPrime && styles.watchTextSecondary]}>
                  ▶ {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>
          配信スケジュール{activeSvc ? `（${activeSvc.label}）` : ''}
        </Text>
        {episodes.length === 0 ? (
          <Text style={styles.notice}>配信日情報がありません。</Text>
        ) : (
          <View style={styles.epCard}>
            {episodes.map((e, i) => (
              <View key={e.ep} style={[styles.epRow, i === episodes.length - 1 && styles.epRowLast]}>
                <Text style={[styles.epNum, !e.past && styles.epNumFuture]}>第{e.ep}話</Text>
                <Text style={[styles.epDate, !e.past && styles.epDateFuture]}>
                  {fmtDate(e.at)}
                  {!e.past ? '  ・次回' : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>出典・権利表記</Text>
        <View style={styles.creditCard}>
          {work.image?.copyright ? (
            <Text style={styles.copyright}>© {work.image.copyright}</Text>
          ) : (
            <Text style={styles.creditText}>
              作品情報・画像の著作権は各製作委員会・権利者に帰属します。
            </Text>
          )}
          {work.officialSiteUrl ? (
            <Pressable
              style={styles.creditLink}
              onPress={() => Linking.openURL(work.officialSiteUrl as string)}
            >
              <Text style={styles.creditLinkText}>公式サイト ↗</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.creditLink}
            onPress={() => Linking.openURL(DATA_SOURCE_URL)}
          >
            <Text style={styles.creditLinkText}>データ提供: {DATA_SOURCE_NAME} ↗</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, backgroundColor: colors.canvas },
  body: { padding: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row' },
  cover: { width: 96, height: 132, borderRadius: radius.lg, backgroundColor: colors.surface3 },
  coverMono: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  coverInitial: { ...type.display, fontSize: 40, color: colors.inkSubtle },
  headerBody: { flex: 1, marginLeft: space.md },
  title: { ...type.headline },
  schedule: { marginTop: 6, fontSize: 14, fontWeight: '700', color: colors.primaryHover, letterSpacing: -0.2 },
  favBtn: {
    marginTop: space.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface1,
  },
  favBtnOn: { backgroundColor: colors.surface2, borderColor: colors.primary },
  favText: { ...type.button, color: colors.inkMuted },
  favTextOn: { color: colors.primaryHover },
  sectionTitle: { ...type.eyebrow, marginTop: space.lg, marginBottom: space.sm },
  watchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  watchBtn: {
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: space.xs,
    marginBottom: space.xs,
  },
  watchPrimary: { backgroundColor: colors.primary },
  watchSecondary: { backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.hairline },
  watchText: { ...type.button, color: colors.onPrimary },
  watchTextSecondary: { color: colors.ink },
  epCard: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: space.md,
  },
  epRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  epRowLast: { borderBottomWidth: 0 },
  epNum: { ...type.body, color: colors.inkMuted, fontWeight: '600' },
  epNumFuture: { color: colors.ink },
  epDate: { ...type.bodySm, color: colors.inkSubtle },
  epDateFuture: { color: colors.primaryHover, fontWeight: '600' },
  notice: { ...type.body, color: colors.inkSubtle, lineHeight: 22 },
  creditCard: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.md,
    gap: space.sm,
  },
  copyright: { ...type.caption, color: colors.inkMuted, lineHeight: 18 },
  creditText: { ...type.caption, color: colors.inkMuted, lineHeight: 18 },
  creditLink: { paddingTop: 2 },
  creditLinkText: { ...type.caption, color: colors.primaryHover, fontWeight: '600' },
});
