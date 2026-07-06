import { readFileSync } from 'node:fs';

const raw = JSON.parse(readFileSync(new URL('./annict-response.json', import.meta.url)));
if (raw.errors) {
  console.error('GraphQL errors:', JSON.stringify(raw.errors, null, 2));
  process.exit(1);
}
const works = raw?.data?.searchWorks?.nodes ?? [];
const isPrime = (s = '') => /amazon\s*プライム|prime\s*video|amazonプライム/i.test(s);
const WD = ['日', '月', '火', '水', '木', '金', '土'];

const channelTally = {};
let withAnyProgram = 0;
const primeWorks = [];

for (const w of works) {
  const programs = w.programs?.nodes ?? [];
  if (programs.length) withAnyProgram++;
  const channels = new Set();
  for (const p of programs) {
    const name = p.channel?.name ?? '(不明)';
    channels.add(name);
    channelTally[name] = (channelTally[name] || 0) + 1;
  }
  const primePrograms = programs
    .filter((p) => isPrime(p.channel?.name))
    .filter((p) => p.startedAt)
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
  if (primePrograms.length) {
    // 更新曜日の推定：Prime program の startedAt から曜日を集計
    const wdays = new Set(primePrograms.map((p) => WD[new Date(p.startedAt).getDay()]));
    const epsWithDate = primePrograms.filter((p) => p.episode?.number != null).length;
    primeWorks.push({
      title: w.title,
      channelCount: channels.size,
      primeProgramCount: primePrograms.length,
      epsWithDate,
      totalEps: w.episodesCount,
      wdays: [...wdays].join('/'),
      firstDate: primePrograms[0]?.startedAt,
    });
  }
}

console.log('=== Annict 2026-summer (WATCHERS_COUNT DESC, 50件) ===');
console.log(`取得作品: ${works.length}`);
console.log(`programs(配信/放送)が1件以上ある作品: ${withAnyProgram}/${works.length}`);
console.log(`Amazonプライム・ビデオの配信programあり: ${primeWorks.length}/${works.length}  ← Primeフィルタの成否`);

console.log('\n--- channel(放送局/配信) 別 program件数 上位20 ---');
Object.entries(channelTally).sort((a, b) => b[1] - a[1]).slice(0, 20)
  .forEach(([c, n]) => console.log(`  ${c}: ${n}`));

console.log('\n--- Prime配信作品(先頭15): 更新曜日 / 話数別日付の粒度 ---');
primeWorks.slice(0, 15).forEach((p, i) => {
  console.log(`${String(i + 1).padStart(2)}. ${p.title}`);
  console.log(`     横断チャンネル数: ${p.channelCount} / Prime program: ${p.primeProgramCount}件 / 話数付き: ${p.epsWithDate}/${p.totalEps ?? '?'}話`);
  console.log(`     Prime更新曜日(推定): ${p.wdays} / 初回: ${p.firstDate ?? '—'}`);
});
