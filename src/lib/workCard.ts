// Annict の生データ → 画面用 WorkCard への変換 & 配信サービスでの絞り込み

import type { AnnictProgram, AnnictWork, StreamingServiceId, WorkCard } from '../types';
import { channelsToServices, classifyChannel } from './services';
import { summarizeSchedule } from './schedule';

function imageOf(work: AnnictWork): string | null {
  return (
    work.image?.recommendedImageUrl ||
    work.image?.facebookOgImageUrl ||
    null
  );
}

/** 特定サービスに属する program だけを抽出 */
function programsForService(
  programs: AnnictProgram[],
  serviceId: StreamingServiceId,
): AnnictProgram[] {
  return programs.filter((p) => classifyChannel(p.channel?.name).id === serviceId);
}

/**
 * 作品群を「指定サービスで配信中のもの」に絞り、WorkCard に整形する。
 * serviceId を省略すると全作品（サービス横断）を返す。
 * schedule は serviceId 指定時はそのサービスの program 基準、未指定時は全 program 基準。
 */
export interface ToWorkCardsOptions {
  /** 対象メディア種別（Annict の media 値）。省略時は絞らない。例: ['TV'] */
  mediaTypes?: string[];
  now?: Date;
}

export function toWorkCards(
  works: AnnictWork[],
  serviceId: StreamingServiceId | null,
  opts: ToWorkCardsOptions = {},
): WorkCard[] {
  const now = opts.now ?? new Date();
  const cards: WorkCard[] = [];
  for (const w of works) {
    if (opts.mediaTypes && w.media && !opts.mediaTypes.includes(w.media)) continue;
    const programs = w.programs?.nodes ?? [];
    const services = channelsToServices(programs.map((p) => p.channel?.name));

    if (serviceId) {
      // 指定サービスで配信していない作品は除外
      if (!services.some((s) => s.id === serviceId)) continue;
    }

    const scheduleSource = serviceId ? programsForService(programs, serviceId) : programs;
    const schedule = scheduleSource.length ? summarizeSchedule(scheduleSource, now) : null;

    cards.push({
      id: w.id,
      title: w.title,
      imageUrl: imageOf(w),
      episodesCount: w.episodesCount ?? null,
      services,
      schedule,
    });
  }
  return cards;
}
