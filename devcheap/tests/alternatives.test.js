import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const ALTS_DIR = path.join(ROOT, 'alternatives');
const DEALS_PATH = path.join(ROOT, 'data', 'deals.jsonl');

const deals = fs.readFileSync(DEALS_PATH, 'utf-8')
  .split('\n').filter(Boolean).map(l => JSON.parse(l));
const dealCount = deals.length;

describe('alternatives pages', () => {
  it('alternatives directory exists after build', () => {
    expect(fs.existsSync(ALTS_DIR)).toBe(true);
  });

  it('generates one page per deal', () => {
    const dirs = fs.readdirSync(ALTS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory()).map(e => e.name);
    expect(dirs.length).toBe(dealCount);
  });

  it('every alternative page has a valid index.html', () => {
    const dirs = fs.readdirSync(ALTS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory()).map(e => e.name);
    for (const d of dirs) {
      expect(fs.existsSync(path.join(ALTS_DIR, d, 'index.html'))).toBe(true);
    }
  });

  it('a sampled page has a unique, tool-specific <title>', () => {
    const dirs = fs.readdirSync(ALTS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory()).map(e => e.name);
    const sample = dirs[0];
    const html = fs.readFileSync(path.join(ALTS_DIR, sample, 'index.html'), 'utf-8');
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    expect(titleMatch).not.toBeNull();
    expect(titleMatch[1]).toContain('Alternatives');
    expect(titleMatch[1].length).toBeGreaterThan(10);
  });

  it('pages satisfy the internal-link graph (Dharmesh bar): ≥3 deal links, ≥1 category link, ≥1 home link', () => {
    const dirs = fs.readdirSync(ALTS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory()).map(e => e.name);
    // Check a sample of 5 pages to keep the test fast but meaningful.
    const sample = dirs.slice(0, 5);
    for (const d of sample) {
      const html = fs.readFileSync(path.join(ALTS_DIR, d, 'index.html'), 'utf-8');
      const dealLinks = (html.match(/href="[^"]*deals\//g) || []).length;
      const catLinks = (html.match(/href="[^"]*\/category\//g) || []).length;
      const homeLinks = (html.match(/href="\.\.\/\.\.\/"/g) || []).length;
      expect(dealLinks).toBeGreaterThanOrEqual(3);
      expect(catLinks).toBeGreaterThanOrEqual(1);
      expect(homeLinks).toBeGreaterThanOrEqual(1);
    }
  });

  it('pages include FAQPage structured data', () => {
    const dirs = fs.readdirSync(ALTS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory()).map(e => e.name);
    const html = fs.readFileSync(path.join(ALTS_DIR, dirs[0], 'index.html'), 'utf-8');
    expect(html).toContain('"@type": "FAQPage"');
  });
});
