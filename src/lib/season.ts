// 日付 ⇔ シーズン（Annict の "2026-summer" 形式）変換

export type SeasonName = 'winter' | 'spring' | 'summer' | 'autumn';

export interface Season {
  year: number;
  name: SeasonName;
}

const SEASON_LABELS_JA: Record<SeasonName, string> = {
  winter: '冬',
  spring: '春',
  summer: '夏',
  autumn: '秋',
};

/** 月(1-12) → シーズン名。1-3=冬, 4-6=春, 7-9=夏, 10-12=秋 */
export function seasonNameForMonth(month: number): SeasonName {
  if (month >= 1 && month <= 3) return 'winter';
  if (month >= 4 && month <= 6) return 'spring';
  if (month >= 7 && month <= 9) return 'summer';
  return 'autumn';
}

/** Date（JST基準で判定）→ Season */
export function getSeason(date: Date = new Date()): Season {
  // JST(UTC+9)での年月を用いる
  const jst = new Date(date.getTime() + 9 * 3600 * 1000);
  const year = jst.getUTCFullYear();
  const month = jst.getUTCMonth() + 1;
  return { year, name: seasonNameForMonth(month) };
}

/** Season → Annict のシーズン文字列 "2026-summer" */
export function toAnnictSeason(season: Season): string {
  return `${season.year}-${season.name}`;
}

/** 現在（JST）の Annict シーズン文字列。省略時は今日 */
export function currentAnnictSeason(date: Date = new Date()): string {
  return toAnnictSeason(getSeason(date));
}

/** "2026夏" のような日本語表示 */
export function seasonLabelJa(season: Season): string {
  return `${season.year}年${SEASON_LABELS_JA[season.name]}`;
}
