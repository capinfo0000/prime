// 実行時設定（Expo public env から取得）

import Constants from 'expo-constants';

/**
 * Annict トークン。EXPO_PUBLIC_ANNICT_TOKEN（.env）から読む。
 * ※クライアント同梱は個人用途では許容。公開配布時はプロキシ経由に切り替える（README 参照）。
 */
export const ANNICT_TOKEN: string =
  process.env.EXPO_PUBLIC_ANNICT_TOKEN ??
  (Constants.expoConfig?.extra?.annictToken as string | undefined) ??
  '';

export const hasAnnictToken = ANNICT_TOKEN.length > 0;

/**
 * 表紙画像を表示するか。
 * 画像は各アニメ公式サイトの OGP を Annict 経由で参照（著作権は製作委員会/スタジオ）。
 * App Store 公開時は IP リスクがあるため、削除要請には即応する運用を前提とする。
 * 画像が無い作品は自動的に頭文字モノグラムにフォールバックする。
 */
export const SHOW_COVER_IMAGES = true;
