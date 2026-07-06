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
