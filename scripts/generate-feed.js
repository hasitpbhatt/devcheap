#!/usr/bin/env node
/**
 * generate-feed.js — RSS feed generator (Node.js port of generate-feed.ps1)
 *
 *   node scripts/generate-feed.js
 *
 * Reads data/deals.jsonl, outputs feed.xml.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DEALS_PATH = path.join(ROOT_DIR, 'data', 'deals.jsonl');
const OUTPUT_PATH = path.join(ROOT_DIR, 'feed.xml');

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;');
}

async function main() {
  const raw = await fs.readFile(DEALS_PATH, 'utf-8');
  const deals = raw.split('\n').filter(Boolean).map(l => JSON.parse(l));

  const items = deals.map(deal => {
    const title = escapeXml(`${deal.name} — ${deal.deal}`);
    const link = `https://devcheap.click/deals/${deal.id}/`;
    const desc = escapeXml(`${deal.why} ${deal.desc}`);
    const guid = deal.id;
    const cat = escapeXml(deal.category);

    let pubDate;
    if (deal.expires) {
      pubDate = new Date(deal.expires).toUTCString();
    } else {
      pubDate = 'Mon, 01 Jul 2026 00:00:00 GMT';
    }

    return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${desc}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${guid}</guid>
      <category>${cat}</category>
    </item>`;
  }).join('\n');

  const lastBuildDate = new Date().toUTCString();

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DevCheap — Verified Developer Deals</title>
    <link>https://devcheap.click/</link>
    <description>Verified deals on APIs, hosting, databases, and AI tools. Free credits, lifetime discounts, and limited offers curated weekly. Some links are affiliate links (disclosed at https://devcheap.click/disclosure/).</description>
    <copyright>DevCheap. Some links are affiliate links.</copyright>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="https://devcheap.click/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  await fs.writeFile(OUTPUT_PATH, feed, 'utf-8');
  console.log(`✅ Generated feed.xml with ${deals.length} items`);
}

main().catch(err => {
  console.error('❌ Feed generation failed:', err);
  process.exit(1);
});