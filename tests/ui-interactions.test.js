import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';

import fs from 'fs';
import path from 'path';

const DEALS_PATH = path.resolve('data/deals.jsonl');
const rawDeals = fs.readFileSync(DEALS_PATH, 'utf-8').split('\n').filter(Boolean);
const SAMPLE_DEALS = rawDeals.slice(0, 5).map(l => JSON.parse(l));
const SAMPLE_NO_CODE = [{ ...SAMPLE_DEALS[0], id: 'no-code-deal', code: undefined, name: 'NoCode Deal' }];

const { setupTheme } = window;
const PAGE_SIZE = 24;
const SAMPLE_DEALS_FULL = rawDeals.map(l => JSON.parse(l));
const SAMPLE_EXPIRING = [
  { id: 'a', name: 'AAA', category: 'AI', pricing: 'paid', deal: 'd', code: '', url: 'https://example.com', desc: 'd', tags: '', expires: '2026-12-01' },
  { id: 'b', name: 'BBB', category: 'AI', pricing: 'trial', deal: 'd', code: '', url: 'https://example.com', desc: 'd', tags: '', expires: '2026-07-15' },
  { id: 'c', name: 'CCC', category: 'AI', pricing: 'free', deal: 'd', code: '', url: 'https://example.com', desc: 'd', tags: '', expires: null },
  { id: 'd', name: 'DDD', category: 'AI', pricing: 'lifetime', deal: 'd', code: '', url: 'https://example.com', desc: 'd', tags: 'recommended', expires: '2026-01-01' },
];

describe('setupTheme', () => {
  function freshSetupTheme() {
    const oldBtn = document.getElementById('theme-toggle');
    if (oldBtn) {
      const clone = oldBtn.cloneNode(true);
      oldBtn.parentNode.replaceChild(clone, oldBtn);
    }
    setupTheme();
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  it('initializes with dark mode by default', () => {
    freshSetupTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('restores theme from localStorage', () => {
    localStorage.setItem('theme', 'light');
    freshSetupTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggles theme on button click', () => {
    freshSetupTheme();
    const btn = document.getElementById('theme-toggle');
    btn.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    btn.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('persists theme preference to localStorage', () => {
    freshSetupTheme();
    const btn = document.getElementById('theme-toggle');
    btn.click();
    expect(localStorage.getItem('theme')).toBe('light');
    btn.click();
    expect(localStorage.getItem('theme')).toBe('dark');
  });

it('shows dark icon in dark mode and light icon in light mode', () => {
  freshSetupTheme();
  const darkIcon = document.querySelector('.icon-sun');
  const lightIcon = document.querySelector('.icon-moon');
  expect(window.getComputedStyle(darkIcon).display).not.toBe('none');
  expect(window.getComputedStyle(lightIcon).display).toBe('none');
  document.getElementById('theme-toggle').click();
  expect(window.getComputedStyle(darkIcon).display).toBe('none');
  expect(window.getComputedStyle(lightIcon).display).not.toBe('none');
});
});

describe('Category filtering', () => {
  beforeAll(async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('no fetch')));
    await window.boot();
  });

  it('sets window.activeCategories on cat-btn click', () => {
    window.activeCategories = [];
    const btn = document.querySelector('.cat-btn[data-cat="hosting & cloud"]');
    btn.click();
    expect(Array.isArray(window.activeCategories)).toBe(true);
    expect(window.activeCategories).toContain('hosting & cloud');
  });

  it('activates clicked button and deactivates others', () => {
    window.activeCategories = [];
    document.querySelectorAll('.cat-btn').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelector('.cat-btn[data-cat="all"]').classList.add('active');
    document.querySelector('.cat-btn[data-cat="all"]').setAttribute('aria-selected', 'true');

    const allBtn = document.querySelector('.cat-btn[data-cat="all"]');
    const hostBtn = document.querySelector('.cat-btn[data-cat="hosting & cloud"]');
    hostBtn.click();
    expect(hostBtn.classList.contains('active')).toBe(true);
    expect(hostBtn.getAttribute('aria-selected')).toBe('true');
    expect(allBtn.classList.contains('active')).toBe(false);
    expect(allBtn.getAttribute('aria-selected')).toBe('false');
  });
});

describe('Search input', () => {
  beforeAll(async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('no fetch')));
    await window.boot();
  });

  it('shows clear button when search has text', () => {
    const input = document.getElementById('search-input');
    const clear = document.getElementById('clear-search-btn');
    clear.style.display = 'none';
    const inputEvent = new Event('input', { bubbles: true });
    input.value = 'supabase';
    input.dispatchEvent(inputEvent);
    expect(clear.style.display).toBe('flex');
  });

  it('hides clear button when search is empty', () => {
    const input = document.getElementById('search-input');
    const clear = document.getElementById('clear-search-btn');
    const inputEvent = new Event('input', { bubbles: true });
    input.value = '';
    input.dispatchEvent(inputEvent);
    expect(clear.style.display).toBe('none');
  });

it('clears search on clear button click', () => {
  const input = document.getElementById('search-input');
  const clear = document.getElementById('clear-search-btn');
  input.value = 'test';
  clear.click();
  expect(input.value).toBe('');
});

describe('Deal card rendering', () => {
  beforeEach(() => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
  });

  it('renders deal cards without crashing when data has a code field', async () => {
    window.dealsData = SAMPLE_DEALS;
    expect(() => window.renderDeals()).not.toThrow();
  });

  it('does not crash when a deal has no code field', async () => {
    window.dealsData = SAMPLE_NO_CODE;
    expect(() => window.renderDeals()).not.toThrow();
  });
});

});

describe('Sort select', () => {
  beforeEach(() => {
    window.__setDealsData(SAMPLE_EXPIRING);
    window.activeCategories = [];
    Object.keys(window.activeFilters || {}).forEach(k => { window.activeFilters && (window.activeFilters[k] = false); });
    const input = document.getElementById('search-input');
    if (input) input.value = '';
    const select = document.getElementById('sort-select');
    if (select) select.value = 'default';
    window.currentPage = 1;
    window.currentSort = 'default';
    history.replaceState(null, '', '/');
  });

  it('exposes sort select with 4 options', () => {
    const select = document.getElementById('sort-select');
    expect(select).not.toBeNull();
    expect([...select.options].map(o => o.value)).toEqual(['default', 'expiring', 'alphabetical', 'recommended']);
  });

  it('alphabetical sorts A→Z', () => {
    const result = window.sortDeals(SAMPLE_EXPIRING, 'alphabetical');
    expect(result.map(d => d.name)).toEqual(['AAA', 'BBB', 'CCC', 'DDD']);
  });

  it('expiring sorts nearest-soonest first, no-expiry at end', () => {
    const result = window.sortDeals(SAMPLE_EXPIRING, 'expiring');
    expect(result.map(d => d.id)).toEqual(['d', 'b', 'a', 'c']);
  });

  it('recommended surfaces recommended-tagged deals first', () => {
    const result = window.sortDeals(SAMPLE_EXPIRING, 'recommended');
    expect(result[0].id).toBe('d');
  });

  it('default preserves JSONL order', () => {
    const result = window.sortDeals(SAMPLE_EXPIRING, 'default');
    expect(result.map(d => d.id)).toEqual(SAMPLE_EXPIRING.map(d => d.id));
  });

  it('does not mutate the input array', () => {
    const origOrder = SAMPLE_EXPIRING.map(d => d.id);
    window.sortDeals(SAMPLE_EXPIRING, 'alphabetical');
    expect(SAMPLE_EXPIRING.map(d => d.id)).toEqual(origOrder);
  });

  it('updates ?sort= URL param on change', () => {
    const select = document.getElementById('sort-select');
    select.value = 'expiring';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(new URL(window.location.href).searchParams.get('sort')).toBe('expiring');
  });

  it('resets to page 1 on sort change', () => {
    window.currentPage = 3;
    const select = document.getElementById('sort-select');
    select.value = 'alphabetical';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(window.__getPageState().currentPage).toBe(1);
  });
});

describe('Pagination controls', () => {
beforeEach(() => {
  window.__setDealsData(SAMPLE_DEALS_FULL);
  window.resetModuleState();
  window.__setShowArchive(true);
  window.activeCategories = [];
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  history.replaceState(null, '', '/');
});

  it('renders pagination when filtered total > PAGE_SIZE', () => {
    window.renderDeals();
    const nav = document.getElementById('pagination');
    expect(nav.hidden).toBe(false);
    expect(nav.querySelectorAll('.page-btn').length).toBeGreaterThan(0);
  });

  it('hides pagination when <= PAGE_SIZE results', () => {
    window.__setDealsData(SAMPLE_DEALS.slice(0, 5));
    window.renderDeals();
    const nav = document.getElementById('pagination');
    expect(nav.hidden).toBe(true);
  });

  it('renders exactly one aria-current="page" button', () => {
    window.renderDeals();
    const nav = document.getElementById('pagination');
    expect(nav.querySelectorAll('.page-btn[aria-current="page"]').length).toBe(1);
  });

  it('disabled prev/next buttons also set aria-disabled', () => {
    window.renderDeals();
    const nav = document.getElementById('pagination');
    const prev = nav.querySelector('.page-prev');
    expect(prev.disabled).toBe(true);
    expect(prev.getAttribute('aria-disabled')).toBe('true');
  });

  it('clicking a page button updates currentPage', () => {
    window.renderDeals();
    const nav = document.getElementById('pagination');
    const pageBtn = [...nav.querySelectorAll('.page-btn')].find(b => b.dataset.page && b.dataset.page !== '1' && !b.classList.contains('page-prev') && !b.classList.contains('page-next'));
    if (!pageBtn) return;
    pageBtn.click();
    expect(window.__getPageState().currentPage).toBe(parseInt(pageBtn.dataset.page, 10));
  });

  it('uses pushState so URL ?page= updates on click', () => {
    window.renderDeals();
    const nav = document.getElementById('pagination');
    const pageBtn = [...nav.querySelectorAll('.page-btn')].find(b => b.dataset.page && b.dataset.page !== '1' && !b.classList.contains('page-prev') && !b.classList.contains('page-next'));
    if (!pageBtn) return;
    const target = parseInt(pageBtn.dataset.page, 10);
    pageBtn.click();
    expect(new URL(window.location.href).searchParams.get('page')).toBe(String(target));
  });

  it('next button is disabled on last page', () => {
    window.__setPage(999);
    window.renderDeals();
    const nav = document.getElementById('pagination');
    const next = nav.querySelector('.page-next');
    expect(next.disabled).toBe(true);
  });

  it('changing category resets page to 1', () => {
    window.currentPage = 3;
    const catBtn = document.querySelector('.cat-btn[data-cat="database"]');
    catBtn.click();
    expect(window.__getPageState().currentPage).toBe(1);
  });

  it('changing filter chip resets page to 1', () => {
    window.currentPage = 4;
    const chip = document.querySelector('.filter-chip[data-filter="recommended"]');
    chip.click();
    expect(window.__getPageState().currentPage).toBe(1);
  });

  it('changing pricing filter chip resets page to 1', () => {
    window.currentPage = 4;
    const chip = document.querySelector('.filter-chip[data-filter="free"]');
    chip.click();
    expect(window.__getPageState().currentPage).toBe(1);
  });

  it('clearing search resets page to 1', () => {
    window.currentPage = 5;
    const input = document.getElementById('search-input');
    const clear = document.getElementById('clear-search-btn');
    input.value = 'aws';
    clear.click();
    expect(window.__getPageState().currentPage).toBe(1);
  });

  it('clearing all filters resets page to 1 and sort to default', () => {
    window.currentPage = 4;
    window.currentSort = 'alphabetical';
    const select = document.getElementById('sort-select');
    if (select) select.value = 'alphabetical';
    window.renderDeals();
    const clearBtn = document.querySelector('.empty-clear-btn');
    if (!clearBtn) {
      window.__setDealsData([]);
      window.renderDeals();
      const anchor = document.querySelector('.empty-clear-btn');
      if (anchor) anchor.click();
    } else {
      clearBtn.click();
    }
    expect(window.__getPageState().currentPage).toBe(1);
    expect(window.__getPageState().currentSort).toBe('default');
  });

  it('restoreStateFromURL parses URL parameters', () => {
    window.history.replaceState(null, '', '/?page=5&sort=alphabetical');
    window.restoreStateFromURL();
    expect(window.__getPageState().currentPage).toBe(5);
    expect(window.__getPageState().currentSort).toBe('alphabetical');
  });

  it('computePageWindow collapses with ellipsis for > 7 pages', () => {
    expect(window.computePageWindow(5, 50)).toContain('...');
  });

  it('computePageWindow returns all pages when total <= 7', () => {
    expect(window.computePageWindow(3, 5)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('deal count text reflects current page window', () => {
    window.__setPage(2);
    window.renderDeals();
    const countEl = document.getElementById('deals-count');
    expect(/Showing 25–48 of \d+ (featured |all )?deals/.test(countEl.textContent)).toBe(true);
  });
});

describe('Pricing filter chips', () => {
  beforeEach(() => {
    window.__setDealsData(SAMPLE_EXPIRING);
    window.resetModuleState();
    window.__setShowArchive(true);
    window.activeCategories = [];
    const input = document.getElementById('search-input');
    if (input) input.value = '';
    document.querySelectorAll('.filter-chip.active').forEach(chip => chip.click());
    history.replaceState(null, '', '/');
  });

  ['free', 'trial', 'paid', 'lifetime'].forEach(filter => {
    it(`${filter} chip activates and filters deals by pricing`, () => {
      const chip = document.querySelector(`.filter-chip[data-filter="${filter}"]`);
      chip.click();
      expect(chip.classList.contains('active')).toBe(true);
      expect(chip.getAttribute('aria-pressed')).toBe('true');
      const cards = document.querySelectorAll('.deal-card');
      expect(cards.length).toBe(1);
      expect(cards[0].querySelector('.deal-card-title').textContent).toBe(
        SAMPLE_EXPIRING.find(d => d.pricing === filter).name
      );
    });
  });

  it('pricing chips are mutually exclusive', () => {
    const trialChip = document.querySelector('.filter-chip[data-filter="trial"]');
    const freeChip = document.querySelector('.filter-chip[data-filter="free"]');
    trialChip.click();
    freeChip.click();
    expect(trialChip.getAttribute('aria-pressed')).toBe('false');
    expect(freeChip.getAttribute('aria-pressed')).toBe('true');
  });

  it('renders pricing badge on deal cards', () => {
    window.__setDealsData([SAMPLE_EXPIRING[2]]);
    window.renderDeals();
    const badge = document.querySelector('.deal-card-badge-pricing--free');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('Free');
  });
});

describe('Overflow menu keyboard support', () => {
  it('opens overflow menu on Enter key', async () => {
    window.dealsData = SAMPLE_DEALS;
    window.activeCategories = [];
    window.currentPage = 1;
    window.currentSort = 'default';
    history.replaceState(null, '', '/');
    window.renderDeals();
    const overflowEls = document.querySelectorAll('.deal-card-overflow');
    if (overflowEls.length === 0) return;
    const overflow = overflowEls[0];
    const menu = overflow.querySelector('.overflow-menu');
    overflow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(menu.classList.contains('open')).toBe(true);
  });
});