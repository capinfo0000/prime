// シーズン作品の取得＋簡易キャッシュ（画面間で共有）

import { fetchSeasonWorks } from '../api/annict';
import { ANNICT_TOKEN } from '../config';
import { currentAnnictSeason } from './season';
import type { AnnictWork } from '../types';

let cache: { season: string; works: AnnictWork[] } | null = null;

export async function loadSeasonWorks(force = false): Promise<AnnictWork[]> {
  const season = currentAnnictSeason();
  if (!force && cache?.season === season) return cache.works;
  const works = await fetchSeasonWorks(season, { token: ANNICT_TOKEN });
  cache = { season, works };
  return works;
}

export function getCachedWork(id: string): AnnictWork | undefined {
  return cache?.works.find((w) => w.id === id);
}
