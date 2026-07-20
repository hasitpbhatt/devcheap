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
  const expiredDeals = deals.filter(d => new Date(d.expires) < new Date()).length;
  const pricingTypes = {};
  for (const d of deals) {
    pricingTypes[d.pricing] = (pricingTypes[d.pricing] || 0) + 1;
  }

  const lines = [];

  lines.push('# DevCheap — Developer Deals & Discounts');
  lines.push('');
  lines.push('> Curated deals, discounts, and free tiers for developers. Updated daily with verified listings across cloud, AI, DevOps, databases, and more.');
  lines.push('');
  lines.push(`DevCheap tracks **${totalDeals} deals** across **${categories.length} categories**. Every deal is manually reviewed, rated (1-10), and categorized. All deals include pricing, expiration dates, coupon codes, and affiliate tracking where available.`);
  lines.push('');
  lines.push('## Featured');
  lines.push('- [Homepage — Browse All Deals](https://devcheap.click/): All active deals with filtering, search, and pagination');
  lines.push('- [Archive — Expired & Lower-Rated Deals](https://devcheap.click/archive.html): Historical deals kept for reference');
  lines.push('- [Raw Deal Data (JSONL)](https://devcheap.click/data/deals.jsonl): Full dataset for programmatic consumption');

  lines.push('');
  const pricingLine = Object.entries(pricingTypes)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  lines.push(`## Quick Stats`);
  lines.push(`- Total deals: **${totalDeals}**`);
  lines.push(`- Categories: **${categories.length}**`);
  lines.push(`- Top-rated deals (≥ 8.0): **${topDeals.length}**`);
  lines.push(`- Expired deals: **${expiredDeals}**`);
  lines.push(`- Pricing: ${pricingLine}`);
  lines.push(`- Last updated: ${new Date().toISOString().split('T')[0]}`);

  lines.push('');
  lines.push('## Top Deals');
  for (const d of topDeals.slice(0, 15)) {
    const url = d.affiliate_url || d.url;
    const dealPage = `https://devcheap.click/deals/${d.id}/`;
    const desc = d.desc.length > 120 ? d.desc.slice(0, 120) + '…' : d.desc;
    const tag = `[rating: ${d.rating}] [${d.pricing}]`;
    const expires = d.expires ? `expires: ${d.expires}` : 'no expiry';
    const codeInfo = d.code && d.code !== 'Automatic (Link)' ? ` code: \`${d.code}\`` : '';
    lines.push(`- [${d.name}](${url}) — ${desc} ${tag} (${expires}${codeInfo}) — [Details](${dealPage})`);
  }

  lines.push('');
  lines.push('## Categories');
  for (const cat of categories) {
    const catDeals = categoryMap[cat];
    const count = catDeals.length;
    const byPricing = {};
    for (const d of catDeals) {
      byPricing[d.pricing] = (byPricing[d.pricing] || 0) + 1;
    }
    const pricingBreakdown = Object.entries(byPricing)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    const examples = catDeals.sort((a, b) => b.rating - a.rating).slice(0, 3);
    const exampleLines = examples.map(d => {
      const dp = `https://devcheap.click/deals/${d.id}/`;
      return `[${d.name}](${dp}) [rating: ${d.rating}, ${d.pricing}]`;
    }).join('; ');
    lines.push(`- **${cat}** (${count} deals, ${pricingBreakdown}) — ${exampleLines}`);
  }

  lines.push('');
  lines.push('## How to Use This Site');
  lines.push('- **Browse**: Visit the [homepage](https://devcheap.click/) to see all active deals. Use category buttons and search to filter.');
  lines.push('- **Detail pages**: Each deal has a dedicated page at `https://devcheap.click/deals/{id}/` with full description, pricing, coupon code, and affiliate tracking.');
  lines.push('- **Coupon codes**: If a deal has a coupon code, it is shown on the detail page. Click "Copy Code" to copy it to clipboard.');
  lines.push('- **Affiliate links**: Some deals use affiliate links (marked with tracking_id) to support the site. These are always disclosed.');
  lines.push('- **Ratings**: Each deal is rated 1-10. Deals ≥ 8.0 are featured on the homepage. Deals < 8.0 are moved to the [archive](https://devcheap.click/archive.html).');
  lines.push('- **RSS**: Subscribe to [feed.xml](https://devcheap.click/feed.xml) for deal updates.');
  lines.push('- **Data access**: Full dataset at [data/deals.jsonl](https://devcheap.click/data/deals.jsonl) (one JSON object per line).');

  lines.push('');
  lines.push('## Content Negotiation');
  lines.push('- This site supports content negotiation via the `Accept` header.');
  lines.push('- Request `Accept: text/markdown` to receive a clean markdown version of any page.');
  lines.push('- The `Vary: Accept` header is set on all responses to ensure proper caching.');
  lines.push('- Structured data is available via JSON-LD in the HTML `<head>`.');

  lines.push('');
  lines.push('## About');
  lines.push('- **Site**: [devcheap.click](https://devcheap.click/)');
  lines.push('- **Deal count**: ' + totalDeals);
  lines.push('- **Categories**: ' + categories.length);
  lines.push('- **Content**: Deals are added and updated continuously. Each deal has a dedicated detail page with description, pricing, coupon code, and affiliate link.');
  lines.push('- **Pricing types**: ' + Object.keys(pricingTypes).sort().join(', '));

  const output = lines.join('\n');
  await fs.writeFile(OUTPUT_PATH, output, 'utf-8');
  console.log(`✅ Generated llms.txt with ${totalDeals} deals across ${categories.length} categories.`);
}

main().catch(err => {
  console.error('❌ llms.txt generation failed:', err);
  process.exit(1);
});
