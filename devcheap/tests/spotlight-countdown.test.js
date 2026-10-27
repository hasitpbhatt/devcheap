import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Guards the two new client-side traction features against regressions:
// - renderSpotlight: deterministic daily AI-credit pick
// - updateExpiryCountdowns: live "Expires in Nd Mh" badge with urgent state

const DEALS_PATH = path.resolve('data/deals.jsonl');
const ALL_DEALS = fs.readFileSync(DEALS_PATH, 'utf-8')
  .split('\n').filter(Boolean).map(l => JSON.parse(l));

function withData(fn) {
  const prev = window.__setDealsData;
  return () => {
    const restore = () => { if (prev) window.__setDealsData(ALL_DEALS); };
    try {
      fn(restore);
    } finally {
      restore && restore();
    }
  };
}

describe('renderSpotlight', () => {
  const section = () => document.getElementById('spotlight');
  const nameEl = () => document.getElementById('spotlight-name');
  const dealEl = () => document.getElementById('spotlight-deal');
  const link = () => document.getElementById('spotlight-link');

  beforeEach(() => {
    window.__setDealsData(ALL_DEALS);
  });

  it('unhides the spotlight section and populates the card', () => {
    section().hidden = true;
    window.renderSpotlight();
    expect(section().hidden).toBe(false);
    expect(nameEl().textContent).not.toBe('');
    expect(dealEl().textContent).not.toBe('');
    expect(link().href).toMatch(/^https?:\/\//);
  });

  it('deterministic pick is stable within the same UTC day', () => {
    window.renderSpotlight();
    const pick1 = nameEl().textContent;
    window.renderSpotlight();
    const pick2 = nameEl().textContent;
    expect(pick2).toBe(pick1);
  });

  it('prefers AI-category deals tagged recommended or spotlight', () => {
    window.renderSpotlight();
    const pickName = nameEl().textContent;
    const picked = ALL_DEALS.find(d => d.name === pickName);
    expect(picked, `pick "${pickName}" not in deals.jsonl`).toBeDefined();
    const isAI = (picked.category || '').toLowerCase().includes('ai');
    const isTagged = picked.tags && (picked.tags.toLowerCase().includes('spotlight') || picked.tags.toLowerCase().includes('recommended'));
    // Allow either condition — falls back to recommended pool if no AI deals.
    expect(isAI || isTagged).toBe(true);
  });

  it('hides the spotlight when no recommended/spotlight deals exist', () => {
    window.__setDealsData([{ id: 'x', name: 'X', category: 'Other', pricing: 'free', deal: 'd', code: '', url: 'https://example.com', desc: 'd', tags: '' }]);
    section().hidden = false;
    window.renderSpotlight();
    expect(section().hidden).toBe(true);
  });
});

describe('updateExpiryCountdowns', () => {
  function makeCard(expires, id = 'exp-x') {
    const grid = document.getElementById('deals-grid');
    grid.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'deal-card';
    const span = document.createElement('span');
    span.className = 'deal-card-expires';
    span.dataset.expires = expires;
    span.textContent = `Expires ${expires}`;
    card.appendChild(span);
    grid.appendChild(card);
    return span;
  }

  beforeEach(() => {
    document.getElementById('deals-grid').innerHTML = '';
  });

  it('renders "Expires in Nd Mh" for a future date within 30 days', () => {
    const future = new Date(Date.now() + 5 * 86400000 + 3 * 3600000).toISOString();
    const span = makeCard(future);
    window.updateExpiryCountdowns();
    expect(span.textContent).toMatch(/Expires in 5d 3h|Expires in 5d 2h/);
    expect(span.classList.contains('deal-card-expires--urgent')).toBe(true);
  });

  it('renders "Expired" for a past date', () => {
    const span = makeCard('2020-01-01');
    window.updateExpiryCountdowns();
    expect(span.textContent).toBe('Expired');
    expect(span.classList.contains('deal-card-expires--urgent')).toBe(true);
  });

  it('renders "~Nmo" for dates beyond 30 days out', () => {
    const future = new Date();
    future.setMonth(future.getMonth() + 3);
    const span = makeCard(future.toISOString());
    window.updateExpiryCountdowns();
    expect(span.textContent).toMatch(/Expires in ~3mo/);
    expect(span.classList.contains('deal-card-expires--urgent')).toBe(false);
  });
});
