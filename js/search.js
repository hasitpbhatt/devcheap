let dealsData = [];
var currentCategory = 'all';
let searchTimeout = null;

const UTM_SOURCE = 'devcheap.click';
const UTM_MEDIUM = 'website';
const UTM_CAMPAIGN = 'deal_click';

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
    const response = await fetch('data/deals.json');
    if (!response.ok) throw new Error('Failed to load deals data.');
    return await response.json();
  } catch (error) {
    console.error('Error fetching deals:', error);
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
    filtered = filtered.filter(deal => deal.category.toLowerCase() === currentCategory.toLowerCase());
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
      ? `<button class="deal-card-btn deal-card-btn-code" style="opacity:0.5;cursor:default"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${deal.code}</button>`
      : `<button class="deal-card-btn deal-card-btn-code" onclick="copyCoupon(this,'${deal.code.replace(/'/g, "\\'")}','${deal.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> Copy Code</button>`;

    card.innerHTML = `
      <div class="deal-card-header">
        <span class="deal-card-title">${deal.name}</span>
        <span class="deal-card-cat">${deal.category}</span>
      </div>
      <div class="deal-card-deal">${deal.deal}</div>
      <p class="deal-card-desc">${deal.desc}</p>
      <div class="deal-card-tags">${tagsHTML}</div>
      <div class="deal-card-footer">
        <a href="${trackedUrl}" target="_blank" rel="noopener noreferrer" class="deal-card-btn deal-card-btn-primary" data-deal-id="${deal.id}" onclick="handleClaim(event,'${deal.id}')">Claim Deal</a>
        ${couponBtn}
      </div>`;
    gridEl.appendChild(card);
  });
}

function handleClaim(event, dealId) {
  const deal = dealsData.find(d => d.id === dealId);
  if (deal) trackOutboundClick(deal, 'claim_deal');
}

window.copyCoupon = function(button, code, dealId) {
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
};

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
  const publicationId = import.meta.env?.BEEHIIV_PUBLICATION_ID || 'devcheap';
  const apiKey = import.meta.env?.BEEHIIV_API_KEY;

  if (!apiKey) {
    console.warn('Beehiiv API key not set. Skipping subscription.');
    return { ok: false, reason: 'api_key_missing' };
  }

  try {
    const res = await fetch(`https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ email, referring_site: source }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Subscription failed');
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
  const form = document.getElementById('popup-form');
  if (!popup || !closeBtn || !form) return;
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

function animateCounters() {
  document.querySelectorAll('.hero-stat-num').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    if (!target) return;
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

async function boot() {
  renderSkeletons(6);
  dealsData = await loadDeals();
  setupTheme();
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
    });
  });

  renderDeals();
}

window.addEventListener('DOMContentLoaded', boot);
window.buildTrackedUrl = buildTrackedUrl;
window.handleClaim = handleClaim;
window.trackOutboundClick = trackOutboundClick;
window.setupTheme = setupTheme;
window.setupNewsletterPopup = setupNewsletterPopup;
window.setupNewsletterForm = setupNewsletterForm;
