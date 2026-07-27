import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_NAME, CONTACT_EMAIL, DATA_SOURCE_NAME, DATA_SOURCE_URL } from '../src/config';
import { colors, radius, space, type } from '../src/theme';

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <Pressable style={styles.linkRow} onPress={() => Linking.openURL(url)}>
      <Text style={styles.linkText}>{label}</Text>
      <Text style={styles.linkArrow}>↗</Text>
    </Pressable>
  );
}

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'このアプリについて' }} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.lead}>
          今期プライムビデオで配信中の新作アニメを、更新曜日つきで一覧する非公式アプリです。
        </Text>

        <Text style={styles.section}>データ提供</Text>
        <View style={styles.card}>
          <Text style={styles.body14}>
            作品情報・配信スケジュール・画像は {DATA_SOURCE_NAME} の API を利用しています。
          </Text>
          <LinkRow label={`${DATA_SOURCE_NAME}（annict.com）`} url={DATA_SOURCE_URL} />
        </View>

        <Text style={styles.section}>著作権について</Text>
        <View style={styles.card}>
          <Text style={styles.body14}>
            各作品のタイトル・あらすじ・画像等の著作権は、各アニメの製作委員会・権利者に帰属します。
            本アプリは作品情報を紹介・案内する目的で表示しており、権利者の権利を侵害する意図はありません。
            表紙画像は各公式サイト等の情報を参照しています。各作品の権利表記は詳細画面に表示します。
          </Text>
        </View>

        <Text style={styles.section}>配信サービスの商標</Text>
        <View style={styles.card}>
          <Text style={styles.body14}>
            「Amazonプライム・ビデオ」「Netflix」「dアニメストア」等のサービス名・ロゴは各社の商標です。
            本アプリはこれら各社とは提携していない非公式アプリです。
          </Text>
        </View>

        <Text style={styles.section}>削除要請・お問い合わせ</Text>
        <View style={styles.card}>
          <Text style={styles.body14}>
            掲載内容について削除・修正のご要望がある場合は、下記までご連絡ください。速やかに対応します。
          </Text>
          <LinkRow label={CONTACT_EMAIL} url={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(APP_NAME + ' お問い合わせ')}`} />
        </View>

        <Text style={styles.note}>
          本アプリは非商用の個人プロジェクトです。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  body: { padding: space.md, paddingBottom: space.xxl },
  appName: { ...type.headline },
  lead: { ...type.body, color: colors.inkMuted, marginTop: space.xs, lineHeight: 22 },
  section: { ...type.eyebrow, marginTop: space.lg, marginBottom: space.sm },
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.md,
    gap: space.sm,
  },
  body14: { ...type.body, fontSize: 14, color: colors.inkMuted, lineHeight: 21 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingTop: space.sm,
  },
  linkText: { ...type.body, fontSize: 14, color: colors.primaryHover, fontWeight: '600' },
  linkArrow: { color: colors.primaryHover, fontSize: 15 },
  note: { ...type.caption, color: colors.inkTertiary, marginTop: space.lg, textAlign: 'center' },
});
