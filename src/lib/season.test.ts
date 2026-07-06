import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seasonNameForMonth, getSeason, toAnnictSeason, currentAnnictSeason } from './season.ts';

test('seasonNameForMonth maps months to seasons', () => {
  assert.equal(seasonNameForMonth(1), 'winter');
  assert.equal(seasonNameForMonth(3), 'winter');
  assert.equal(seasonNameForMonth(4), 'spring');
  assert.equal(seasonNameForMonth(7), 'summer');
  assert.equal(seasonNameForMonth(9), 'summer');
  assert.equal(seasonNameForMonth(10), 'autumn');
  assert.equal(seasonNameForMonth(12), 'autumn');
});

test('getSeason uses JST for boundary dates', () => {
  // 2026-07-06 (summer)
  assert.deepEqual(getSeason(new Date('2026-07-06T00:00:00Z')), { year: 2026, name: 'summer' });
  // UTC 2025-12-31T23:00Z は JST では 2026-01-01 09:00 → winter 2026
  assert.deepEqual(getSeason(new Date('2025-12-31T23:00:00Z')), { year: 2026, name: 'winter' });
});

test('currentAnnictSeason formats correctly', () => {
  assert.equal(currentAnnictSeason(new Date('2026-07-06T00:00:00Z')), '2026-summer');
  assert.equal(toAnnictSeason({ year: 2024, name: 'autumn' }), '2024-autumn');
});
