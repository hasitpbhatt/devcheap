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
      expect(deal.expires).toBeDefined();
      expect(deal.pricing).toBeDefined(`deal[${i}] missing pricing`);
      expect(typeof deal.pricing).toBe('string');
      expect(deal.rating).toBeDefined(`deal[${i}] missing rating`);
      expect(typeof deal.rating).toBe('number');
      expect(deal.rating).toBeGreaterThanOrEqual(1);
      expect(deal.rating).toBeLessThanOrEqual(10);
    });
  });

  it('each deal has a valid pricing type', () => {
    const validPricing = ['free', 'trial', 'paid', 'lifetime'];
    deals.forEach((deal, i) => {
      expect(validPricing).toContain(deal.pricing);
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

  it('has known categories', () => {
    const validCategories = [
      'Hosting & Cloud', 'Database', 'APIs & Email', 'APIs & Payments',
      'APIs & Search', 'AI & LLM', 'Auth', 'Developer Tools',
      'Monitoring', 'Domains & Hosting', 'Storage & Cloud', 'Security',
      'Productivity', 'SEO', 'AI', 'Social Media', 'Customer Support',
      'Sales & Marketing', 'Services', 'Design & Collaboration',
      'Web Analytics', 'Media & Images', 'CI/CD', 'Testing & QA'
    ];
    expect(new Set(validCategories).size).toBe(validCategories.length);
    deals.forEach((deal, i) => {
      expect(validCategories).toContain(deal.category);
    });
  });

  it('has_affiliate and affiliate_url are consistent', () => {
    deals.forEach((deal, i) => {
      const hasUrl = Boolean(deal.affiliate_url && deal.affiliate_url.trim());
      const msg = `deal[${i}] ${deal.id}: has_affiliate=${deal.has_affiliate} but affiliate_url=${JSON.stringify(deal.affiliate_url)}`;
      if (deal.has_affiliate) {
        expect(hasUrl, msg).toBe(true);
        expect(() => new URL(deal.affiliate_url), `deal[${i}] ${deal.id} invalid affiliate_url`).not.toThrow();
      } else {
        expect(hasUrl, msg).toBe(false);
      }
    });
  });

  it('ids are URL-safe slugs (lowercase, [a-z0-9-])', () => {
    deals.forEach((deal, i) => {
      expect(deal.id, `deal[${i}] id not a slug`).toMatch(/^[a-z0-9-]+$/);
    });
  });

  it('expires is null or a valid ISO date', () => {
    deals.forEach((deal, i) => {
      if (deal.expires === null) return;
      expect(typeof deal.expires, `deal[${i}] ${deal.id} expires type`).toBe('string');
      const t = new Date(deal.expires).getTime();
      expect(Number.isFinite(t), `deal[${i}] ${deal.id} unparseable expires: ${deal.expires}`).toBe(true);
    });
  });

  it('each deal has at least one tag', () => {
    deals.forEach((deal, i) => {
      expect(deal.tags).toBeDefined();
      expect(deal.tags.split(',').length).toBeGreaterThanOrEqual(1);
    });
  });
});
