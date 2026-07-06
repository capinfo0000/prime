// Annict の programs 群 → 更新スケジュール要約（最新話・次回更新・更新曜日）
//
// Annict の Program.episode は取得できない（non-null 違反）ため、
// 話数は「startedAt の昇順での順番」で導出する（TV の週次配信を想定）。

import type { AnnictProgram } from '../types';

export interface ScheduleSummary {
  /** すでに配信済みの最新話数（=配信済み program 数） */
  latestEpisode: number | null;
  latestAiredAt: string | null;
  /** 次に配信される話数 */
  nextEpisode: number | null;
  nextAiringAt: string | null;
  /** 最頻の更新曜日 0=日..6=土（JST基準） */
  weekday: number | null;
  weekdayLabel: string | null;
  /** 対象 program 件数（日付ありのもの） */
  count: number;
}

const WD_JA = ['日', '月', '火', '水', '木', '金', '土'];

/** ISO文字列を JST の曜日(0=日..6=土)に変換 */
export function jstWeekday(iso: string): number {
  const utcMs = Date.parse(iso);
  const jst = new Date(utcMs + 9 * 3600 * 1000);
  return jst.getUTCDay();
}

function mode(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const tally = new Map<number, number>();
  for (const n of nums) tally.set(n, (tally.get(n) ?? 0) + 1);
  let best: number | null = null;
  let bestCount = -1;
  for (const [n, c] of tally) {
    if (c > bestCount) {
      best = n;
      bestCount = c;
    }
  }
  return best;
}

/**
 * programs（同一作品・任意で特定サービスに絞ったもの）から更新要約を作る。
 * now を注入可能（テスト用）。話数は昇順の並び順（1始まり）で数える。
 */
export function summarizeSchedule(
  programs: AnnictProgram[],
  now: Date = new Date(),
): ScheduleSummary {
  const dated = programs
    .filter((p) => p.startedAt && !Number.isNaN(Date.parse(p.startedAt)))
    .map((p) => Date.parse(p.startedAt as string))
    .sort((a, b) => a - b);

  const nowMs = now.getTime();
  const airedCount = dated.filter((ms) => ms <= nowMs).length;

  const latestEpisode = airedCount > 0 ? airedCount : null;
  const latestAiredAt = airedCount > 0 ? new Date(dated[airedCount - 1]).toISOString() : null;

  const hasNext = airedCount < dated.length;
  const nextEpisode = hasNext ? airedCount + 1 : null;
  const nextAiringAt = hasNext ? new Date(dated[airedCount]).toISOString() : null;

  const weekday = mode(dated.map((ms) => new Date(ms + 9 * 3600 * 1000).getUTCDay()));

  return {
    latestEpisode,
    latestAiredAt,
    nextEpisode,
    nextAiringAt,
    weekday,
    weekdayLabel: weekday === null ? null : WD_JA[weekday],
    count: dated.length,
  };
}

/** "毎週火曜更新" のような短い日本語表現 */
export function scheduleHeadline(s: ScheduleSummary): string {
  if (s.weekdayLabel) {
    const ep = s.nextEpisode ? `／次回 第${s.nextEpisode}話` : '';
    return `毎週${s.weekdayLabel}曜更新${ep}`;
  }
  if (s.latestEpisode) return `最新 第${s.latestEpisode}話`;
  return '配信情報なし';
}
