import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeSchedule, jstWeekday, scheduleHeadline } from './schedule.ts';
import type { AnnictProgram } from '../types.ts';

const prog = (iso: string): AnnictProgram => ({
  startedAt: iso,
  channel: { name: 'Amazon プライム・ビデオ' },
});

test('jstWeekday converts to JST day-of-week', () => {
  // 2026-07-07T14:00Z = 2026-07-07T23:00 JST (火曜)
  assert.equal(jstWeekday('2026-07-07T14:00:00Z'), 2);
});

test('summarizeSchedule derives latest/next episode from order', () => {
  const programs = [
    prog('2026-07-07T14:00:00Z'), // ep1 火
    prog('2026-07-14T14:00:00Z'), // ep2 火
    prog('2026-07-21T14:00:00Z'), // ep3 火
  ];
  const now = new Date('2026-07-15T00:00:00Z'); // ep1,2 済み / ep3 未来
  const s = summarizeSchedule(programs, now);
  assert.equal(s.latestEpisode, 2);
  assert.equal(s.nextEpisode, 3);
  assert.equal(s.weekday, 2);
  assert.equal(s.weekdayLabel, '火');
  assert.equal(s.count, 3);
});

test('summarizeSchedule handles all-future and empty', () => {
  const future = summarizeSchedule([prog('2026-08-01T14:00:00Z')], new Date('2026-07-01T00:00:00Z'));
  assert.equal(future.latestEpisode, null);
  assert.equal(future.nextEpisode, 1);

  const empty = summarizeSchedule([], new Date('2026-07-01T00:00:00Z'));
  assert.equal(empty.count, 0);
  assert.equal(empty.weekday, null);
});

test('summarizeSchedule ignores null/invalid dates and counts order', () => {
  const programs: AnnictProgram[] = [
    { startedAt: null, channel: null },
    prog('2026-07-03T15:00:00Z'), // ep1
    prog('2026-07-10T15:00:00Z'), // ep2
  ];
  const s = summarizeSchedule(programs, new Date('2026-07-20T00:00:00Z'));
  assert.equal(s.count, 2);
  assert.equal(s.latestEpisode, 2);
});

test('scheduleHeadline renders Japanese summary', () => {
  const s = summarizeSchedule(
    [prog('2026-07-07T14:00:00Z'), prog('2026-07-14T14:00:00Z')],
    new Date('2026-07-08T00:00:00Z'),
  );
  assert.equal(scheduleHeadline(s), '毎週火曜更新／次回 第2話');
});
