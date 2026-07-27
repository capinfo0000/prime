// 外部データ由来の URL を安全に開くためのユーティリティ。
// Annict などから来る URL（officialSiteUrl 等）に javascript:/data: 等が混じっても
// 実行されないよう、http/https のみ許可する。

import { Linking } from 'react-native';

/** http/https のみ true */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** 安全な URL のみ開く。危険/不正なら何もせず false を返す */
export async function safeOpenUrl(url: string | null | undefined): Promise<boolean> {
  if (!isSafeUrl(url)) return false;
  try {
    await Linking.openURL(url as string);
    return true;
  } catch {
    return false;
  }
}
