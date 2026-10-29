/**
 * Re-evaluate every deal in data/deals.jsonl using scripts/rating-rubric.js,
 * rewrite the file sorted by rating (desc) + id (asc tiebreak), and print
 * a summary.
 *
 * Usage:
 *   node scripts/reevaluate-ratings.js
 *
 * Also exposed as an npm script:
 *   npm run rerate
 */
import fs from 'fs';
import { rateDeal } from './rating-rubric.js';

const path = 'data/deals.jsonl';
const raw = fs.readFileSync(path, 'utf-8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';

const lines = raw.split(/\r?\n/);
if (lines[12] && lines[12].includes('"id":"flyio"') && lines[12].includes('affili_filePath')) {
  lines[12] = JSON.stringify({
    id: 'flyio',
    name: 'Fly.io',
    category: 'Hosting & Cloud',
    pricing: 'free',
    deal: '$10/month Free Credits',
    code: 'Automatic (Link)',
    url: 'https://fly.io',
    affiliate_url: '',
    tracking_id: 'flyio',
    has_affiliate: false,
    desc: 'Deploy full-stack apps globally with Docker. $10/month free credits.',
    tags: 'docker,hosting,edge,postgres,redis',
    why: '$10/mo free credits — deploy globally with Docker at no cost',
    expires: null,
    rating: 5,
  });
  console.log('Repaired malformed line 13 (flyio).');
}

const parsed = lines.map((line) => {
  if (!line.trim()) return null;
  try { return JSON.parse(line); } catch (e) {
    throw new Error(`Unparseable JSONL: ${e.message}`);
  }
}).filter(Boolean);

const results = parsed.map((deal) => {
  const { score, factors } = rateDeal(deal);
  return { deal, score, factors };
});

results.sort((a, b) => {
  if (b.score !== a.score) return b.score - a.score;
  return a.deal.id.localeCompare(b.deal.id);
});

const out = results.map((r) => {
  r.deal.rating = r.score;
  return JSON.stringify(r.deal);
});

fs.writeFileSync(path, out.join(eol) + eol + (raw.endsWith('\n') ? '' : ''));
console.log(`Re-rated and sorted ${out.length} deals.`);

console.log('\nTop 10:');
results.slice(0, 10).forEach((r, i) =>
  console.log(`  ${(i + 1).toString().padStart(2)}. ${r.deal.id.padEnd(28)} rating=${r.score.toFixed(1)}`),
);

console.log('\nBottom 5:');
results.slice(-5).forEach((r, i) =>
  console.log(`  ${(out.length - 4 + i).toString().padStart(3)}. ${r.deal.id.padEnd(28)} rating=${r.score.toFixed(1)}`),
);