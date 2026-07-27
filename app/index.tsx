import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { hasAnnictToken, SHOW_COVER_IMAGES } from '../src/config';
import { loadSeasonWorks } from '../src/lib/store';
import { toWorkCards } from '../src/lib/workCard';
import { scheduleHeadline } from '../src/lib/schedule';
import { FILTERABLE_SERVICES } from '../src/lib/services';
import { getSeason, seasonLabelJa } from '../src/lib/season';
import { colors, radius, space, type } from '../src/theme';
import type { AnnictWork, StreamingServiceId, WorkCard } from '../src/types';

export default function HomeScreen() {
  const [works, setWorks] = useState<AnnictWork[]>([]);
  const [service, setService] = useState<StreamingServiceId>('prime');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    try {
      setError(null);
      setWorks(await loadSeasonWorks(force));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load(false);
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const cards: WorkCard[] = useMemo(
    () => toWorkCards(works, service, { mediaTypes: ['TV'] }),
    [works, service],
  );

  if (!hasAnnictToken) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <Text style={styles.notice}>
          Annict トークンが未設定です。{'\n'}.env に EXPO_PUBLIC_ANNICT_TOKEN を設定してください。
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/about" style={styles.infoBtn}>
              ⓘ
            </Link>
          ),
        }}
      />
      <ServiceFilter selected={service} onSelect={setService} />
      <View style={styles.headingRow}>
        <Text style={styles.eyebrow}>{seasonLabelJa(getSeason()).toUpperCase()}</Text>
        <Text style={styles.heading}>今期の新作アニメ</Text>
        {!loading && !error && (
          <Text style={styles.count}>{cards.length}作品</Text>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>読み込みエラー: {error}</Text>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.inkSubtle} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>このサービスで配信中の今期アニメは見つかりませんでした。</Text>
          }
          renderItem={({ item }) => <WorkRow card={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function ServiceFilter({
  selected,
  onSelect,
}: {
  selected: StreamingServiceId;
  onSelect: (id: StreamingServiceId) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {FILTERABLE_SERVICES.map((s) => {
        const active = s.id === selected;
        return (
          <Pressable
            key={s.id}
            onPress={() => onSelect(s.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function PosterTile({ card }: { card: WorkCard }) {
  if (SHOW_COVER_IMAGES && card.imageUrl) {
    return <Image source={{ uri: card.imageUrl }} style={styles.poster} resizeMode="cover" />;
  }
  // 画像を使わないタイトル主役デザイン: 頭文字モノグラム
  const initial = card.title.trim().charAt(0) || '?';
  return (
    <View style={[styles.poster, styles.posterMono]}>
      <Text style={styles.posterInitial}>{initial}</Text>
    </View>
  );
}

function WorkRow({ card }: { card: WorkCard }) {
  const next = card.schedule?.nextEpisode;
  return (
    <Link href={`/work/${card.id}`} asChild>
      <Pressable style={styles.row}>
        <PosterTile card={card} />
        <View style={styles.rowBody}>
          <Text style={styles.title} numberOfLines={2}>
            {card.title}
          </Text>
          <Text style={styles.schedule}>
            {card.schedule ? scheduleHeadline(card.schedule) : '配信情報なし'}
          </Text>
          <View style={styles.badges}>
            {card.services.map((s) => (
              <View key={s.id} style={styles.badge}>
                <Text style={styles.badgeText}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
        {next ? (
          <View style={styles.epTag}>
            <Text style={styles.epTagText}>#{next}</Text>
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, backgroundColor: colors.canvas },
  headingRow: { paddingHorizontal: space.md, paddingTop: space.xs, paddingBottom: space.sm },
  eyebrow: { ...type.eyebrow },
  heading: { ...type.display, marginTop: 2 },
  count: { ...type.caption, marginTop: 2 },
  filterRow: { paddingHorizontal: space.sm, paddingVertical: space.sm, gap: space.xs },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginRight: space.xs,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...type.button, color: colors.inkSubtle },
  chipTextActive: { color: colors.onPrimary },
  list: { padding: space.sm, paddingBottom: space.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.sm,
    marginBottom: space.sm,
  },
  poster: { width: 56, height: 76, borderRadius: radius.md, backgroundColor: colors.surface3 },
  posterMono: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  posterInitial: { ...type.headline, color: colors.inkSubtle },
  rowBody: { flex: 1, marginLeft: space.sm },
  title: { ...type.cardTitle },
  schedule: { marginTop: 4, fontSize: 13, fontWeight: '600', color: colors.primaryHover, letterSpacing: -0.1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.xs, gap: space.xxs },
  badge: {
    backgroundColor: colors.surface2,
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: space.xxs,
    marginTop: 2,
  },
  badgeText: { ...type.caption, color: colors.inkMuted },
  epTag: {
    marginLeft: space.xs,
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  epTagText: { ...type.caption, color: colors.inkMuted },
  empty: { ...type.body, color: colors.inkSubtle, textAlign: 'center', marginTop: 40 },
  error: { color: '#f87171', textAlign: 'center' },
  notice: { ...type.body, color: colors.inkSubtle, textAlign: 'center', lineHeight: 22 },
  infoBtn: { color: colors.inkSubtle, fontSize: 18, paddingHorizontal: 4 },
});
