// 更新通知（expo-notifications）: お気に入り作品の次回配信をローカル通知で予約

import * as Notifications from 'expo-notifications';
import type { WorkCard } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** 通知許可をリクエスト（許可されたら true） */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

/**
 * お気に入り作品の「次回配信日時」にローカル通知を予約する。
 * 既存の予約は一旦クリアしてから貼り直す（単純だが確実）。
 */
export async function scheduleUpdateNotifications(cards: WorkCard[]): Promise<number> {
  const granted = await requestNotificationPermission();
  if (!granted) return 0;

  await Notifications.cancelAllScheduledNotificationsAsync();

  let scheduled = 0;
  const now = Date.now();
  for (const card of cards) {
    const at = card.schedule?.nextAiringAt;
    if (!at) continue;
    const when = Date.parse(at);
    if (Number.isNaN(when) || when <= now) continue;

    const ep = card.schedule?.nextEpisode;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '新しいエピソードが配信されました',
        body: ep ? `${card.title} 第${ep}話が更新されました` : `${card.title} が更新されました`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(when),
      },
    });
    scheduled += 1;
  }
  return scheduled;
}
