// アプリ全体で使うドメイン型

export type StreamingServiceId =
  | 'prime'
  | 'danime'
  | 'netflix'
  | 'unext'
  | 'crunchyroll'
  | 'disney'
  | 'hulu'
  | 'fod'
  | 'abema'
  | 'dmm'
  | 'bandai'
  | 'niconico'
  | 'youtube'
  | 'other';

export interface StreamingService {
  id: StreamingServiceId;
  /** 日本語表示名 */
  label: string;
  /** streaming = 配信サービス, tv = 放送局, other = 不明 */
  kind: 'streaming' | 'tv' | 'other';
}

// --- Annict GraphQL のレスポンス最小型 ---

// 注: Annict の Program.episode は non-null 必須なのに null を返すことがあり
// クエリするとエラーになるため取得しない。話数は startedAt の並び順で導出する。
export interface AnnictProgram {
  startedAt: string | null;
  channel: { name: string } | null;
}

export interface AnnictWork {
  id: string;
  title: string;
  media?: string | null;
  episodesCount?: number | null;
  seasonName?: string | null;
  image?: {
    recommendedImageUrl?: string | null;
    facebookOgImageUrl?: string | null;
  } | null;
  programs?: { nodes: AnnictProgram[] } | null;
}

// --- 画面で使う整形済みモデル ---

export interface WorkCard {
  id: string;
  title: string;
  imageUrl: string | null;
  episodesCount: number | null;
  /** この作品を配信している配信サービス（重複排除・streaming のみ） */
  services: StreamingService[];
  /** 特定サービス視点の更新スケジュール（一覧では選択中サービスの値を入れる） */
  schedule: import('./lib/schedule').ScheduleSummary | null;
}
