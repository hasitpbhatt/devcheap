import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DEALS_PATH = path.join(ROOT_DIR, 'data', 'deals.jsonl');
const OUTPUT_PATH = path.join(ROOT_DIR, 'llms.txt');

async function main() {
  const raw = await fs.readFile(DEALS_PATH, 'utf-8');
  const deals = raw.split('\n').filter(Boolean).map(l => JSON.parse(l));

  const categoryMap = {};
  for (const d of deals) {
    const cat = d.category || 'Uncategorized';
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(d);
  }
  const categories = Object.keys(categoryMap).sort((a, b) => categoryMap[b].length - categoryMap[a].length);
  const totalDeals = deals.length;
  const topDeals = deals.filter(d => d.rating >= 8.0).sort((a, b) => b.rating - a.rating);

  const lines = [];

  lines.push('# DevCheap — Developer Deals & Discounts');
  lines.push('');
  lines.push('> Curated deals, discounts, and free tiers for developers. Updated daily with verified listings across cloud, AI, DevOps, databases, and more.');
  lines.push('');
  lines.push(`DevCheap tracks **${totalDeals} deals** across **${categories.length} categories**. Every deal is manually reviewed, rated, and categorized. All deals include pricing, expiration, coupon codes, and affiliate tracking where available.`);
  lines.push('');
  lines.push('## Featured');
  lines.push('- [Homepage — Browse All Deals](https://devcheap.click/): All active deals with filtering, search, and pagination');
  lines.push('- [Archive — Expired & Lower-Rated Deals](https://devcheap.click/archive.html): Historical deals rated < 8.0, kept for reference');

  lines.push('');
  lines.push('## Top Deals');
  for (const d of topDeals.slice(0, 15)) {
    const url = d.affiliate_url || d.url;
    const desc = d.desc.length > 120 ? d.desc.slice(0, 120) + '…' : d.desc;
    const tag = `[rating: ${d.rating}] [${d.pricing}]`;
    lines.push(`- [${d.name}](${url}) — ${desc} ${tag}`);
  }

  lines.push('');
  lines.push('## Categories');
  for (const cat of categories) {
    const count = categoryMap[cat].length;
    const examples = categoryMap[cat].sort((a, b) => b.rating - a.rating).slice(0, 3);
    const exampleNames = examples.map(d => d.name).join(', ');
    const bestUrl = examples[0]?.affiliate_url || examples[0]?.url || '';
    lines.push(`- [${cat}](${bestUrl}) — ${count} deals. Examples: ${exampleNames}`);
  }

  lines.push('');
  lines.push('## About');
  lines.push('- **Site**: [devcheap.click](https://devcheap.click/)');
  lines.push('- **Deal count**: ' + totalDeals);
  lines.push('- **Categories**: ' + categories.length);
  lines.push('- **Content**: Deals are added and updated continuously. Each deal has a dedicated detail page with description, pricing, coupon code, and affiliate link.');
  lines.push('- **Pricing types**: free, freemium, lifetime, subscription, one-time, credit');

  const output = lines.join('\n');
  await fs.writeFile(OUTPUT_PATH, output, 'utf-8');
  console.log(`✅ Generated llms.txt with ${totalDeals} deals across ${categories.length} categories.`);
}

main().catch(err => {
  console.error('❌ llms.txt generation failed:', err);
  process.exit(1);
});
