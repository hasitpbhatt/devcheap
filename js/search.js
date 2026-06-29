// DevCheap - Lean Developer Deals Catalog Engine

let dealsData = [];
let currentCategory = 'all';
let searchTimeout = null;

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

    // Determine coupon actions
    const isPromoAutomatic = deal.code.toLowerCase().includes('automatic') || deal.code.toLowerCase().includes('link');
    const couponButtonHTML = isPromoAutomatic 
      ? `<button class="btn btn-coupon" style="opacity: 0.6; cursor: default;"><i class="fas fa-magic"></i> Auto-applied</button>` 
      : `<button class="btn btn-coupon" onclick="copyCoupon(this, '${deal.code}')"><i class="far fa-copy"></i> ${deal.code}</button>`;

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
        <a href="${deal.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Claim Deal <i class="fas fa-external-link-alt" style="margin-left:6px; font-size:11px;"></i></a>
      </div>
    `;
    gridEl.appendChild(card);
  });
}

// Copy Coupon Code to Clipboard
window.copyCoupon = function(button, code) {
  navigator.clipboard.writeText(code).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.style.color = 'var(--success)';
    button.style.borderColor = 'var(--success)';
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.color = '';
      button.style.borderColor = '';
    }, 2000);
  }).catch(err => {
    console.error('Could not copy code:', err);
  });
};

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

// Bootstrap Application
async function boot() {
  dealsData = await loadDeals();

  setupTheme();

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
