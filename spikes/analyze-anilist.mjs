import { readFileSync } from 'node:fs';

const raw = JSON.parse(readFileSync(new URL('./anilist-response.json', import.meta.url)));
const media = raw?.data?.Page?.media ?? [];
const pageInfo = raw?.data?.Page?.pageInfo ?? {};

const isPrime = (s = '') => /prime\s*video|amazon/i.test(s);
const WD = ['日','月','火','水','木','金','土'];

let withNext = 0, withStreaming = 0, withPrimeLink = 0, jp = 0;
const primeList = [];
const siteTally = {};

for (const m of media) {
  if (m.countryOfOrigin === 'JP') jp++;
  if (m.nextAiringEpisode) withNext++;
  if (m.streamingEpisodes?.length) withStreaming++;

  const links = m.externalLinks ?? [];
  for (const l of links) {
    if (l.type === 'STREAMING') siteTally[l.site] = (siteTally[l.site] || 0) + 1;
  }
  const primeExt = links.find((l) => l.type === 'STREAMING' && isPrime(l.site));
  const primeStream = (m.streamingEpisodes ?? []).find((e) => isPrime(e.site));
  if (primeExt || primeStream) {
    withPrimeLink++;
    const na = m.nextAiringEpisode;
    let nextStr = '—';
    if (na?.airingAt) {
      const d = new Date((na.airingAt) * 1000);
      // JST = UTC+9
      const j = new Date(d.getTime() + 9 * 3600 * 1000);
      nextStr = `第${na.episode}話 ${j.getUTCMonth()+1}/${j.getUTCDate()}(${WD[j.getUTCDay()]}) ${String(j.getUTCHours()).padStart(2,'0')}:${String(j.getUTCMinutes()).padStart(2,'0')} JST`;
    }
    primeList.push({
      title: m.title.native || m.title.romaji,
      nextStr,
      primeUrl: primeExt?.url || primeStream?.url || '(URLなし)',
      via: primeExt ? 'externalLinks' : 'streamingEpisodes',
    });
  }
}

console.log('=== AniList Summer 2026 (TV, POPULARITY_DESC, 1ページ=50件) ===');
console.log(`総件数(pageInfo.total): ${pageInfo.total}, 取得: ${media.length}, hasNextPage: ${pageInfo.hasNextPage}`);
console.log(`日本作品(JP): ${jp}/${media.length}`);
console.log(`nextAiringEpisode あり: ${withNext}/${media.length}  ← 次回更新日/曜日の取得可否`);
console.log(`streamingEpisodes あり: ${withStreaming}/${media.length}`);
console.log(`Amazon/Prime の配信リンクあり: ${withPrimeLink}/${media.length}`);
console.log('\n--- STREAMING サイト別 件数(externalLinks) ---');
Object.entries(siteTally).sort((a,b)=>b[1]-a[1]).forEach(([s,n])=>console.log(`  ${s}: ${n}`));
console.log('\n--- Prime 配信作品(先頭15) 次回更新 / URL ---');
primeList.slice(0,15).forEach((p,i)=>{
  console.log(`${String(i+1).padStart(2)}. ${p.title}`);
  console.log(`     次回: ${p.nextStr}`);
  console.log(`     URL(${p.via}): ${p.primeUrl}`);
});
