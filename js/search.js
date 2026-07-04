import { buildTrackedUrl, trackOutboundClick } from './affiliate.js';
let dealsData = [];
const REPORT_EMAIL = 'hi@devcheap.page';
var activeCategories = [];
let searchTimeout = null;
let activeFilters = { recommended: false, spotlight: false, expiringSoon: false, noExpiry: false, hasCoupon: false };
const EXPIRY_FILTER_KEYS = ['expiringSoon', 'noExpiry'];

const PAGE_SIZE = 24;
let currentPage = 1;
let currentSort = 'default';

function debug(...args) {
  if (window.__DEVcheap_DEBUG) console.log(...args);
}

const TURNSTILE_SITE_KEY = '0x4AAAAAADvU7jbz4RuK5Ibz';
let turnstileWidgetId = null;
let turnstileToken = null;

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.onTurnstileLoad = function () {
  const container = document.getElementById('turnstile-widget');
  if (!container || typeof turnstile === 'undefined') return;
  turnstileWidgetId = turnstile.render(container, {
    sitekey: TURNSTILE_SITE_KEY,
    callback: function (token) { turnstileToken = token; },
    'expired-callback': function () { turnstileToken = null; },
    'error-callback': function () { turnstileToken = null; },
  });
};

async function loadDeals() {
  const response = await fetch('/data/deals.jsonl');
  if (!response.ok) {
    return [];
  }
  const text = await response.text();
  return text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
}

function renderSkeletons(count) {
  const grid = document.getElementById('deals-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const sk = document.createElement('div');
    sk.className = 'skeleton';
    sk.innerHTML = `
      <div class="skeleton-line" style="width:55%"></div>
      <div class="skeleton-line" style="width:40%"></div>
      <div class="skeleton-line" style="width:75%"></div>
      <div class="skeleton-line"></div>
    `;
    grid.appendChild(sk);
  }
}

function renderError(message) {
  const gridEl = document.getElementById('deals-grid');
  if (!gridEl) return;
  gridEl.innerHTML = `
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <h3>Something went wrong</h3>
      <p>${escapeHtml(message)}</p>
      <button type="button" class="empty-clear-btn" id="retry-load-btn">Try again</button>
    </div>
  `;
  document.getElementById('retry-load-btn')?.addEventListener('click', async () => {
    renderSkeletons(6);
    try { dealsData = await loadDeals(); renderDeals(); } catch (e) { renderError(e.message); }
  });
}

function sortDeals(deals, sortKey) {
  const copy = [...deals];
  switch (sortKey) {
    case 'expiring':
      return copy.sort((a, b) => {
        const ax = a.expires ? new Date(a.expires).getTime() : Infinity;
        const bx = b.expires ? new Date(b.expires).getTime() : Infinity;
        return ax - bx;
      });
    case 'alphabetical':
      return copy.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
    case 'recommended':
      return copy.sort((a, b) => {
        const ar = a.tags && a.tags.toLowerCase().includes('recommended') ? 1 : 0;
        const br = b.tags && b.tags.toLowerCase().includes('recommended') ? 1 : 0;
        return br - ar;
      });
    default:
      return copy;
  }
}

function computePageWindow(current, total) {
  if (total <= 7) {
    const arr = [];
    for (let i = 1; i <= total; i++) arr.push(String(i));
    return arr;
  }
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
    result.push(String(sorted[i]));
  }
  return result;
}

function renderPagination(totalCount, page) {
  const nav = document.getElementById('pagination');
  if (!nav) return;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  if (totalPages <= 1) {
    nav.hidden = true;
    nav.innerHTML = '';
    return;
  }
  nav.hidden = false;
  const current = Math.min(Math.max(page, 1), totalPages);
  const window = computePageWindow(current, totalPages);
  let html = `<button type="button" class="page-btn page-prev"${current === 1 ? ' disabled aria-disabled="true"' : ''} data-page="${current - 1}" aria-label="Previous page">‹</button>`;
  for (const p of window) {
    if (p === '...') {
      html += `<span class="page-ellipsis" aria-hidden="true">…</span>`;
    } else {
      const pn = parseInt(p, 10);
      const isCurrent = pn === current;
      html += `<button type="button" class="page-btn${isCurrent ? ' page-current' : ''}" data-page="${pn}"${isCurrent ? ' aria-current="page"' : ''} aria-label="Page ${pn}">${pn}</button>`;
    }
  }
  html += `<button type="button" class="page-btn page-next"${current === totalPages ? ' disabled aria-disabled="true"' : ''} data-page="${current + 1}" aria-label="Next page">›</button>`;
  nav.innerHTML = html;
}

function renderDeals() {
  const gridEl = document.getElementById('deals-grid');
  const countEl = document.getElementById('deals-count');
  if (!gridEl) return;

  gridEl.innerHTML = '';
  const query = document.getElementById('search-input').value.trim().toLowerCase();

  let filtered = dealsData;

  if (activeCategories.length > 0) {
    filtered = filtered.filter(deal => activeCategories.some(cat => deal.category.toLowerCase().includes(cat.toLowerCase())));
  }

  if (query) {
    filtered = filtered.filter(deal => {
      const matchName = deal.name && deal.name.toLowerCase().includes(query);
      const matchDesc = deal.desc && deal.desc.toLowerCase().includes(query);
      const matchCategory = deal.category && deal.category.toLowerCase().includes(query);
      const matchTags = deal.tags && deal.tags.toLowerCase().includes(query);
      return matchName || matchDesc || matchCategory || matchTags;
    });
  }

  if (activeFilters.recommended) {
    filtered = filtered.filter(deal => deal.tags && deal.tags.toLowerCase().includes('recommended'));
  }
  if (activeFilters.spotlight) {
    filtered = filtered.filter(deal => deal.tags && deal.tags.toLowerCase().includes('spotlight'));
  }
  if (activeFilters.expiringSoon) {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    filtered = filtered.filter(deal => {
      if (!deal.expires) return false;
      const exp = new Date(deal.expires);
      return exp >= now && exp <= in30Days;
    });
  }
  if (activeFilters.noExpiry) {
    filtered = filtered.filter(deal => !deal.expires);
  }
  if (activeFilters.hasCoupon) {
    filtered = filtered.filter(deal => {
      if (!deal.code) return false;
      const codeLower = String(deal.code).toLowerCase();
      return !(codeLower.includes('automatic') || codeLower.includes('link'));
    });
  }

  if (countEl) {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, filtered.length);
    if (filtered.length === 0) {
      countEl.textContent = '0 active deals';
    } else if (start >= filtered.length) {
      countEl.textContent = `${filtered.length} active deal${filtered.length === 1 ? '' : 's'}`;
    } else {
      countEl.textContent = `Showing ${start + 1}–${end} of ${filtered.length} deal${filtered.length === 1 ? '' : 's'}`;
    }
  }

  if (filtered.length === 0) {
    renderPagination(0, 1);
    const activeChips = [];
    const rawQuery = document.getElementById('search-input').value.trim();
    if (rawQuery) activeChips.push({ label: `"${rawQuery}"`, type: 'search' });
    activeCategories.forEach(cat => activeChips.push({ label: cat.charAt(0).toUpperCase() + cat.slice(1), type: 'category' }));
    if (activeFilters.recommended) activeChips.push({ label: 'Recommended', type: 'recommended' });
    if (activeFilters.spotlight) activeChips.push({ label: 'Spotlight', type: 'spotlight' });
    if (activeFilters.expiringSoon) activeChips.push({ label: 'Expiring Soon', type: 'expiringSoon' });
    if (activeFilters.noExpiry) activeChips.push({ label: 'No Expiry', type: 'noExpiry' });
    if (activeFilters.hasCoupon) activeChips.push({ label: 'Coupons', type: 'hasCoupon' });
    const chipsHTML = activeChips.length > 0 ? `<div class="empty-chips">${activeChips.map(c => `<span class="empty-chip empty-chip--${c.type}">${c.label}</span>`).join('')}</div>` : '';
    const hasAnyFilter = activeChips.length > 0;
    gridEl.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h3>No deals found</h3>
        <p>${hasAnyFilter ? 'No deals match your current filters.' : 'Try adjusting your keywords or category filters.'}</p>
        ${chipsHTML}
        ${hasAnyFilter ? '<button type="button" class="empty-clear-btn">Clear all filters</button>' : ''}
      </div>`;
    return;
  }

  const resultsHint = document.querySelector('.results-hint');
  if (resultsHint) resultsHint.style.display = 'none';

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = sortDeals(filtered, currentSort).slice(start, start + PAGE_SIZE);
  debug(`[render] page ${currentPage}/${totalPages}, showing ${pageItems.length} of ${filtered.length} (sort=${currentSort})`);

  pageItems.forEach((deal, index) => {
    const card = document.createElement('div');
    card.className = 'deal-card';
    card.style.animationDelay = `${index * 20}ms`;

    let tagsHTML = '';
    if (deal.tags) {
      tagsHTML = deal.tags.split(',').map(tag =>
        `<span class="deal-card-tag">${tag.trim()}</span>`
      ).join('');
    }

  const trackedUrl = buildTrackedUrl(deal);
  const code = deal.code || '';
  const codeLower = String(code).toLowerCase();
  const isPromoAutomatic = codeLower.includes('automatic') || codeLower.includes('link');

    const couponBtn = isPromoAutomatic
      ? `<button class="deal-card-btn deal-card-btn-code" style="opacity:0.5;cursor:default" disabled><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${code}</button>`
      : `<button class="deal-card-btn deal-card-btn-code" data-deal-id="${deal.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> Copy Code</button>`;

    const expiresHTML = deal.expires ? `<span class="deal-card-expires">Expires ${deal.expires}</span>` : '';
    const whyHTML = deal.why ? `<p class="deal-card-why">${deal.why}</p>` : '';
    const isRecommended = deal.tags && deal.tags.toLowerCase().includes('recommended');
    const recommendedBadge = isRecommended ? `<span class="deal-card-badge-recommended"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Recommended</span>` : '';
    const isSpotlight = deal.tags && deal.tags.toLowerCase().includes('spotlight');
    const spotlightBadge = isSpotlight ? `<span class="deal-card-badge-spotlight"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l2.4 7.2L22 9.6l-5.6 4.8L18 22l-6-3.6L6 22l1.6-7.6L2 9.6l7.6-.4L12 2z"/></svg> Spotlight</span>` : '';

    card.innerHTML = `
      <div class="deal-card-header">
        <h3 class="deal-card-title">${deal.name}</h3>
        <span class="deal-card-cat">${deal.category}</span>
      </div>
      <div class="deal-card-deal">${deal.deal}</div>
      ${recommendedBadge}${spotlightBadge}
      ${whyHTML}
      <p class="deal-card-desc">${deal.desc}</p>
      <div class="deal-card-tags">${tagsHTML}${expiresHTML}</div>
 <div class="deal-card-footer">
  <a href="${trackedUrl}" target="_blank" rel="noopener noreferrer" class="deal-card-btn deal-card-btn-primary" data-deal-id="${deal.id}">Claim Deal</a>
  ${couponBtn}
  <div class="deal-card-overflow" data-deal-id="${deal.id}" role="button" tabindex="0" aria-label="More options">⋯
   <div class="overflow-menu" role="menu">
    <button type="button" class="overflow-item" data-action="report-expired" data-deal-id="${deal.id}" role="menuitem">Report Expired</button>
   </div>
  </div>
 </div>
      `;
    gridEl.appendChild(card);
  });
  renderPagination(filtered.length, currentPage);
  renderActiveFilterBadges();
}

function copyCoupon(button, code) {
  const dealId = button.dataset.dealId;
  navigator.clipboard.writeText(code).then(() => {
    const originalHTML = button.innerHTML;
    button.classList.add('copied');
    button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
    button.style.color = 'var(--green)';
    button.style.borderColor = 'var(--green)';
    button.style.boxShadow = '0 0 0 3px rgba(48,209,88,0.25)';
    button.style.transform = 'scale(1.04)';
    if (dealId) {
      const deal = dealsData.find(d => d.id === dealId);
      if (deal) trackOutboundClick(deal, 'coupon_copy');
    }
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.color = '';
      button.style.borderColor = '';
      button.style.boxShadow = '';
      button.style.transform = '';
      button.classList.remove('copied');
    }, 1500);
  }).catch(err => console.error('Could not copy code:', err));
}

function setupTheme() {
  const themeBtn = document.getElementById('theme-toggle');
  if (!themeBtn) return;
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcons(currentTheme);
  themeBtn.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
  });
}

function updateThemeIcons(theme) {
  const moonIcon = document.querySelector('.icon-moon');
  const sunIcon = document.querySelector('.icon-sun');
  if (!moonIcon || !sunIcon) return;
  if (theme === 'light') {
    moonIcon.style.display = 'block';
    sunIcon.style.display = 'none';
  } else {
    moonIcon.style.display = 'none';
    sunIcon.style.display = 'block';
  }
}

async function subscribeToNewsletter(email, source = 'devcheap.click') {
  if (turnstileWidgetId !== null && typeof turnstile !== 'undefined') {
    turnstile.execute(turnstileWidgetId);
  }

  const body = { email, source };
  if (turnstileToken) {
    body['cf-turnstile-response'] = turnstileToken;
  }

  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Subscription failed');
    }

    if (turnstileWidgetId !== null && typeof turnstile !== 'undefined') {
      turnstile.reset(turnstileWidgetId);
    }

    return { ok: true };
  } catch (err) {
    console.error('Newsletter subscription error:', err);
    return { ok: false, reason: err.message };
  }
}

function showInlineSuccess(form, input, button) {
  input.value = '';
  input.disabled = true;
  button.textContent = '✓ Subscribed!';
  button.disabled = true;
  button.style.opacity = '0.7';
}

function showInlineError(button, msg = 'Something went wrong') {
  button.textContent = msg;
  button.style.color = 'var(--red)';
  setTimeout(() => {
    button.textContent = 'Subscribe';
    button.disabled = false;
    button.style.opacity = '1';
    button.style.color = '';
  }, 3000);
}

function setupNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('newsletter-email');
    const btn = form.querySelector('.newsletter-submit');
    if (!input.value) return;
    btn.disabled = true;
    const result = await subscribeToNewsletter(input.value, 'devcheap.hero');
    if (result.ok) {
      showInlineSuccess(form, input, btn);
    } else {
      showInlineError(btn, 'Try again');
    }
  });
}

function injectItemListJSONLD(deals) {
  const existing = document.getElementById('ld-itemlist');
  if (existing) existing.remove();

  const script = document.createElement('script');
  script.id = 'ld-itemlist';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'All Developer Deals on DevCheap',
    'description': 'Curated verified developer deals, free credits, and lifetime discounts.',
    'url': 'https://devcheap.click/',
    'itemListElement': deals.map((deal, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'ListItem',
        'name': deal.name,
        'url': `https://devcheap.click/deals/${deal.id}/`
      }
    }))
  });
  document.head.appendChild(script);
}

function animateCounters() {
  const stats = [
    { id: 'stat-deals', target: dealsData.length },
    { id: 'stat-categories', target: new Set(dealsData.map(d => d.category)).size },
    { id: 'stat-partners', target: dealsData.filter(d => d.has_affiliate).length },
  ];
  stats.forEach(({ id, target }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const prefix = el.dataset.prefix || '';
    const duration = 1200;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = `${prefix}${current.toLocaleString()}`;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = `${prefix}${target.toLocaleString()}`;
      }
    }
    requestAnimationFrame(tick);
  });
}

function updateCategoryURL(categories) {
  const url = new URL(window.location);
  if (!categories || categories.length === 0) {
    url.searchParams.delete('category');
  } else {
    url.searchParams.set('category', categories.join(','));
  }
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}

function updateBreadcrumbJSONLD(categories) {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      if (data && data['@type'] === 'BreadcrumbList') {
        if (categories && categories.length > 0) {
          const label = categories.length === 1
            ? categories[0].charAt(0).toUpperCase() + categories[0].slice(1) + ' Deals'
            : 'Multiple Categories';
          data.itemListElement = [
            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://devcheap.click/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Deals', 'item': 'https://devcheap.click/#deals' },
            { '@type': 'ListItem', 'position': 3, 'name': label, 'item': `https://devcheap.click/?category=${encodeURIComponent(categories.join(','))}` }
          ];
        } else {
          data.itemListElement = [
            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://devcheap.click/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Deals', 'item': 'https://devcheap.click/#deals' }
          ];
        }
        script.textContent = JSON.stringify(data, null, 2);
      }
    } catch (_) {}
  }
}

function generateMissingCategories() {
  const container = document.getElementById('categories-container');
  if (!container || dealsData.length === 0) return;

  const existingCats = new Set();
  container.querySelectorAll('.cat-btn').forEach(btn => {
    if (btn.dataset.cat !== 'all') existingCats.add(btn.dataset.cat);
  });

  const dataCats = [...new Set(dealsData.map(d => d.category))].sort();

  dataCats.forEach(cat => {
    const catLower = cat.toLowerCase();
    const isCovered = [...existingCats].some(ec => catLower.includes(ec));
    if (!isCovered) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-btn';
      btn.dataset.cat = catLower;
      btn.role = 'tab';
      btn.setAttribute('aria-selected', 'false');
      btn.textContent = cat;
      container.appendChild(btn);
    }
  });
}

function setupCategoryDelegation() {
  const container = document.getElementById('categories-container');
  if (!container) return;

  function refreshCatButtons() {
    container.querySelectorAll('.cat-btn').forEach(t => {
      const isActive = activeCategories.includes(t.dataset.cat);
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive);
    });
    const allBtn = container.querySelector('.cat-btn[data-cat="all"]');
    if (allBtn) {
      const isAll = activeCategories.length === 0;
      allBtn.classList.toggle('active', isAll);
      allBtn.setAttribute('aria-selected', isAll);
    }
  }

  container.addEventListener('click', (e) => {
    const tab = e.target.closest('.cat-btn');
    if (!tab) return;

    const cat = tab.dataset.cat;
    const isMulti = e.metaKey || e.ctrlKey;

    if (cat === 'all') {
      activeCategories = [];
    } else if (isMulti) {
      const idx = activeCategories.indexOf(cat);
      if (idx >= 0) {
        activeCategories.splice(idx, 1);
      } else {
        activeCategories.push(cat);
      }
    } else {
      activeCategories = [cat];
    }

    refreshCatButtons();
    currentPage = 1;
    renderDeals();
    updatePageURL(currentPage);
    updateCategoryURL(activeCategories);
    updateBreadcrumbJSONLD(activeCategories);
  });
}

function updateFiltersURL() {
  const url = new URL(window.location);
  if (activeFilters.recommended) { url.searchParams.set('recommended', '1'); } else { url.searchParams.delete('recommended'); }
  if (activeFilters.spotlight) { url.searchParams.set('spotlight', '1'); } else { url.searchParams.delete('spotlight'); }
  if (activeFilters.expiringSoon) { url.searchParams.set('expiringSoon', '1'); } else { url.searchParams.delete('expiringSoon'); }
  if (activeFilters.noExpiry) { url.searchParams.set('noExpiry', '1'); } else { url.searchParams.delete('noExpiry'); }
  if (activeFilters.hasCoupon) { url.searchParams.set('hasCoupon', '1'); } else { url.searchParams.delete('hasCoupon'); }
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}

function updatePageURL(page) {
  const url = new URL(window.location.href);
  if (page <= 1) url.searchParams.delete('page');
  else url.searchParams.set('page', String(page));
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}

function updateSortURL(sort) {
  const url = new URL(window.location.href);
  if (!sort || sort === 'default') url.searchParams.delete('sort');
  else url.searchParams.set('sort', sort);
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}

function setupSortSelect() {
  const select = document.getElementById('sort-select');
  if (!select) return;
  select.addEventListener('change', () => {
    const prev = currentSort;
    currentSort = select.value;
    currentPage = 1;
    debug(`[sort] ${prev} → ${currentSort}, reset to page 1`);
    updateSortURL(currentSort);
    updatePageURL(currentPage);
    renderDeals();
    try { const ss = document.getElementById('deals'); if (ss) ss.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {}
  });
}

function setupPagination() {
  const nav = document.getElementById('pagination');
  if (!nav) return;
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.page-btn');
    if (!btn || btn.disabled) return;
    const p = parseInt(btn.dataset.page, 10);
    if (!p || p === currentPage) return;
    const totalPages = Math.max(1, Math.ceil(dealsData.length / PAGE_SIZE));
    if (p < 1 || p > totalPages) return;
    const prev = currentPage;
    currentPage = p;
    debug(`[pagination] page ${prev} → ${p}`);
    const url = new URL(window.location);
    if (p <= 1) url.searchParams.delete('page');
    else url.searchParams.set('page', String(p));
    window.history.pushState({ page: p }, '', url.pathname + url.search + url.hash);
    renderDeals();
    try {
      const ds = document.getElementById('deals');
      if (ds) {
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        ds.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    } catch (_) {}
  });
}

function setupFilterChips() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;

      if (EXPIRY_FILTER_KEYS.includes(filter)) {
        const otherKey = EXPIRY_FILTER_KEYS.find(k => k !== filter);
        if (activeFilters[filter]) {
          activeFilters[filter] = false;
          chip.classList.remove('active');
          chip.setAttribute('aria-pressed', 'false');
        } else {
          activeFilters[filter] = true;
          chip.classList.add('active');
          chip.setAttribute('aria-pressed', 'true');
          activeFilters[otherKey] = false;
          const otherChip = document.querySelector(`.filter-chip[data-filter="${otherKey}"]`);
          if (otherChip) { otherChip.classList.remove('active'); otherChip.setAttribute('aria-pressed', 'false'); }
        }
      } else {
        activeFilters[filter] = !activeFilters[filter];
        chip.classList.toggle('active');
        chip.setAttribute('aria-pressed', activeFilters[filter]);
      }
      currentPage = 1;
      debug(`[filter] ${filter} toggled, reset to page 1`);
      updateFiltersURL();
      updatePageURL(currentPage);
      renderDeals();
    });
  });
}

function renderActiveFilterBadges() {
  const container = document.getElementById('active-filter-badges');
  if (!container) return;
  const badges = [];
  activeCategories.forEach(cat => {
    badges.push({ label: cat.charAt(0).toUpperCase() + cat.slice(1), filter: 'cat-' + cat });
  });
  if (activeFilters.recommended) badges.push({ label: 'Recommended', filter: 'recommended' });
  if (activeFilters.spotlight) badges.push({ label: 'Spotlight', filter: 'spotlight' });
  if (activeFilters.expiringSoon) badges.push({ label: 'Expiring Soon', filter: 'expiringSoon' });
  if (activeFilters.noExpiry) badges.push({ label: 'No Expiry', filter: 'noExpiry' });
  if (activeFilters.hasCoupon) badges.push({ label: 'Coupons', filter: 'hasCoupon' });
  if (badges.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = badges.map(b => `
    <button type="button" class="active-filter-badge" data-filter="${b.filter}">
      ${b.label}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `).join('');
}

async function boot() {
  const initialGridEl = document.getElementById('deals-grid');
  const hasPreRendered = initialGridEl && initialGridEl.querySelector('.deal-card');
  if (!hasPreRendered) {
    renderSkeletons(6);
  }
  try { dealsData = await loadDeals(); } catch (e) { renderError(e.message || 'Unable to load deals'); }
  injectItemListJSONLD(dealsData);
  setupTheme();
  const turnstileContainer = document.getElementById('turnstile-widget');
  if (turnstileContainer) {
    if (!TURNSTILE_SITE_KEY) {
      turnstileContainer.remove();
    }
  }
  setupNewsletterForm();
  animateCounters();

  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search-btn');

  if (searchInput && clearBtn) {
    searchInput.addEventListener('input', () => {
      clearBtn.style.display = searchInput.value ? 'flex' : 'none';
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(renderDeals, 150);
    });
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      currentPage = 1;
      debug('[search] cleared, reset to page 1');
      updatePageURL(currentPage);
      renderDeals();
    });
  }

  setupSortSelect();
  setupPagination();

  generateMissingCategories();
  setupCategoryDelegation();
  setupFilterChips();

  const params = new URLSearchParams(window.location.search);
  const sortFromURL = params.get('sort');
  if (sortFromURL && ['default', 'expiring', 'alphabetical', 'recommended'].includes(sortFromURL)) {
    currentSort = sortFromURL;
    const select = document.getElementById('sort-select');
    if (select) select.value = currentSort;
  }
  const pageFromURL = parseInt(params.get('page') || '1', 10);
  if (Number.isFinite(pageFromURL) && pageFromURL > 1) currentPage = pageFromURL;
  debug(`[boot] URL params restored → page=${currentPage}, sort=${currentSort}`);

  const catsFromURL = params.get('category');
  if (catsFromURL) {
    const cats = catsFromURL.split(',').map(c => c.trim()).filter(Boolean);
    const valid = cats.filter(c => document.querySelector(`.cat-btn[data-cat="${c}"]`));
    if (valid.length > 0) {
      activeCategories = valid;
    }
  }
  activeCategories.forEach(cat => {
    const btn = document.querySelector(`.cat-btn[data-cat="${cat}"]`);
    if (btn) { btn.classList.add('active'); btn.setAttribute('aria-selected', 'true'); }
  });
  if (activeCategories.length === 0) {
    const allBtn = document.querySelector('.cat-btn[data-cat="all"]');
    if (allBtn) { allBtn.classList.add('active'); allBtn.setAttribute('aria-selected', 'true'); }
  }

  if (params.get('recommended') === '1') {
    activeFilters.recommended = true;
    const chip = document.querySelector('.filter-chip[data-filter="recommended"]');
    if (chip) { chip.classList.add('active'); chip.setAttribute('aria-pressed', 'true'); }
  }
  if (params.get('spotlight') === '1') {
    activeFilters.spotlight = true;
    const chip = document.querySelector('.filter-chip[data-filter="spotlight"]');
    if (chip) { chip.classList.add('active'); chip.setAttribute('aria-pressed', 'true'); }
  }
  if (params.get('expiringSoon') === '1') {
    activeFilters.expiringSoon = true;
    const chip = document.querySelector('.filter-chip[data-filter="expiringSoon"]');
    if (chip) { chip.classList.add('active'); chip.setAttribute('aria-pressed', 'true'); }
  }
  if (params.get('noExpiry') === '1') {
    activeFilters.noExpiry = true;
    const chip = document.querySelector('.filter-chip[data-filter="noExpiry"]');
    if (chip) { chip.classList.add('active'); chip.setAttribute('aria-pressed', 'true'); }
  }
  if (params.get('hasCoupon') === '1') {
    activeFilters.hasCoupon = true;
    const chip = document.querySelector('.filter-chip[data-filter="hasCoupon"]');
    if (chip) { chip.classList.add('active'); chip.setAttribute('aria-pressed', 'true'); }
  }

  renderDeals();

  const hasDealParams = params.toString() && [...params.keys()].some(k => ['category', 'recommended', 'spotlight', 'expiringSoon', 'noExpiry', 'hasCoupon', 'page', 'sort'].includes(k));
  if (hasDealParams) {
    const dealsSection = document.getElementById('deals');
    if (dealsSection) { try { dealsSection.scrollIntoView({ behavior: 'smooth' }); } catch (_) {} }
  }

  const gridEl = document.getElementById('deals-grid');
  if (gridEl) {
gridEl.addEventListener('click', (e) => {
 const overflowBtn = e.target.closest('.deal-card-overflow');
 if (overflowBtn) {
  const menu = overflowBtn.querySelector('.overflow-menu');
  const wasOpen = menu.classList.contains('open');
  closeAllOverflowMenus();
  if (!wasOpen) menu.classList.add('open');
  return;
 }

 if (e.target.closest('.empty-clear-btn')) {
        const searchInput = document.getElementById('search-input');
        const clearBtn = document.getElementById('clear-search-btn');
        if (searchInput) { searchInput.value = ''; }
        if (clearBtn) { clearBtn.style.display = 'none'; }
        activeCategories = [];
        document.querySelectorAll('.cat-btn').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        const allBtn = document.querySelector('.cat-btn[data-cat="all"]');
        if (allBtn) { allBtn.classList.add('active'); allBtn.setAttribute('aria-selected', 'true'); }
        Object.keys(activeFilters).forEach(k => activeFilters[k] = false);
        document.querySelectorAll('.filter-chip').forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-pressed', 'false');
        });
        updateCategoryURL([]);
        updateBreadcrumbJSONLD([]);
        currentPage = 1;
        currentSort = 'default';
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) sortSelect.value = 'default';
        updateSortURL(currentSort);
        updatePageURL(currentPage);
        debug('[filters] cleared, reset to page 1, sort default');
        renderDeals();
        return;
      }

const btn = e.target.closest('[data-deal-id]');
  if (!btn) return;

  const actionBtn = e.target.closest('[data-action="report-expired"]');
  if (actionBtn) {
   const dealId = actionBtn.dataset.dealId;
   const deal = dealsData.find(d => d.id === dealId);
   const subject = encodeURIComponent(`Expired Deal: ${deal?.name || dealId}`);
   const body = encodeURIComponent(`Deal ID: ${dealId}\nDeal: ${deal?.deal || ''}\nURL: ${deal?.url || actionBtn.dataset.dealUrl || ''}`);
   window.open(`mailto:${REPORT_EMAIL}?subject=${subject}&body=${body}`);
   closeAllOverflowMenus();
   return;
  }

  if (btn.classList.contains('deal-card-btn-primary')) {
        const deal = dealsData.find(d => d.id === btn.dataset.dealId);
        if (deal) trackOutboundClick(deal, 'claim_deal');
      } else if (btn.classList.contains('deal-card-btn-code') && !btn.disabled) {
        const deal = dealsData.find(d => d.id === btn.dataset.dealId);
        const code = deal ? deal.code : '';
        copyCoupon(btn, code);
      }
    });
  }

  const badgeContainer = document.getElementById('active-filter-badges');
  if (badgeContainer) {
    badgeContainer.addEventListener('click', (e) => {
      const badge = e.target.closest('.active-filter-badge');
      if (!badge) return;
      const filter = badge.dataset.filter;

      if (filter.startsWith('cat-')) {
        const cat = filter.slice(4);
        const idx = activeCategories.indexOf(cat);
        if (idx >= 0) activeCategories.splice(idx, 1);
        const btn = document.querySelector(`.cat-btn[data-cat="${cat}"]`);
        if (btn) { btn.classList.remove('active'); btn.setAttribute('aria-selected', 'false'); }
        const allBtn = document.querySelector('.cat-btn[data-cat="all"]');
        if (activeCategories.length === 0 && allBtn) { allBtn.classList.add('active'); allBtn.setAttribute('aria-selected', 'true'); }
        updateCategoryURL(activeCategories);
        updateBreadcrumbJSONLD(activeCategories);
      } else {
        activeFilters[filter] = false;
        const chip = document.querySelector(`.filter-chip[data-filter="${filter}"]`);
        if (chip) { chip.classList.remove('active'); chip.setAttribute('aria-pressed', 'false'); }
        updateFiltersURL();
      }

      currentPage = 1;
      debug('[badge] filter removed, reset to page 1');
      updatePageURL(currentPage);
      renderDeals();
    });
  }
}

function closeAllOverflowMenus() {
  document.querySelectorAll('.overflow-menu').forEach(m => m.classList.remove('open'));
}

function setupOverflowKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target.closest('.deal-card-overflow[role="button"]');
    if (!target) return;
    e.preventDefault();
    const menu = target.querySelector('.overflow-menu');
    if (!menu) return;
    const wasOpen = menu.classList.contains('open');
    closeAllOverflowMenus();
    if (!wasOpen) menu.classList.add('open');
  });
}

function restoreStateFromURL() {
  const params = new URLSearchParams(window.location.search);
  const sortParam = params.get('sort');
  if (sortParam && ['default', 'expiring', 'alphabetical', 'recommended'].includes(sortParam)) {
    currentSort = sortParam;
  } else {
    currentSort = 'default';
  }
  const select = document.getElementById('sort-select');
  if (select) select.value = currentSort;
  const pageParam = parseInt(params.get('page') || '1', 10);
  currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  debug(`[restore] page=${currentPage}, sort=${currentSort}`);
}

window.addEventListener('click', (e) => {
  if (!e.target.closest('.deal-card-overflow')) closeAllOverflowMenus();
});

window.addEventListener('popstate', () => {
  restoreStateFromURL();
  renderDeals();
});

window.addEventListener('DOMContentLoaded', () => {
  setupOverflowKeyboard();
  boot();
});
window.buildTrackedUrl = buildTrackedUrl;
window.trackOutboundClick = trackOutboundClick;
window.boot = boot;
window.renderDeals = renderDeals;
window.sortDeals = sortDeals;
window.computePageWindow = computePageWindow;
window.renderPagination = renderPagination;
window.updatePageURL = updatePageURL;
window.updateSortURL = updateSortURL;
window.setupSortSelect = setupSortSelect;
window.setupPagination = setupPagination;
window.restoreStateFromURL = restoreStateFromURL;
window.__getPageState = () => ({ currentPage, currentSort, pageSize: PAGE_SIZE });
window.__setDealsData = (d) => { dealsData = d; };
window.__setPage = (p) => { currentPage = p; };
window.__setSort = (s) => { currentSort = s; };
window.resetModuleState = () => {
  currentPage = 1;
  currentSort = 'default';
};
