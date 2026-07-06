// Annict GraphQL API クライアント（fetch ベース・React Native / Web 両対応）
//
// Web(PWA) では EXPO_PUBLIC_ANNICT_TOKEN をバンドルに埋め込みたくないため、
// 同一オリジンのサーバーレス関数 /api/annict を経由し、トークンはサーバ側に置く。
// ネイティブでは従来どおり Annict に直接アクセスする。

import { Platform } from 'react-native';
import type { AnnictWork } from '../types';

const ENDPOINT = 'https://api.annict.com/graphql';
// Web(PWA) のトークン秘匿プロキシ（CORESERVER の PHP）。配置場所が違う場合は
// EXPO_PUBLIC_ANNICT_PROXY で上書きできる。
const WEB_PROXY = process.env.EXPO_PUBLIC_ANNICT_PROXY ?? '/api/annict.php';
const isWeb = Platform.OS === 'web';

const SEASON_WORKS_QUERY = `
query ($season: String!, $first: Int!) {
  searchWorks(seasons: [$season], orderBy: { field: WATCHERS_COUNT, direction: DESC }, first: $first) {
    nodes {
      id
      title
      media
      episodesCount
      seasonName
      officialSiteUrl
      wikipediaUrl
      image { recommendedImageUrl facebookOgImageUrl copyright }
      programs(first: 100) {
        nodes {
          startedAt
          channel { name }
        }
      }
    }
  }
}`;

export interface AnnictClientOptions {
  token: string;
  /** テスト用に fetch を差し替え可能 */
  fetchImpl?: typeof fetch;
  endpoint?: string;
}

/** 指定シーズンの作品を視聴者数の多い順に取得 */
export async function fetchSeasonWorks(
  season: string,
  opts: AnnictClientOptions,
  first = 100,
): Promise<AnnictWork[]> {
  const doFetch = opts.fetchImpl ?? fetch;
  const endpoint = opts.endpoint ?? (isWeb ? WEB_PROXY : ENDPOINT);
  // Web はプロキシがトークンを付与するため Authorization を送らない
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!isWeb && opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await doFetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: SEASON_WORKS_QUERY,
      variables: { season, first },
    }),
  });

  if (!res.ok) {
    throw new Error(`Annict API error: HTTP ${res.status}`);
  }
  const json = (await res.json()) as {
    data?: { searchWorks?: { nodes?: AnnictWork[] } };
    errors?: Array<{ message: string }>;
  };
  if (json.errors?.length) {
    throw new Error(`Annict GraphQL error: ${json.errors.map((e) => e.message).join('; ')}`);
  }
  return json.data?.searchWorks?.nodes ?? [];
}
