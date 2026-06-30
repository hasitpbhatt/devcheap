// DevCheap - Lean Developer Deals Catalog Engine
// Phase 1: Monetization & Tracking Layer

let dealsData = [];
let currentCategory = 'all';
let searchTimeout = null;

// UTM Tracking Constants
const UTM_SOURCE = 'devcheap.click';
const UTM_MEDIUM = 'website';
const UTM_CAMPAIGN = 'deal_click';

/**
 * Build a tracked URL for a given deal.
 * If the deal has an affiliate, use it. Otherwise append UTM to base URL.
 */
function buildTrackedUrl(deal) {
  let targetUrl = deal.url;

  // Prefer affiliate URL if available
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
    // Fallback for malformed URLs
    console.warn('Could not append UTM to URL:', targetUrl);
    return targetUrl;
  }
}

// Load deals JSON database relatively
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

// Track outbound clicks (placeholder for future analytics integration)
function trackOutboundClick(deal, linkType) {
  const payload = {
    deal_id: deal.id,
    deal_name: deal.name,
    tracking_id: deal.tracking_id,
    category: deal.category,
    link_type: linkType, // 'claim_deal' or 'coupon_copy'
    timestamp: new Date().toISOString(),
    url: window.location.href
  };

  // Console log for debugging (replace with Google Analytics or Plausible later)
  console.log('🔥 Outbound click tracked:', payload);

  // TODO: Send to analytics endpoint when ready
  // fetch('https://your-analytics-endpoint.com/track', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload)
  // });
}

// Render Deal Cards in the grid
function renderDeals() {
  const gridEl = document.getElementById('deals-grid');
  const countEl = document.getElementById('deals-count');
  if (!gridEl) return;

  gridEl.innerHTML = '';
  const query = document.getElementById('search-input').value.trim().toLowerCase();

  // Filter items
  let filtered = dealsData;

  // Filter by Category Tab
  if (currentCategory !== 'all') {
    filtered = filtered.filter(deal => deal.category.toLowerCase() === currentCategory.toLowerCase());
  }

  // Filter by Search Query
  if (query) {
    filtered = filtered.filter(deal => {
      const matchName = deal.name && deal.name.toLowerCase().includes(query);
      const matchDesc = deal.desc && deal.desc.toLowerCase().includes(query);
      const matchCategory = deal.category && deal.category.toLowerCase().includes(query);
      const matchTags = deal.tags && deal.tags.toLowerCase().includes(query);
      return matchName || matchDesc || matchCategory || matchTags;
    });
  }

  // Update counter
  if (countEl) {
    countEl.textContent = `${filtered.length} active deal${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    gridEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-search"></i></div>
        <h3>No deals found</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-top: 8px;">Try adjusting your keywords or category filters</p>
      </div>
    `;
    return;
  }

  // Render cards
  filtered.forEach(deal => {
    const card = document.createElement('div');
    card.className = 'deal-card';

    // Check tags
    let tagsHTML = '';
    if (deal.tags) {
      tagsHTML = deal.tags.split(',').map(tag => `<span class="deal-tag">${tag.trim()}</span>`).join('');
    }

    // Build tracked URL
    const trackedUrl = buildTrackedUrl(deal);

    // Determine coupon actions
    const isPromoAutomatic = deal.code.toLowerCase().includes('automatic') || deal.code.toLowerCase().includes('link');
    const couponButtonHTML = isPromoAutomatic 
      ? `<button class="btn btn-coupon" style="opacity: 0.6; cursor: default;"><i class="fas fa-magic"></i> Auto-applied</button>` 
      : `<button class="btn btn-coupon" onclick="copyCoupon(this, '${deal.code}', '${deal.id}')"><i class="far fa-copy"></i> ${deal.code}</button>`;

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title-section">
          <h2 class="company-name">${deal.name}</h2>
          <span class="category-badge">${deal.category}</span>
        </div>
      </div>
      
      <div class="deal-value-banner">
        <i class="fas fa-tag"></i>
        <span>${deal.deal}</span>
      </div>

      <p class="deal-desc">${deal.desc}</p>

      <div class="deal-tags-container">
        ${tagsHTML}
      </div>

      <div class="card-actions">
        ${couponButtonHTML}
        <a href="${trackedUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" data-deal-id="${deal.id}" onclick="trackOutboundClick(dealsData.find(d => d.id === '${deal.id}'), 'claim_deal')">Claim Deal <i class="fas fa-external-link-alt" style="margin-left:6px; font-size:11px;"></i></a>
      </div>
    `;
    gridEl.appendChild(card);
  });
}

// Copy Coupon Code to Clipboard
window.copyCoupon = function(button, code, dealId) {
  navigator.clipboard.writeText(code).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.style.color = 'var(--success)';
    button.style.borderColor = 'var(--success)';

    // Track copy event if dealId is provided
    if (dealId) {
      const deal = dealsData.find(d => d.id === dealId);
      if (deal) trackOutboundClick(deal, 'coupon_copy');
    }

    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.color = '';
      button.style.borderColor = '';
    }, 2000);
  }).catch(err => {
    console.error('Could not copy code:', err);
  });
};

// Make trackOutboundClick available globally for inline onclick handlers
window.trackOutboundClick = trackOutboundClick;

// Theme Management
function setupTheme() {
  const themeBtn = document.getElementById('theme-toggle');
  if (!themeBtn) return;

  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  themeBtn.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#theme-toggle i');
  if (!icon) return;
  if (theme === 'light') {
    icon.className = 'fas fa-moon';
  } else {
    icon.className = 'fas fa-sun';
  }
}

// Newsletter Popup Logic
function setupNewsletterPopup() {
  const popup = document.getElementById('newsletter-popup');
  const closeBtn = document.getElementById('close-popup');
  const form = document.getElementById('newsletter-form');

  if (!popup || !closeBtn || !form) return;

  // Show popup after 5 seconds if not already subscribed or dismissed
  const isDismissed = localStorage.getItem('devcheap_popup_dismissed');
  if (!isDismissed) {
    setTimeout(() => {
      popup.classList.add('show');
    }, 5000);
  }

  closeBtn.addEventListener('click', () => {
    popup.classList.remove('show');
    localStorage.setItem('devcheap_popup_dismissed', 'true');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('popup-email').value;
    if (email) {
      // TODO: Integrate with Beehiiv or ConvertKit API
      console.log('✅ Newsletter signup:', email);
      alert('Thanks for subscribing! We will email you the best dev deals every week.');
      localStorage.setItem('devcheap_subscribed', 'true');
      popup.classList.remove('show');
    }
  });
}

// Bootstrap Application
async function boot() {
  dealsData = await loadDeals();

  setupTheme();
  setupNewsletterPopup();

  // Search input listeners
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search-btn');

  if (searchInput && clearBtn) {
    searchInput.addEventListener('input', () => {
      clearBtn.style.display = searchInput.value ? 'block' : 'none';
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(renderDeals, 150);
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      renderDeals();
    });
  }

  // Category filter click listeners
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentCategory = e.currentTarget.dataset.category;
      renderDeals();
    });
  });

  renderDeals();
}

window.addEventListener('DOMContentLoaded', boot);
