import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';

const { setupTheme, setupNewsletterPopup } = window;

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
    const darkIcon = document.querySelector('.theme-icon-dark');
    const lightIcon = document.querySelector('.theme-icon-light');
    expect(window.getComputedStyle(darkIcon).display).not.toBe('none');
    expect(window.getComputedStyle(lightIcon).display).toBe('none');
    document.getElementById('theme-toggle').click();
    expect(window.getComputedStyle(darkIcon).display).toBe('none');
    expect(window.getComputedStyle(lightIcon).display).not.toBe('none');
  });
});

describe('Newsletter popup', () => {
  beforeEach(() => {
    localStorage.clear();
    document.getElementById('popup').classList.remove('show');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('shows popup after 5 seconds if not dismissed', () => {
    setupNewsletterPopup();
    expect(document.getElementById('popup').classList.contains('show')).toBe(false);
    vi.advanceTimersByTime(5000);
    expect(document.getElementById('popup').classList.contains('show')).toBe(true);
  });

  it('does not show popup if previously dismissed', () => {
    localStorage.setItem('devcheap_popup_dismissed', 'true');
    setupNewsletterPopup();
    expect(document.getElementById('popup').classList.contains('show')).toBe(false);
  });

  it('dismisses popup on close button click', () => {
    setupNewsletterPopup();
    document.getElementById('popup').classList.add('show');
    document.getElementById('popup-close').click();
    expect(document.getElementById('popup').classList.contains('show')).toBe(false);
    expect(localStorage.getItem('devcheap_popup_dismissed')).toBe('true');
  });

  it('dismisses popup on overlay click', () => {
    setupNewsletterPopup();
    document.getElementById('popup').classList.add('show');
    document.getElementById('popup').click();
    expect(document.getElementById('popup').classList.contains('show')).toBe(false);
  });
});

describe('Category filtering', () => {
  beforeAll(async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('no fetch')));
    await window.boot();
  });

  it('sets window.currentCategory on cat-btn click', () => {
    window.currentCategory = 'all';
    const btn = document.querySelector('.cat-btn[data-cat="hosting"]');
    btn.click();
    expect(window.currentCategory).toBe('hosting');
  });

  it('activates clicked button and deactivates others', () => {
    window.currentCategory = 'all';
    document.querySelectorAll('.cat-btn').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelector('.cat-btn[data-cat="all"]').classList.add('active');
    document.querySelector('.cat-btn[data-cat="all"]').setAttribute('aria-selected', 'true');

    const allBtn = document.querySelector('.cat-btn[data-cat="all"]');
    const hostBtn = document.querySelector('.cat-btn[data-cat="hosting"]');
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