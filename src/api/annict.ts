// Annict GraphQL API クライアント（fetch ベース・React Native / Node 両対応）

import type { AnnictWork } from '../types';

const ENDPOINT = 'https://api.annict.com/graphql';

const SEASON_WORKS_QUERY = `
query ($season: String!, $first: Int!) {
  searchWorks(seasons: [$season], orderBy: { field: WATCHERS_COUNT, direction: DESC }, first: $first) {
    nodes {
      id
      title
      media
      episodesCount
      seasonName
      image { recommendedImageUrl facebookOgImageUrl }
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
  const res = await doFetch(opts.endpoint ?? ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.token}`,
    },
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
