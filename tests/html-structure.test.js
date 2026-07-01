import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('HTML structure', () => {
  it('has a valid <title>', () => {
    const title = document.querySelector('title');
    expect(title).not.toBeNull();
    expect(title.textContent.trim()).toBeTruthy();
  });

  it('has meta description', () => {
    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta.getAttribute('content').trim()).toBeTruthy();
  });

  it('has Open Graph meta tags', () => {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    expect(ogTitle).not.toBeNull();
    expect(ogDesc).not.toBeNull();
  });

  it('loads style.css', () => {
    const link = document.querySelector('link[rel="stylesheet"][href="css/style.css"]');
    expect(link).not.toBeNull();
  });

  it('loads search.js', () => {
    const script = document.querySelector('script[src="js/search.js"]');
    expect(script).not.toBeNull();
  });

  it('has a main element', () => {
    const main = document.querySelector('main');
    expect(main).not.toBeNull();
  });
});

describe('Deals section', () => {
  it('has search input', () => {
    const input = document.getElementById('search-input');
    expect(input).not.toBeNull();
  });

  it('has deals grid container', () => {
    const grid = document.getElementById('deals-grid');
    expect(grid).not.toBeNull();
  });

  it('has deals count element', () => {
    const count = document.getElementById('deals-count');
    expect(count).not.toBeNull();
  });

  it('has category filter buttons', () => {
    const cats = document.querySelectorAll('.cat-btn');
    expect(cats.length).toBeGreaterThanOrEqual(5);
  });

  it('has "All" category as default active', () => {
    const allBtn = document.querySelector('.cat-btn.active');
    expect(allBtn).not.toBeNull();
    expect(allBtn.dataset.cat).toBe('all');
  });
});

describe('Newsletter section', () => {
  it('has a newsletter section', () => {
    const section = document.getElementById('newsletter');
    expect(section).not.toBeNull();
  });

  it('has newsletter badge', () => {
    const badge = document.querySelector('.newsletter-badge');
    expect(badge).not.toBeNull();
  });

  it('has newsletter description', () => {
    const desc = document.querySelector('.newsletter-desc');
    expect(desc).not.toBeNull();
  });
});

describe('Hero section', () => {
  it('has a headline', () => {
    const h1 = document.querySelector('.hero-title');
    expect(h1).not.toBeNull();
    expect(h1.textContent.trim()).toBeTruthy();
  });

  it('has stat counters with ids', () => {
    const statDeals = document.getElementById('stat-deals');
    const statCategories = document.getElementById('stat-categories');
    const statPartners = document.getElementById('stat-partners');
    expect(statDeals).not.toBeNull();
    expect(statCategories).not.toBeNull();
    expect(statPartners).not.toBeNull();
  });
});

describe('Popup', () => {
  it('has popup overlay', () => {
    const popup = document.getElementById('popup');
    expect(popup).not.toBeNull();
  });

  it('has close button', () => {
    const close = document.getElementById('popup-close');
    expect(close).not.toBeNull();
  });

  it('has popup body content', () => {
    const title = document.querySelector('.popup-title');
    const desc = document.querySelector('.popup-desc');
    expect(title).not.toBeNull();
    expect(desc).not.toBeNull();
  });
});

describe('Navigation', () => {
  it('has theme toggle', () => {
    const toggle = document.getElementById('theme-toggle');
    expect(toggle).not.toBeNull();
  });

  it('has nav links', () => {
    const links = document.querySelectorAll('.nav-link');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Footer', () => {
  it('exists', () => {
    const footer = document.querySelector('.footer');
    expect(footer).not.toBeNull();
  });

  it('has GitHub link', () => {
    const link = document.querySelector('.footer-link[href*="github"]');
    expect(link).not.toBeNull();
  });
});