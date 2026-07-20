import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Guards against the original DevCheap bug: editing data/deals.jsonl without
// running `npm run build`, causing index.html stats, sitemap.xml, and per-deal
// pages to drift. If this test fails, run `npm run build` and commit.

const ROOT = path.resolve('.');
const DEALS_PATH = path.join(ROOT, 'data', 'deals.jsonl');
const INDEX_PATH = path.join(ROOT, 'index.html');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const LLMS_PATH = path.join(ROOT, 'llms.txt');
const DEALS_DIR = path.join(ROOT, 'deals');

const deals = fs.readFileSync(DEALS_PATH, 'utf-8')
  .split('\n').filter(Boolean).map(l => JSON.parse(l));
const dealCount = deals.length;
const dealIds = new Set(deals.map(d => d.id));

describe('build freshness', () => {
  it('homepage hero stat matches deals.jsonl count', () => {
    const html = fs.readFileSync(INDEX_PATH, 'utf-8');
    const match = html.match(/id="stat-deals"[^>]*data-prefix="">([^<]+)<\/span>/);
    expect(match, 'stat-deals span not found in index.html').not.toBeNull();
    expect(parseInt(match[1], 10)).toBe(dealCount);
  });

  it('homepage "active deals" count line matches', () => {
    const html = fs.readFileSync(INDEX_PATH, 'utf-8');
    const match = html.match(/id="deals-count"[^>]*>([^<]+)<\/p>/);
    expect(match, 'deals-count element not found').not.toBeNull();
    expect(parseInt(match[1], 10)).toBe(dealCount);
  });

  it('sitemap.xml contains exactly one <url> per deal (+ homepage)', () => {
    const sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');
    const urlCount = (sitemap.match(/<loc>/g) || []).length;
    expect(urlCount).toBe(dealCount + 1);
  });

  it('every deal in deals.jsonl has a generated detail page', () => {
    const missing = [];
    for (const id of dealIds) {
      const p = path.join(DEALS_DIR, id, 'index.html');
      if (!fs.existsSync(p)) missing.push(id);
    }
    expect(missing, `${missing.length} deal detail pages missing: ${missing.slice(0, 5).join(', ')}…`).toEqual([]);
  });

  it('no orphaned deal directories exist (every deals/ subdir has a matching deal)', () => {
    if (!fs.existsSync(DEALS_DIR)) return;
    const entries = fs.readdirSync(DEALS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);
    const orphans = entries.filter(name => !dealIds.has(name));
    expect(orphans, `orphaned deal dirs: ${orphans.slice(0, 5).join(', ')}…`).toEqual([]);
  });

  it('homepage has pre-rendered featured deal cards', () => {
    const html = fs.readFileSync(INDEX_PATH, 'utf-8');
    const cardCount = (html.match(/<div class="deal-card">/g) || []).length;
    expect(cardCount).toBeGreaterThanOrEqual(17);
  });

  it('homepage has at least 1700 readable words', () => {
    const html = fs.readFileSync(INDEX_PATH, 'utf-8');
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThanOrEqual(1700);
  });

  it('homepage has How It Works section', () => {
    const html = fs.readFileSync(INDEX_PATH, 'utf-8');
    expect(html).toContain('how-it-works-section');
    expect(html).toContain('how-it-works-item');
    expect(html).toContain('How DevCheap Works');
  });

  it('llms.txt exists after build', () => {
    expect(fs.existsSync(LLMS_PATH)).toBe(true);
    const content = fs.readFileSync(LLMS_PATH, 'utf-8');
    expect(content.length).toBeGreaterThan(1000);
    expect(content).toContain('# DevCheap');
    expect(content).toContain('## Categories');
  });

  it('homepage has stable @id in JSON-LD', () => {
    const html = fs.readFileSync(INDEX_PATH, 'utf-8');
    expect(html).toContain('"@id": "https://devcheap.click/#website"');
    expect(html).toContain('"@id": "https://devcheap.click/#organization"');
    expect(html).toContain('"sameAs"');
  });

  it('robots.txt explicitly allows AI crawlers', () => {
    const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf-8');
    expect(robots).toContain('User-agent: GPTBot');
    expect(robots).toContain('User-agent: Claude-Web');
    expect(robots).toContain('Allow: /');
  });
});
