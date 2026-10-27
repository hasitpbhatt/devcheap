import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const RAW = fs.readFileSync(path.resolve('data/llm-providers.json'), 'utf-8');
const providers = JSON.parse(RAW);

const VALID_STATUSES = new Set(['active', 'gated', 'trial', 'retired', 'beta', 'warning']);
const VALID_GATES = new Set(['none', 'cloudflare', 'captcha', 'card', 'phone', 'oauth', 'kyc']);

describe('llm-providers.json schema', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(100);
  });

  it('each provider has required fields', () => {
    providers.forEach((p, i) => {
      expect(p.id, `provider[${i}] missing id`).toBeDefined();
      expect(typeof p.id).toBe('string');
      expect(p.name, `provider[${i}] missing name`).toBeDefined();
      expect(p.domain, `provider[${i}] missing domain`).toBeDefined();
      expect(typeof p.isLLM).toBe('boolean');
      expect(p.type, `provider[${i}] missing type`).toBeDefined();
      expect(Array.isArray(p.gates), `provider[${i}] gates not array`).toBe(true);
      expect(typeof p.ease).toBe('number');
      expect(p.ease).toBeGreaterThanOrEqual(0);
      expect(p.ease).toBeLessThanOrEqual(100);
      expect(p.status, `provider[${i}] missing status`).toBeDefined();
      expect(VALID_STATUSES.has(p.status), `provider[${i}] ${p.id} bad status ${p.status}`).toBe(true);
      expect(p.signupUrl, `provider[${i}] missing signupUrl`).toBeDefined();
      p.gates.forEach((g) => expect(VALID_GATES.has(g), `provider[${i}] ${p.id} bad gate ${g}`).toBe(true));
    });
  });

  it('every provider has at least one gate label (none = no gate)', () => {
    providers.forEach((p) => {
      expect(p.gates.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('ids are unique url-safe slugs', () => {
    const ids = providers.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9-]+$/));
  });

  it('dealId, when present, references a real deal id', () => {
    const rawDeals = fs.readFileSync(path.resolve('data/deals.jsonl'), 'utf-8')
      .split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const dealIds = new Set(rawDeals.map((d) => d.id));
    providers.filter((p) => p.dealId).forEach((p) => {
      expect(dealIds.has(p.dealId), `provider ${p.id} dealId ${p.dealId} not in deals.jsonl`).toBe(true);
    });
  });
});
