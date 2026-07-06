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
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { hasAnnictToken } from '../src/config';
import { loadSeasonWorks } from '../src/lib/store';
import { toWorkCards } from '../src/lib/workCard';
import { scheduleHeadline } from '../src/lib/schedule';
import { FILTERABLE_SERVICES } from '../src/lib/services';
import { getSeason, seasonLabelJa } from '../src/lib/season';
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
      const w = await loadSeasonWorks(force);
      setWorks(w);
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
      <ServiceFilter selected={service} onSelect={setService} />
      <Text style={styles.seasonLabel}>{seasonLabelJa(getSeason())}の新作</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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

function WorkRow({ card }: { card: WorkCard }) {
  return (
    <Link href={`/work/${card.id}`} asChild>
      <Pressable style={styles.row}>
        {card.imageUrl ? (
          <Image source={{ uri: card.imageUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
        <View style={styles.rowBody}>
          <Text style={styles.title} numberOfLines={2}>
            {card.title}
          </Text>
          <Text style={styles.schedule}>
            {card.schedule ? scheduleHeadline(card.schedule) : '配信情報なし'}
          </Text>
          <View style={styles.badges}>
            {card.services.map((s) => (
              <Text key={s.id} style={styles.badge}>
                {s.label}
              </Text>
            ))}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  seasonLabel: { fontSize: 13, color: '#6b7280', paddingHorizontal: 16, paddingBottom: 4 },
  filterRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#111827' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { padding: 12, gap: 10 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  thumb: { width: 72, height: 96, borderRadius: 8, backgroundColor: '#e5e7eb' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, marginLeft: 12 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827' },
  schedule: { marginTop: 4, fontSize: 13, color: '#2563eb', fontWeight: '600' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 },
  badge: {
    fontSize: 11,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
    marginTop: 2,
    overflow: 'hidden',
  },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
  error: { color: '#dc2626', textAlign: 'center' },
  notice: { color: '#6b7280', textAlign: 'center', lineHeight: 22 },
});
