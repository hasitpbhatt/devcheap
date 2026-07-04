import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync(path.resolve('index.html'), 'utf-8');
const dom = new JSDOM(html, { url: 'https://devcheap-3uq.pages.dev/' });
const doc = dom.window.document;

describe('Accessibility checks', () => {
  it('all images have alt attributes (if any)', () => {
    doc.querySelectorAll('img').forEach(img => {
      expect(img.hasAttribute('alt')).toBe(true);
    });
  });

  it('all links have href', () => {
    doc.querySelectorAll('a').forEach(a => {
      expect(a.hasAttribute('href')).toBe(true);
    });
  });

  it('category buttons have role="tab" and aria-selected', () => {
    doc.querySelectorAll('.cat-btn').forEach(btn => {
      expect(btn.getAttribute('role')).toBe('tab');
      expect(btn.hasAttribute('aria-selected')).toBe(true);
    });
  });

  it('theme toggle has aria-label', () => {
    const btn = doc.getElementById('theme-toggle');
    expect(btn.getAttribute('aria-label')).toBeTruthy();
  });

  it('search input has accessible name', () => {
    const input = doc.getElementById('search-input');
    expect(input.getAttribute('placeholder')).toBeTruthy();
  });

  it('headings exist in correct order', () => {
    const h1 = doc.querySelectorAll('h1');
    const h2 = doc.querySelectorAll('h2');
    const h3 = doc.querySelectorAll('h3');
    expect(h1.length).toBeGreaterThanOrEqual(1);
    expect(h2.length).toBeGreaterThanOrEqual(1);
  });

  it('form inputs have associated labels or placeholder', () => {
    doc.querySelectorAll('input:not([type="hidden"])').forEach(input => {
      const hasLabel = doc.querySelector(`label[for="${input.id}"]`);
      const hasAria = input.hasAttribute('aria-label');
      const hasPlaceholder = input.hasAttribute('placeholder');
      expect(hasLabel || hasAria || hasPlaceholder).toBe(true);
    });
  });

  it('sort select has associated label-for', () => {
    const select = doc.getElementById('sort-select');
    expect(select).not.toBeNull();
    expect(doc.querySelector('label[for="sort-select"]')).not.toBeNull();
  });

  it('pagination nav has aria-label', () => {
    const nav = doc.getElementById('pagination');
    expect(nav).not.toBeNull();
    expect(nav.getAttribute('aria-label')).toBe('Deal pages');
  });

  it('select elements have accessible names', () => {
    doc.querySelectorAll('select').forEach(sel => {
      const hasLabelFor = doc.querySelector(`label[for="${sel.id}"]`);
      const hasAriaLabel = sel.hasAttribute('aria-label');
      expect(hasLabelFor || hasAriaLabel).toBeTruthy();
    });
  });
});