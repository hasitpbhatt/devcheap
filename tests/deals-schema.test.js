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
      // tracking_id is required only for affiliate deals; non-affiliate deals don't need it
      if (deal.has_affiliate) {
        expect(deal.tracking_id, `affiliate deal[${i}] ${deal.id} missing tracking_id`).toBeDefined();
        expect(typeof deal.tracking_id).toBe('string');
      }
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

  it('all tracking_ids are unique (affiliate deals only)', () => {
    const tids = deals.filter(d => d.has_affiliate).map(d => d.tracking_id);
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
      'Web Analytics', 'Media & Images', 'CI/CD', 'Testing & QA',
      'Students & Education', 'Open Source Programs', 'GPU Compute',
      'Startup Perks', 'Self-Hosted Tools'
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

  it('requiresProgram, when present, is false, "startup", "student", or "accelerator"', () => {
    const valid = [false, 'startup', 'student', 'accelerator'];
    deals.forEach((deal, i) => {
      if (deal.requiresProgram === undefined) return;
      expect(valid, `deal[${i}] ${deal.id} invalid requiresProgram: ${JSON.stringify(deal.requiresProgram)}`).toContain(deal.requiresProgram);
    });
  });

const CORRUPT_DEAL_VALUE_RE = /playwright-mcp|\.\.\/|\.yml/i;

it('each deal has at least one tag', () => {
  deals.forEach((deal, i) => {
    expect(deal.tags).toBeDefined();
    expect(deal.tags.split(',').length).toBeGreaterThanOrEqual(1);
  });
});

it('deal values do not contain file-path or playwright-artifact contamination', () => {
  const textFields = ['deal', 'desc', 'why', 'tags'];
  deals.forEach((deal, i) => {
    textFields.forEach((field) => {
      const value = deal[field];
      if (typeof value === 'string' && CORRUPT_DEAL_VALUE_RE.test(value)) {
        throw new Error(
          `deal[${i}] ${deal.id} field="${field}" contains a suspect value: ${value}`
        );
      }
    });
  });
});
});

// The eligibility block is what makes a deal page defensible rather than
// promotional: offer type, who may claim, the gates, and the source. These
// assertions keep that metadata machine-checkable instead of prose.
describe('deal eligibility schema', () => {
  const OFFER_TYPES = ['credits', 'free_plan', 'allocation', 'membership', 'stepped_discount', 'discount', 'spend_match'];
  const STATUSES = ['active', 'unverified', 'paused', 'retired'];
  const DISCLOSURES = ['editorial', 'affiliate'];
  const AUDIENCES = ['anyone', 'developer', 'oss', 'startup', 'scaleup', 'sme', 'student', 'researcher', 'accelerator'];
  const GATE_KEYS = ['card', 'phone', 'kyc', 'oauth', 'captcha'];
  const CLAIM_METHODS = ['link', 'coupon', 'form', 'application', 'self-serve', 'none'];

  it('offer_type, when present, is one of the documented values', () => {
    deals.forEach((deal) => {
      if (deal.offer_type === undefined) return;
      expect(OFFER_TYPES, `${deal.id} offer_type=${deal.offer_type}`).toContain(deal.offer_type);
    });
  });

  it('status, when present, is one of the documented values', () => {
    deals.forEach((deal) => {
      if (deal.status === undefined) return;
      expect(STATUSES, `${deal.id} status=${deal.status}`).toContain(deal.status);
    });
  });

  it('disclosure matches has_affiliate', () => {
    deals.forEach((deal) => {
      const expected = deal.has_affiliate ? 'affiliate' : 'editorial';
      const actual = deal.disclosure === undefined ? expected : deal.disclosure;
      expect(DISCLOSURES, `${deal.id} disclosure=${deal.disclosure}`).toContain(actual);
      expect(actual, `${deal.id}: has_affiliate=${deal.has_affiliate} but disclosure=${deal.disclosure}`).toBe(expected);
    });
  });

  it('value, when present, is a headline plus a nullable usd/unit pair', () => {
    deals.forEach((deal) => {
      if (deal.value === undefined) return;
      const { headline, usd, unit } = deal.value;
      expect(typeof headline, `${deal.id} value.headline`).toBe('string');
      expect(headline.trim().length, `${deal.id} value.headline is empty`).toBeGreaterThan(0);
      expect(['object'], `${deal.id} value`).toContain(typeof deal.value);
      if (usd === null || usd === undefined) {
        // A null amount must not carry a unit, or the pair reads as a real figure.
        expect(unit ?? null, `${deal.id} value.unit set without value.usd`).toBe(null);
      } else {
        expect(typeof usd, `${deal.id} value.usd`).toBe('number');
        expect(Number.isFinite(usd), `${deal.id} value.usd not finite`).toBe(true);
        expect(usd, `${deal.id} value.usd negative`).toBeGreaterThanOrEqual(0);
        expect(typeof unit, `${deal.id} value.unit`).toBe('string');
      }
    });
  });

  it('eligibility, when present, uses documented audiences and typed ceilings', () => {
    const BOOL_KEYS = ['incorporation_required', 'referral_required', 'partner_code_required', 'new_customers_only', 'company_email_required', 'card_required'];
    const NUM_KEYS = ['funding_max_usd', 'company_age_max_years', 'employees_max'];
    const GEO_KEYS = ['geo_allow', 'geo_exclude'];

    deals.forEach((deal) => {
      const el = deal.eligibility;
      if (el === undefined) return;
      expect(typeof el, `${deal.id} eligibility`).toBe('object');

      if (el.audience !== undefined) {
        expect(Array.isArray(el.audience), `${deal.id} eligibility.audience not an array`).toBe(true);
        expect(el.audience.length, `${deal.id} eligibility.audience empty`).toBeGreaterThan(0);
        el.audience.forEach((a) => {
          expect(AUDIENCES, `${deal.id} eligibility.audience value=${a}`).toContain(a);
        });
      }

      BOOL_KEYS.forEach((k) => {
        if (el[k] === undefined) return;
        expect(typeof el[k], `${deal.id} eligibility.${k}`).toBe('boolean');
      });

      NUM_KEYS.forEach((k) => {
        if (el[k] === undefined || el[k] === null) return;
        expect(typeof el[k], `${deal.id} eligibility.${k}`).toBe('number');
        expect(Number.isFinite(el[k]), `${deal.id} eligibility.${k} not finite`).toBe(true);
        expect(el[k], `${deal.id} eligibility.${k} negative`).toBeGreaterThanOrEqual(0);
      });

      GEO_KEYS.forEach((k) => {
        if (el[k] === undefined) return;
        expect(Array.isArray(el[k]), `${deal.id} eligibility.${k} not an array`).toBe(true);
        el[k].forEach((geo) => {
          expect(typeof geo, `${deal.id} eligibility.${k} entry`).toBe('string');
        });
      });
    });
  });

  it('terms, when present, is typed and carries no expired-window claims', () => {
    deals.forEach((deal) => {
      const t = deal.terms;
      if (t === undefined) return;
      expect(typeof t, `${deal.id} terms`).toBe('object');

      ['stackable', 'renewable'].forEach((k) => {
        if (t[k] === undefined) return;
        expect(typeof t[k], `${deal.id} terms.${k}`).toBe('boolean');
      });

      ['expiry_days', 'activation_window_days'].forEach((k) => {
        if (t[k] === undefined || t[k] === null) return;
        expect(typeof t[k], `${deal.id} terms.${k}`).toBe('number');
        expect(Number.isInteger(t[k]), `${deal.id} terms.${k} not an integer`).toBe(true);
        expect(t[k], `${deal.id} terms.${k} must be positive`).toBeGreaterThan(0);
      });

      if (t.post_credit_billing !== undefined && t.post_credit_billing !== null) {
        expect(typeof t.post_credit_billing, `${deal.id} terms.post_credit_billing`).toBe('string');
        expect(t.post_credit_billing.trim().length, `${deal.id} terms.post_credit_billing empty`).toBeGreaterThan(0);
      }
    });
  });

  it('gates, when present, are tri-state and ease_score is a 0-100 number', () => {
    deals.forEach((deal) => {
      const g = deal.gates;
      if (g === undefined) return;
      expect(typeof g, `${deal.id} gates`).toBe('object');

      GATE_KEYS.forEach((k) => {
        if (g[k] === undefined) return;
        // null means "not established" and must stay distinct from false.
        expect([true, false, null], `${deal.id} gates.${k}=${JSON.stringify(g[k])}`).toContain(g[k]);
      });

      if (g.ease_score !== undefined && g.ease_score !== null) {
        expect(typeof g.ease_score, `${deal.id} gates.ease_score`).toBe('number');
        expect(g.ease_score, `${deal.id} gates.ease_score below range`).toBeGreaterThanOrEqual(0);
        expect(g.ease_score, `${deal.id} gates.ease_score above range`).toBeLessThanOrEqual(100);
      }
    });
  });

  it('verification, when present, cites a date and a fetchable source', () => {
    deals.forEach((deal) => {
      const v = deal.verification;
      if (v === undefined) return;
      expect(typeof v.source_url, `${deal.id} verification.source_url`).toBe('string');
      expect(() => new URL(v.source_url), `${deal.id} verification.source_url invalid`).not.toThrow();
      expect(typeof v.verified_at, `${deal.id} verification.verified_at`).toBe('string');
      expect(Number.isFinite(new Date(v.verified_at).getTime()), `${deal.id} verification.verified_at unparseable`).toBe(true);
      expect(v.verified_at, `${deal.id} verification.verified_at not ISO yyyy-mm-dd`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof v.verified_by, `${deal.id} verification.verified_by`).toBe('string');
    });
  });

  it('claim, when present, points at a real URL with a documented method', () => {
    deals.forEach((deal) => {
      const c = deal.claim;
      if (c === undefined) return;
      expect(typeof c.url, `${deal.id} claim.url`).toBe('string');
      expect(() => new URL(c.url), `${deal.id} claim.url invalid`).not.toThrow();
      expect(CLAIM_METHODS, `${deal.id} claim.method=${c.method}`).toContain(c.method);
    });
  });

  it('a retired deal is never given a claim action', () => {
    deals.filter(d => d.status === 'retired').forEach((deal) => {
      expect(deal.claim, `${deal.id} is retired and must record claim.method "none"`).toBeDefined();
      expect(deal.claim.method, `${deal.id} is retired but claim.method=${deal.claim.method}`).toBe('none');
    });
  });
});
