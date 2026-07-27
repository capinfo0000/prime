import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toWorkCards } from './workCard.ts';
import type { AnnictWork } from '../types.ts';

const work = (id: string, title: string, channels: Array<[string, string]>): AnnictWork => ({
  id,
  title,
  episodesCount: 12,
  image: { recommendedImageUrl: `http://img/${id}.jpg` },
  programs: {
    nodes: channels.map(([name, iso]) => ({ startedAt: iso, channel: { name } })),
  },
});

const works: AnnictWork[] = [
  work('1', 'プライム作品', [
    ['Amazon プライム・ビデオ', '2026-07-07T14:00:00Z'],
    ['Amazon プライム・ビデオ', '2026-07-14T14:00:00Z'],
    ['TOKYO MX', '2026-07-06T14:00:00Z'],
  ]),
  work('2', 'Netflix独占', [['Netflix', '2026-07-10T00:00:00Z']]),
];

test('toWorkCards filters by service and keeps only matching works', () => {
  const prime = toWorkCards(works, 'prime', { now: new Date('2026-07-15T00:00:00Z') });
  assert.equal(prime.length, 1);
  assert.equal(prime[0].title, 'プライム作品');
  // schedule はプライムの program 基準（2話配信済み・火曜）
  assert.equal(prime[0].schedule?.latestEpisode, 2);
  assert.equal(prime[0].schedule?.weekdayLabel, '火');
});

test('toWorkCards without filter returns all works with streaming services only', () => {
  const all = toWorkCards(works, null, { now: new Date('2026-07-15T00:00:00Z') });
  assert.equal(all.length, 2);
  const primeCard = all.find((c) => c.id === '1')!;
  // TOKYO MX は放送局なので除外 → prime のみ
  assert.deepEqual(primeCard.services.map((s) => s.id), ['prime']);
});

test('toWorkCards excludes works not on the selected service', () => {
  const netflix = toWorkCards(works, 'netflix', { now: new Date('2026-07-15T00:00:00Z') });
  assert.deepEqual(netflix.map((c) => c.id), ['2']);
});
