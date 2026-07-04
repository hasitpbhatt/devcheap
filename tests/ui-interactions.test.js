import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';

const { setupTheme } = window;

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
});