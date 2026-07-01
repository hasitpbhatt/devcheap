let dealsData = [];
var currentCategory = 'all';
let searchTimeout = null;

const UTM_SOURCE = 'devcheap.click';
const REPORT_EMAIL = 'hi@devcheap.page';
const UTM_MEDIUM = 'website';
const UTM_CAMPAIGN = 'deal_click';

const TURNSTILE_SITE_KEY = 'REPLACE_ME'; // Set this to your Turnstile site key from Cloudflare Dashboard
let turnstileWidgetId = null;
let turnstileToken = null;

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

function buildTrackedUrl(deal) {
  let targetUrl = deal.url;
  if (deal.has_affiliate && deal.affiliate_url) {
    targetUrl = deal.affiliate_url;
  }
  try {
    const url = new URL(targetUrl);
    url.searchParams.set('utm_source', UTM_SOURCE);
    url.searchParams.set('utm_medium', UTM_MEDIUM);
    url.searchParams.set('utm_campaign', UTM_CAMPAIGN);
    url.searchParams.set('utm_content', deal.tracking_id || deal.id);
    return url.toString();
  } catch (e) {
    return targetUrl;
  }
}

async function loadDeals() {
  try {
    const response = await fetch('/data/deals.jsonl');
    const text = await response.text();
    return text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
  } catch (_) {
    return [];
  }
}

function trackOutboundClick(deal, linkType) {
  const payload = {
    deal_id: deal.id,
    deal_name: deal.name,
    tracking_id: deal.tracking_id,
    category: deal.category,
    link_type: linkType,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
  console.log('Outbound click tracked:', payload);
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

function renderDeals() {
  const gridEl = document.getElementById('deals-grid');
  const countEl = document.getElementById('deals-count');
  if (!gridEl) return;

  gridEl.innerHTML = '';
  const query = document.getElementById('search-input').value.trim().toLowerCase();

  let filtered = dealsData;

  if (currentCategory !== 'all') {
    filtered = filtered.filter(deal => deal.category.toLowerCase().includes(currentCategory.toLowerCase()));
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

  if (countEl) {
    countEl.textContent = `${filtered.length} active deal${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    gridEl.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h3>No deals found</h3>
        <p>Try adjusting your keywords or category filters</p>
      </div>`;
    return;
  }

  filtered.forEach((deal, index) => {
    const card = document.createElement('div');
    card.className = 'deal-card';
    card.style.animationDelay = `${index * 40}ms`;

    let tagsHTML = '';
    if (deal.tags) {
      tagsHTML = deal.tags.split(',').map(tag =>
        `<span class="deal-card-tag">${tag.trim()}</span>`
      ).join('');
    }

    const trackedUrl = buildTrackedUrl(deal);
    const isPromoAutomatic = deal.code.toLowerCase().includes('automatic') || deal.code.toLowerCase().includes('link');

    const couponBtn = isPromoAutomatic
      ? `<button class="deal-card-btn deal-card-btn-code" style="opacity:0.5;cursor:default" disabled><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${deal.code}</button>`
      : `<button class="deal-card-btn deal-card-btn-code" data-deal-id="${deal.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> Copy Code</button>`;

    const expiresHTML = deal.expires ? `<span class="deal-card-expires">Expires ${deal.expires}</span>` : '';
    const whyHTML = deal.why ? `<p class="deal-card-why">${deal.why}</p>` : '';

    card.innerHTML = `
      <div class="deal-card-header">
        <h3 class="deal-card-title">${deal.name}</h3>
        <span class="deal-card-cat">${deal.category}</span>
      </div>
      <div class="deal-card-deal">${deal.deal}</div>
      ${whyHTML}
      <p class="deal-card-desc">${deal.desc}</p>
      <div class="deal-card-tags">${tagsHTML}${expiresHTML}</div>
      <div class="deal-card-footer">
        <a href="${trackedUrl}" target="_blank" rel="noopener noreferrer" class="deal-card-btn deal-card-btn-primary" data-deal-id="${deal.id}">Claim Deal</a>
        ${couponBtn}
      </div>
      <a href="mailto:${REPORT_EMAIL}?subject=Expired%20Deal%3A%20${encodeURIComponent(deal.name)}&body=Deal%20ID%3A%20${encodeURIComponent(deal.id)}%0ADeal%3A%20${encodeURIComponent(deal.deal)}%0AURL%3A%20${encodeURIComponent(deal.url)}%0A" class="deal-card-report" target="_blank" rel="noopener noreferrer">Report Expired</a>`;
    gridEl.appendChild(card);
  });
}

function copyCoupon(button, code) {
  const dealId = button.dataset.dealId;
  navigator.clipboard.writeText(code).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
    button.style.color = 'var(--green)';
    button.style.borderColor = 'var(--green)';
    if (dealId) {
      const deal = dealsData.find(d => d.id === dealId);
      if (deal) trackOutboundClick(deal, 'coupon_copy');
    }
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.color = '';
      button.style.borderColor = '';
    }, 2000);
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
  const lightIcon = document.querySelector('.theme-icon-light');
  const darkIcon = document.querySelector('.theme-icon-dark');
  if (!lightIcon || !darkIcon) return;
  if (theme === 'light') {
    lightIcon.style.display = 'block';
    darkIcon.style.display = 'none';
  } else {
    lightIcon.style.display = 'none';
    darkIcon.style.display = 'block';
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

function setupNewsletterPopup() {
  const popup = document.getElementById('popup');
  const closeBtn = document.getElementById('popup-close');
  if (!popup || !closeBtn) return;

  const isDismissed = localStorage.getItem('devcheap_popup_dismissed');
  if (!isDismissed) {
    setTimeout(() => popup.classList.add('show'), 5000);
  }

  closeBtn.addEventListener('click', () => {
    popup.classList.remove('show');
    localStorage.setItem('devcheap_popup_dismissed', 'true');
  });

  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.classList.remove('show');
      localStorage.setItem('devcheap_popup_dismissed', 'true');
    }
  });

  const form = document.getElementById('popup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('popup-email');
    const btn = form.querySelector('.popup-btn');
    if (!input.value) return;
    btn.disabled = true;
    const result = await subscribeToNewsletter(input.value, 'devcheap.popup');
    if (result.ok) {
      showInlineSuccess(form, input, btn);
      localStorage.setItem('devcheap_subscribed', 'true');
      setTimeout(() => popup.classList.remove('show'), 1500);
    } else {
      showInlineError(btn, 'Try again');
    }
  });
}

function setupBannerForm() {
  const form = document.getElementById('banner-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('banner-email');
    const btn = form.querySelector('.banner-submit');
    if (!input.value) return;
    btn.disabled = true;
    const result = await subscribeToNewsletter(input.value, 'devcheap.banner');
    if (result.ok) {
      showInlineSuccess(form, input, btn);
    } else {
      showInlineError(btn, 'Try again');
    }
  });
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
        '@type': 'Product',
        'name': deal.name,
        'description': deal.desc,
        'category': deal.category,
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
          'description': deal.deal,
          'availability': deal.expires ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/OnlineOnly',
        }
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

function updateCategoryURL(category) {
  const url = new URL(window.location);
  if (category === 'all') {
    url.searchParams.delete('category');
  } else {
    url.searchParams.set('category', category);
  }
  window.history.replaceState(null, '', url);
}

function updateBreadcrumbJSONLD(category) {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      if (data && data['@type'] === 'BreadcrumbList') {
        if (category && category !== 'all') {
          data.itemListElement = [
            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://devcheap.click/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Deals', 'item': 'https://devcheap.click/#deals' },
            { '@type': 'ListItem', 'position': 3, 'name': category.charAt(0).toUpperCase() + category.slice(1) + ' Deals', 'item': `https://devcheap.click/?category=${encodeURIComponent(category)}` }
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

async function boot() {
  renderSkeletons(6);
  dealsData = await loadDeals();
  injectItemListJSONLD(dealsData);
  setupTheme();
  if (typeof turnstile !== 'undefined' && turnstileWidgetId === null) {
    window.onTurnstileLoad();
  }
  setupBannerForm();
  setupNewsletterPopup();
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
      renderDeals();
    });
  }

  document.querySelectorAll('.cat-btn').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.cat-btn').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      e.currentTarget.classList.add('active');
      e.currentTarget.setAttribute('aria-selected', 'true');
      currentCategory = e.currentTarget.dataset.cat;
      renderDeals();
      updateCategoryURL(currentCategory);
      updateBreadcrumbJSONLD(currentCategory);
    });
  });

  const params = new URLSearchParams(window.location.search);
  const catFromURL = params.get('category');
  if (catFromURL) {
    const btn = document.querySelector(`.cat-btn[data-cat="${catFromURL}"]`);
    if (btn) {
      document.querySelectorAll('.cat-btn').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentCategory = catFromURL;
    }
  }

  renderDeals();

  const gridEl = document.getElementById('deals-grid');
  if (gridEl) {
    gridEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-deal-id]');
      if (!btn) return;

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
}

window.addEventListener('DOMContentLoaded', boot);
window.buildTrackedUrl = buildTrackedUrl;
window.trackOutboundClick = trackOutboundClick;
window.boot = boot;
