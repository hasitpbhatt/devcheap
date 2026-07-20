import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const LLMS_PATH = path.join(ROOT, 'llms.txt');
const DEALS_PATH = path.join(ROOT, 'data', 'deals.jsonl');

const deals = fs.readFileSync(DEALS_PATH, 'utf-8')
  .split('\n').filter(Boolean).map(l => JSON.parse(l));
const dealCount = deals.length;
const categories = new Set(deals.map(d => d.category));
const topRated = deals.filter(d => d.rating >= 8.0).length;

describe('llms.txt', () => {
  it('exists after build', () => {
    expect(fs.existsSync(LLMS_PATH)).toBe(true);
  });

  it('starts with an H1 title', () => {
    const content = fs.readFileSync(LLMS_PATH, 'utf-8');
    expect(content.startsWith('# DevCheap')).toBe(true);
  });

  it('contains ## Featured section', () => {
    const content = fs.readFileSync(LLMS_PATH, 'utf-8');
    expect(content).toContain('## Featured');
  });

  it('contains ## Top Deals section', () => {
    const content = fs.readFileSync(LLMS_PATH, 'utf-8');
    expect(content).toContain('## Top Deals');
  });

  it('contains ## Categories section', () => {
    const content = fs.readFileSync(LLMS_PATH, 'utf-8');
    expect(content).toContain('## Categories');
  });

  it('contains ## About section', () => {
    const content = fs.readFileSync(LLMS_PATH, 'utf-8');
    expect(content).toContain('## About');
  });

  it('mentions the correct total deal count', () => {
    const content = fs.readFileSync(LLMS_PATH, 'utf-8');
    expect(content).toContain(String(dealCount));
  });

  it('mentions the correct category count', () => {
    const content = fs.readFileSync(LLMS_PATH, 'utf-8');
    expect(content).toContain(String(categories.size));
  });

  it('includes links to devcheap.click', () => {
    const content = fs.readFileSync(LLMS_PATH, 'utf-8');
    const links = (content.match(/https:\/\/devcheap\.click/g) || []).length;
    expect(links).toBeGreaterThanOrEqual(2);
  });

  it('lists at least 1 top-rated deal', () => {
    const content = fs.readFileSync(LLMS_PATH, 'utf-8');
    const topLines = content.match(/\[rating:/g);
    expect(topLines ? topLines.length : 0).toBeGreaterThanOrEqual(Math.min(topRated, 15));
  });

  it('is not empty', () => {
    const content = fs.readFileSync(LLMS_PATH, 'utf-8');
    expect(content.trim().length).toBeGreaterThan(500);
  });
});
