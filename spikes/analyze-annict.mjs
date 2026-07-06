import { readFileSync } from 'node:fs';

const raw = JSON.parse(readFileSync(new URL('./annict-response.json', import.meta.url)));
if (raw.errors) {
  console.warn(`(GraphQL errors: ${raw.errors.length}件 — 部分データで継続)`);
}
const works = (raw?.data?.searchWorks?.nodes ?? []).filter(Boolean);
const isPrime = (s = '') => /amazon\s*プライム|prime\s*video|amazonプライム/i.test(s);
const WD = ['日', '月', '火', '水', '木', '金', '土'];
const jstWd = (iso) => new Date(Date.parse(iso) + 9 * 3600 * 1000).getUTCDay();

const channelTally = {};
let withAnyProgram = 0;
const primeWorks = [];

for (const w of works) {
  const programs = (w.programs?.nodes ?? []).filter(Boolean);
  if (programs.length) withAnyProgram++;
  const services = new Set();
  for (const p of programs) {
    const name = p.channel?.name ?? '(不明)';
    channelTally[name] = (channelTally[name] || 0) + 1;
  }
  const primePrograms = programs
    .filter((p) => isPrime(p.channel?.name) && p.startedAt)
    .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
  if (primePrograms.length) {
    const wdays = new Set(primePrograms.map((p) => WD[jstWd(p.startedAt)]));
    primeWorks.push({
      title: w.title,
      primeProgramCount: primePrograms.length,
      totalEps: w.episodesCount,
      wdays: [...wdays].join('/'),
      firstDate: primePrograms[0]?.startedAt,
      lastDate: primePrograms[primePrograms.length - 1]?.startedAt,
    });
  }
}

console.log('=== Annict 2026-summer (WATCHERS_COUNT DESC, 50件) ===');
console.log(`取得作品(非null): ${works.length}`);
console.log(`programs(配信/放送)が1件以上ある作品: ${withAnyProgram}/${works.length}`);
console.log(`Amazonプライム・ビデオの配信programあり: ${primeWorks.length}/${works.length}  ← Primeフィルタの成否`);

console.log('\n--- channel(放送局/配信) 別 program件数 上位25 ---');
Object.entries(channelTally).sort((a, b) => b[1] - a[1]).slice(0, 25)
  .forEach(([c, n]) => console.log(`  ${c}: ${n}`));

console.log('\n--- Prime配信作品(先頭20): Prime更新曜日 / program件数(=話数の目安) / 期間 ---');
primeWorks.slice(0, 20).forEach((p, i) => {
  console.log(`${String(i + 1).padStart(2)}. ${p.title}`);
  console.log(`     更新曜日(推定): ${p.wdays} / Prime program: ${p.primeProgramCount}件 (全${p.totalEps ?? '?'}話) / ${p.firstDate ?? '—'} 〜 ${p.lastDate ?? '—'}`);
});
