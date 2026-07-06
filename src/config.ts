// 実行時設定（Expo public env から取得）

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Annict トークン（ネイティブ用）。EXPO_PUBLIC_ANNICT_TOKEN（.env）から読む。
 * ※ネイティブの個人用途は許容。Web(PWA) ではバンドルに埋め込まず、サーバーレス関数
 *   /api/annict がサーバ側の ANNICT_TOKEN を使う（src/api/annict.ts 参照）。
 */
export const ANNICT_TOKEN: string =
  process.env.EXPO_PUBLIC_ANNICT_TOKEN ??
  (Constants.expoConfig?.extra?.annictToken as string | undefined) ??
  '';

// Web はプロキシ経由でトークンを扱うため、クライアント側トークンが空でも利用可。
export const hasAnnictToken = Platform.OS === 'web' || ANNICT_TOKEN.length > 0;

/**
 * 表紙画像を表示するか。
 * 画像は各アニメ公式サイトの OGP を Annict 経由で参照（著作権は製作委員会/スタジオ）。
 * App Store 公開時は IP リスクがあるため、削除要請には即応する運用を前提とする。
 * 画像が無い作品は自動的に頭文字モノグラムにフォールバックする。
 */
export const SHOW_COVER_IMAGES = true;

// --- クレジット / 出典 / 連絡先（可能な限りの権利対策） ---

/** データ提供元 */
export const DATA_SOURCE_NAME = 'Annict';
export const DATA_SOURCE_URL = 'https://annict.com';

/**
 * 削除要請・問い合わせ先。公開前に必ず自分の連絡先に置き換えること。
 * 権利者が連絡できる窓口を用意しておくのが「可能な限りの対策」の要。
 */
export const CONTACT_EMAIL = 'ai.asset.lab1@gmail.com';

/** アプリ表示名（クレジット用） */
export const APP_NAME = 'アニメどこ見れ';
