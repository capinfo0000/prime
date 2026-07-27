// デザイントークン（getdesign.md の linear.app DESIGN.md を出典に mobile 向けへ調整）
// 原則: ニアブラック canvas + 4段のサーフェス + ヘアライン枠 + 単一アクセント(ラベンダー)。

import type { TextStyle } from 'react-native';

export const colors = {
  primary: '#5e6ad2',
  primaryHover: '#828fff',
  primaryFocus: '#5e69d1',
  onPrimary: '#ffffff',

  ink: '#f7f8f8',
  inkMuted: '#d0d6e0',
  inkSubtle: '#8a8f98',
  inkTertiary: '#62666d',

  canvas: '#010102',
  surface1: '#0f1011',
  surface2: '#141516',
  surface3: '#18191a',
  hairline: '#23252a',
  hairlineStrong: '#34343a',

  success: '#27a644',
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// タイポグラフィ（Linear の負トラッキングを踏襲。iOS 既定の SF Pro を使用）
export const type = {
  display: { fontSize: 30, fontWeight: '700', letterSpacing: -0.8, color: colors.ink },
  headline: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5, color: colors.ink },
  cardTitle: { fontSize: 16, fontWeight: '600', letterSpacing: -0.3, color: colors.ink },
  body: { fontSize: 15, fontWeight: '400', color: colors.ink },
  bodySm: { fontSize: 13, fontWeight: '400', color: colors.inkMuted },
  caption: { fontSize: 12, fontWeight: '500', color: colors.inkSubtle },
  button: { fontSize: 14, fontWeight: '600', letterSpacing: 0, color: colors.onPrimary },
  eyebrow: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6, color: colors.inkSubtle },
} satisfies Record<string, TextStyle>;
