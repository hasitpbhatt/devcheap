#!/usr/bin/env node

/**
 * fetch-deals.js
 * Offline tool to add new developer deals to data/deals.json.
 * Edit the `newDeals` array below, then run: node scripts/fetch-deals.js
 *
 * data/deals.json is the source of truth for the site.
 * After adding deals, update the inline JSON in index.html if needed
 * (search for `<script id="deals-data">`).
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEALS_PATH = path.join(__dirname, '..', 'data', 'deals.json');

// ── Add new deals below ────────────────────────────────────────
const newDeals = [
  // Example:
  // {
  //   id: 'example',
  //   name: 'Example Service',
  //   category: 'Hosting & Cloud',
  //   deal: '$100 Free Credits',
  //   code: 'Automatic (Link)',
  //   url: 'https://example.com',
  //   affiliate_url: 'https://example.com/?ref=devcheap',
  //   tracking_id: 'example_001',
  //   has_affiliate: true,
  //   desc: 'Description of the deal.',
  //   tags: 'hosting,cloud,deploy'
  // },
];
// ───────────────────────────────────────────────────────────────

async function mergeDeals() {
  const raw = await fs.readFile(DEALS_PATH, 'utf-8');
  const existing = JSON.parse(raw);
  const existingIds = new Set(existing.map(d => d.id));
  const added = [];

  for (const deal of newDeals) {
    if (existingIds.has(deal.id)) {
      console.warn(`⚠️  Skipping duplicate: ${deal.id} (${deal.name})`);
      continue;
    }
    existing.push(deal);
    existingIds.add(deal.id);
    added.push(deal.name);
  }

  existing.sort((a, b) => a.name.localeCompare(b.name));
  await fs.writeFile(DEALS_PATH, JSON.stringify(existing, null, 2) + '\n', 'utf-8');

  if (added.length > 0) {
    console.log(`✅ Added: ${added.join(', ')}`);
  } else {
    console.log('📭 No new deals to add.');
  }
  console.log(`📊 Total: ${existing.length} deals in ${DEALS_PATH}`);
}

try {
  await mergeDeals();
} catch (err) {
  console.error('❌ Failed:', err.message);
  process.exit(1);
}
