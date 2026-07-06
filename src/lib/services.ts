// Annict の channel 名 → 配信サービスの正規化・判定・視聴URL生成

import type { StreamingService, StreamingServiceId } from '../types';

interface Matcher {
  id: StreamingServiceId;
  label: string;
  kind: 'streaming';
  test: RegExp;
}

// Annict の「動画サービス」チャンネル名に合わせたマッチャ（上から順に評価）
const MATCHERS: Matcher[] = [
  { id: 'prime', label: 'Amazonプライム・ビデオ', kind: 'streaming', test: /amazon\s*プライム|prime\s*video|アマゾンプライム/i },
  { id: 'danime', label: 'dアニメストア', kind: 'streaming', test: /d\s*アニメ/i },
  { id: 'netflix', label: 'Netflix', kind: 'streaming', test: /netflix/i },
  { id: 'unext', label: 'U-NEXT', kind: 'streaming', test: /u-?next/i },
  { id: 'crunchyroll', label: 'Crunchyroll', kind: 'streaming', test: /crunchyroll/i },
  { id: 'disney', label: 'Disney+', kind: 'streaming', test: /disney/i },
  { id: 'hulu', label: 'Hulu', kind: 'streaming', test: /hulu/i },
  { id: 'fod', label: 'FOD', kind: 'streaming', test: /\bfod\b/i },
  { id: 'dmm', label: 'DMM TV', kind: 'streaming', test: /dmm/i },
  { id: 'abema', label: 'ABEMA', kind: 'streaming', test: /abema/i },
  { id: 'bandai', label: 'バンダイチャンネル', kind: 'streaming', test: /バンダイ/i },
  { id: 'niconico', label: 'ニコニコ', kind: 'streaming', test: /ニコニコ/i },
  { id: 'youtube', label: 'YouTube', kind: 'streaming', test: /youtube/i },
];

const OTHER: StreamingService = { id: 'other', label: 'その他', kind: 'other' };

/** channel 名を配信サービスに分類。未知の配信/放送局は other */
export function classifyChannel(name: string | null | undefined): StreamingService {
  if (!name) return OTHER;
  for (const m of MATCHERS) {
    if (m.test.test(name)) return { id: m.id, label: m.label, kind: m.kind };
  }
  return OTHER;
}

/** Amazonプライム・ビデオ判定 */
export function isPrime(name: string | null | undefined): boolean {
  return classifyChannel(name).id === 'prime';
}

/** channel 名リスト → 配信サービス（streaming のみ・重複排除・出現順維持） */
export function channelsToServices(names: Array<string | null | undefined>): StreamingService[] {
  const seen = new Set<StreamingServiceId>();
  const out: StreamingService[] = [];
  for (const name of names) {
    const svc = classifyChannel(name);
    if (svc.kind !== 'streaming') continue;
    if (seen.has(svc.id)) continue;
    seen.add(svc.id);
    out.push(svc);
  }
  return out;
}

/** フィルタ用の代表的な配信サービス（UI のフィルタチップ順）。prime を先頭に */
export const FILTERABLE_SERVICES: StreamingService[] = [
  { id: 'prime', label: 'Amazonプライム・ビデオ', kind: 'streaming' },
  { id: 'danime', label: 'dアニメストア', kind: 'streaming' },
  { id: 'netflix', label: 'Netflix', kind: 'streaming' },
  { id: 'unext', label: 'U-NEXT', kind: 'streaming' },
  { id: 'disney', label: 'Disney+', kind: 'streaming' },
  { id: 'crunchyroll', label: 'Crunchyroll', kind: 'streaming' },
];

/**
 * 視聴URL生成。日本の ASIN が分かれば直リンク、無ければタイトル検索フォールバック。
 * （Prime のディープリンクは不安定なため検索フォールバックを既定にする — FINDINGS 参照）
 */
export function primeWatchUrl(title: string, asin?: string | null): string {
  if (asin && /^[A-Z0-9]{10}$/.test(asin)) {
    return `https://www.amazon.co.jp/gp/video/detail/${asin}`;
  }
  return `https://www.amazon.co.jp/gp/video/search/?phrase=${encodeURIComponent(title)}`;
}
