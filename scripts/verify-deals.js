#!/usr/bin/env node
/**
 * verify-deals.js — automated link checker for the deal catalog.
 *
 * Walks every deal in data/deals.jsonl, checks that its URL still resolves,
 * and writes data/verification.json. The build reads that file to stamp each
 * deal page with an honest "link checked <date>" signal, and to flag dead
 * links for human review.
 *
 *   node scripts/verify-deals.js              # check every deal
 *   node scripts/verify-deals.js --limit 20   # check the first 20
 *   node scripts/verify-deals.js --deal ne-on  # check one deal by id
 *   node scripts/verify-deals.js --timeout 8000
 *
 * Exit code 0 even when links fail — failures are data, not a build error.
 * The point is to surface them, not to block the pipeline.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DEALS_PATH = path.join(ROOT_DIR, 'data', 'deals.jsonl');
const OUTPUT_PATH = path.join(ROOT_DIR, 'data', 'verification.json');

const USER_AGENT = 'DevCheapBot/1.0 (+https://devcheap.click; link verification)';

function parseArgs(argv) {
  const args = { limit: Infinity, timeout: 10000, deal: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (argv[i] === '--timeout') args.timeout = parseInt(argv[++i], 10);
    else if (argv[i] === '--deal') args.deal = argv[++i];
  }
  return args;
}

/**
 * Check a single URL. Tries HEAD first (cheap), falls back to GET because a
 * lot of vendor sites reject HEAD with 405.
 */
async function checkUrl(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    });

    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT },
      });
    }

    const latencyMs = Date.now() - started;
    clearTimeout(timer);

    const status = response.status;
    const ok = status >= 200 && status < 400;
    const finalUrl = response.url || url;

    return {
      status: ok ? 'ok' : 'error',
      http_status: status,
      final_url: finalUrl,
      redirected: finalUrl !== url,
      latency_ms: latencyMs,
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      status: 'error',
      http_status: 0,
      final_url: url,
      redirected: false,
      latency_ms: Date.now() - started,
      error: err.name === 'AbortError' ? 'timeout' : String(err.message || err).slice(0, 200),
    };
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const raw = await fs.readFile(DEALS_PATH, 'utf-8');
  const allDeals = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l));

  let deals = allDeals;
  if (args.deal) {
    deals = allDeals.filter((d) => d.id === args.deal);
    if (deals.length === 0) {
      console.error(`No deal with id "${args.deal}"`);
      process.exit(1);
    }
  }
  if (Number.isFinite(args.limit)) deals = deals.slice(0, args.limit);

  console.log(`🔍 Verifying ${deals.length} deal link${deals.length === 1 ? '' : 's'}…`);

  // 6 at a time keeps it polite and fast enough for a weekly cron.
  const results = {};
  const batchSize = 6;
  for (let i = 0; i < deals.length; i += batchSize) {
    const batch = deals.slice(i, i + batchSize);
    const settled = await Promise.all(
      batch.map(async (deal) => [deal.id, await checkUrl(deal.url, args.timeout)])
    );
    for (const [id, result] of settled) {
      results[id] = { id, ...result, checked_at: new Date().toISOString() };
      const mark = result.status === 'ok' ? '✓' : '✗';
      const extra = result.error ? ` (${result.error})` : ` ${result.http_status}${result.redirected ? ' → redirected' : ''}`;
      console.log(`  ${mark} ${id}${extra}`);
    }
  }

  const entries = Object.values(results);
  const okCount = entries.filter((r) => r.status === 'ok').length;
  const failed = entries.filter((r) => r.status !== 'ok').map((r) => r.id);

  const report = {
    generated_at: new Date().toISOString(),
    checked: entries.length,
    ok: okCount,
    failed: failed.length,
    failed_ids: failed,
    deals: results,
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf-8');

  console.log(`\n✅ ${okCount}/${entries.length} links resolve.`);
  if (failed.length) {
    console.log(`⚠️  ${failed.length} need review: ${failed.join(', ')}`);
  }
  console.log(`📄 Wrote ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
