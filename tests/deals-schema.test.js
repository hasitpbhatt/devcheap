import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const raw = fs.readFileSync(path.resolve('data/deals.jsonl'), 'utf-8');
const deals = raw.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

describe('deals.json schema', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(deals)).toBe(true);
    expect(deals.length).toBeGreaterThan(0);
  });

  it('each deal has required fields', () => {
    deals.forEach((deal, i) => {
      expect(deal.id).toBeDefined(`deal[${i}] missing id`);
      expect(typeof deal.id).toBe('string');
      expect(deal.name).toBeDefined(`deal[${i}] missing name`);
      expect(typeof deal.name).toBe('string');
      expect(deal.category).toBeDefined(`deal[${i}] missing category`);
      expect(typeof deal.category).toBe('string');
      expect(deal.deal).toBeDefined(`deal[${i}] missing deal`);
      expect(typeof deal.deal).toBe('string');
      expect(deal.code).toBeDefined(`deal[${i}] missing code`);
      expect(typeof deal.code).toBe('string');
      expect(deal.url).toBeDefined(`deal[${i}] missing url`);
      expect(typeof deal.url).toBe('string');
      expect(deal.desc).toBeDefined(`deal[${i}] missing desc`);
      expect(typeof deal.desc).toBe('string');
      expect(deal.tracking_id).toBeDefined(`deal[${i}] missing tracking_id`);
      expect(typeof deal.tracking_id).toBe('string');
      expect(deal.has_affiliate).toBeDefined(`deal[${i}] missing has_affiliate`);
      expect(typeof deal.has_affiliate).toBe('boolean');
      expect(deal.affiliate_url).toBeDefined(`deal[${i}] missing affiliate_url`);
      expect(typeof deal.affiliate_url).toBe('string');
      expect(deal.why).toBeDefined(`deal[${i}] missing why`);
      expect(typeof deal.why).toBe('string');
      expect(deal.expires).toBeDefined(`deal[${i}] missing expires`);
    });
  });

  it('all ids are unique', () => {
    const ids = deals.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all tracking_ids are unique', () => {
    const tids = deals.map(d => d.tracking_id);
    expect(new Set(tids).size).toBe(tids.length);
  });

  it('all urls are valid URLs', () => {
    deals.forEach((deal, i) => {
      expect(() => new URL(deal.url)).not.toThrow(`deal[${i}] invalid url: ${deal.url}`);
    });
  });

  it('affiliate_url is a valid URL when has_affiliate is true', () => {
    deals.filter(d => d.has_affiliate).forEach((deal, i) => {
      expect(() => new URL(deal.affiliate_url)).not.toThrow(
        `deal ${deal.id} has_affiliate=true but affiliate_url is invalid: ${deal.affiliate_url}`
      );
    });
  });

  it('has known categories', () => {
    const validCategories = [
      'Hosting & Cloud', 'Database', 'APIs & Email', 'APIs & Payments',
      'APIs & Search', 'AI & LLM', 'Auth', 'Developer Tools',
      'Monitoring', 'Domains & Hosting', 'Storage & Cloud', 'Security',
      'Productivity', 'SEO', 'AI', 'Social Media', 'Customer Support',
      'Sales & Marketing', 'Services', 'APIs & Email', 'APIs & Payments'
    ];
    deals.forEach((deal, i) => {
      expect(validCategories).toContain(deal.category);
    });
  });

  it('each deal has at least one tag', () => {
    deals.forEach((deal, i) => {
      expect(deal.tags).toBeDefined();
      expect(deal.tags.split(',').length).toBeGreaterThanOrEqual(1);
    });
  });
});
