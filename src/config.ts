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
 * 表紙画像を表示するか。既定 false（タイトル主役）。
 * 画像の著作権は製作委員会/スタジオにあり、App Store 公開時の IP リスク回避のため既定はオフ。
 * 権利を確認できた／個人利用なら true に。
 */
export const SHOW_COVER_IMAGES = false;
