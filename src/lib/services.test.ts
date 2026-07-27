import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyChannel,
  isPrime,
  channelsToServices,
  primeWatchUrl,
} from './services.ts';

test('classifyChannel maps Annict channel names', () => {
  assert.equal(classifyChannel('Amazon プライム・ビデオ').id, 'prime');
  assert.equal(classifyChannel('Amazonプライム・ビデオ').id, 'prime');
  assert.equal(classifyChannel('dアニメストア').id, 'danime');
  assert.equal(classifyChannel('dアニメストア ニコニコ支店').id, 'danime');
  assert.equal(classifyChannel('Netflix').id, 'netflix');
  assert.equal(classifyChannel('TOKYO MX').id, 'other');
  assert.equal(classifyChannel(null).id, 'other');
});

test('isPrime detects Prime Video only', () => {
  assert.equal(isPrime('Amazon プライム・ビデオ'), true);
  assert.equal(isPrime('Prime Video'), true);
  assert.equal(isPrime('Netflix'), false);
});

test('channelsToServices dedupes and keeps streaming only', () => {
  const svcs = channelsToServices([
    'TOKYO MX',
    'Amazon プライム・ビデオ',
    'dアニメストア',
    'Amazonプライム・ビデオ', // 重複
    'BS11',
  ]);
  assert.deepEqual(svcs.map((s) => s.id), ['prime', 'danime']);
});

test('primeWatchUrl uses ASIN when valid, else search fallback', () => {
  assert.equal(
    primeWatchUrl('作品名', 'B0H1QXXRG1'),
    'https://www.amazon.co.jp/gp/video/detail/B0H1QXXRG1',
  );
  assert.equal(
    primeWatchUrl('攻殻機動隊'),
    'https://www.amazon.co.jp/gp/video/search/?phrase=%E6%94%BB%E6%AE%BB%E6%A9%9F%E5%8B%95%E9%9A%8A',
  );
  // 不正な ASIN は検索フォールバック
  assert.ok(primeWatchUrl('x', 'bad').includes('/search/'));
});
