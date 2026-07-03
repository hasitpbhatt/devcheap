import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DEALS_PATH = path.join(ROOT_DIR, 'data', 'deals.jsonl');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'templates', 'deal-detail.html');
const DEALS_DIR = path.join(ROOT_DIR, 'deals');

function getDealLastMod(dealId) {
  try {
    const raw = execSync(
      `git log --all --format="%ad" --date=short -- "data/deals.jsonl" | findstr "${dealId}" | sort -r`,
      { encoding: 'utf-8', cwd: ROOT_DIR, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const lines = raw.split('\n').filter(Boolean);
    if (lines.length > 0) return lines[0].trim();
  } catch {
    // fall through
  }
  try {
    const raw = execSync(
      `git log --all --format="%ad" --date=short -- data/deals.jsonl`,
      { encoding: 'utf-8', cwd: ROOT_DIR, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const lines = raw.split('\n').filter(Boolean);
    if (lines.length > 0) return lines[0].trim();
  } catch {
    // fall through
  }
  return null;
}

// Helper to escape HTML strings
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to build UTM tracked URL
function buildTrackedUrl(deal) {
  const UTM_SOURCE = 'devcheap.click';
  const UTM_MEDIUM = 'website';
  const UTM_CAMPAIGN = 'deal_click';
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

// Helper to format a deal card for HTML injection
function renderDealCard(deal, isNested = false) {
  const prefix = isNested ? '../../' : '';
  const folderPrefix = isNested ? '../' : 'deals/';
  const trackedUrl = buildTrackedUrl(deal);
  const isPromoAutomatic = deal.code.toLowerCase().includes('automatic') || deal.code.toLowerCase().includes('link');

  let tagsHTML = '';
  if (deal.tags) {
    tagsHTML = deal.tags.split(',').map(tag =>
      `<span class="deal-card-tag">${escapeHtml(tag.trim())}</span>`
    ).join('');
  }

  const couponBtn = isPromoAutomatic
    ? `<button class="deal-card-btn deal-card-btn-code" style="opacity:0.5;cursor:default" disabled><svg class="icon icon-chat" width="14" height="14"><use href="/images/icons.svg#icon-chat"/></svg> ${escapeHtml(deal.code)}</button>`
    : `<button class="deal-card-btn deal-card-btn-code" data-deal-id="${deal.id}"><svg class="icon icon-copy" width="14" height="14"><use href="/images/icons.svg#icon-copy"/></svg> Copy Code</button>`;

  const expiresHTML = deal.expires ? `<span class="deal-card-expires">Expires ${escapeHtml(deal.expires)}</span>` : '';
  const whyHTML = deal.why ? `<p class="deal-card-why">${escapeHtml(deal.why)}</p>` : '';
  
  const isRecommended = deal.tags && deal.tags.toLowerCase().includes('recommended');
  const recommendedBadge = isRecommended ? `<span class="deal-card-badge-recommended"><svg class="icon icon-star" width="12" height="12"><use href="/images/icons.svg#icon-star"/></svg> Recommended</span>` : '';
  
  const isSpotlight = deal.tags && deal.tags.toLowerCase().includes('spotlight');
  const spotlightBadge = isSpotlight ? `<span class="deal-card-badge-spotlight"><svg class="icon icon-spotlight" width="12" height="12"><use href="/images/icons.svg#icon-spotlight"/></svg> Spotlight</span>` : '';

  return `
      <div class="deal-card">
        <div class="deal-card-header">
          <h3 class="deal-card-title"><a href="${folderPrefix}${deal.id}/" style="color:inherit; text-decoration:none; hover:text-decoration:underline;">${escapeHtml(deal.name)}</a></h3>
          <span class="deal-card-cat">${escapeHtml(deal.category)}</span>
        </div>
        <div class="deal-card-deal">${escapeHtml(deal.deal)}</div>
        ${recommendedBadge}${spotlightBadge}
        ${whyHTML}
        <p class="deal-card-desc">${escapeHtml(deal.desc)}</p>
        <div class="deal-card-tags">${tagsHTML}${expiresHTML}</div>
        <div class="deal-card-footer">
          <a href="${trackedUrl}" target="_blank" rel="noopener noreferrer" class="deal-card-btn deal-card-btn-primary" data-deal-id="${deal.id}">Claim Deal</a>
          ${couponBtn}
        </div>
      </div>`;
}

async function main() {
  console.log('🏁 Starting build process...');

  // 1. Load Deals Data
  const rawData = await fs.readFile(DEALS_PATH, 'utf-8');
  const deals = rawData
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
  
  deals.sort((a, b) => a.name.localeCompare(b.name));

  const totalDeals = deals.length;
  const categories = [...new Set(deals.map(d => d.category))].sort();
  const totalCategories = categories.length;

  console.log(`📊 Loaded ${totalDeals} deals across ${totalCategories} categories.`);

  // 2. Pre-render Main index.html
  let indexHtml = await fs.readFile(INDEX_PATH, 'utf-8');

  // Pre-render stats
  indexHtml = indexHtml.replace(
    /<span class="hero-stat-num" id="stat-deals" data-prefix="">.*?<\/span>/,
    `<span class="hero-stat-num" id="stat-deals" data-prefix="">${totalDeals}</span>`
  );
  indexHtml = indexHtml.replace(
    /<span class="hero-stat-num" id="stat-categories" data-prefix="">.*?<\/span>/,
    `<span class="hero-stat-num" id="stat-categories" data-prefix="">${totalCategories}</span>`
  );
  indexHtml = indexHtml.replace(
    /<span class="hero-stat-num" id="stat-partners" data-prefix="">.*?<\/span>/,
    `<span class="hero-stat-num" id="stat-partners" data-prefix="">${totalDeals}</span>`
  );
  indexHtml = indexHtml.replace(
    /<div id="deals-count" class="results-info">.*?<\/div>/,
    `<div id="deals-count" class="results-info">${totalDeals} active deals</div>`
  );

  // Pre-render categories buttons (ensure we have all categories statically, matching existing list)
  const hardcodedCats = ['hosting', 'database', 'apis', 'ai & llm', 'auth', 'tools', 'monitoring', 'storage', 'security', 'domains'];
  const categoryButtons = [
    '<button type="button" class="cat-btn active" data-cat="all" role="tab" aria-selected="true">All</button>',
    '<button type="button" class="cat-btn" data-cat="hosting" role="tab" aria-selected="false">Hosting &amp; Cloud</button>',
    '<button type="button" class="cat-btn" data-cat="database" role="tab" aria-selected="false">Database</button>',
    '<button type="button" class="cat-btn" data-cat="apis" role="tab" aria-selected="false">APIs &amp; Email</button>',
    '<button type="button" class="cat-btn" data-cat="ai &amp; llm" role="tab" aria-selected="false">AI &amp; LLM</button>',
    '<button type="button" class="cat-btn" data-cat="auth" role="tab" aria-selected="false">Auth</button>',
    '<button type="button" class="cat-btn" data-cat="tools" role="tab" aria-selected="false">Developer Tools</button>',
    '<button type="button" class="cat-btn" data-cat="monitoring" role="tab" aria-selected="false">Monitoring</button>',
    '<button type="button" class="cat-btn" data-cat="storage" role="tab" aria-selected="false">Storage</button>',
    '<button type="button" class="cat-btn" data-cat="security" role="tab" aria-selected="false">Security</button>',
    '<button type="button" class="cat-btn" data-cat="domains" role="tab" aria-selected="false">Domains</button>'
  ];

  categories.forEach(cat => {
    const catLower = cat.toLowerCase();
    const isCovered = hardcodedCats.some(ec => catLower.includes(ec));
    if (!isCovered) {
      categoryButtons.push(`<button type="button" class="cat-btn" data-cat="${escapeHtml(catLower)}" role="tab" aria-selected="false">${escapeHtml(cat)}</button>`);
    }
  });
  
  indexHtml = indexHtml.replace(
    /<div class="categories" id="categories-container" role="tablist">[\s\S]*?<\/div>/,
    `<div class="categories" id="categories-container" role="tablist">\n            ${categoryButtons.join('\n            ')}\n          </div>`
  );

  // Pre-render deals grid
  const dealsCardsHtml = deals.map(deal => renderDealCard(deal, false)).join('\n');
  const gridStartMarker = '<div id="deals-grid" class="deals-grid">';
  const gridStart = indexHtml.indexOf(gridStartMarker);
  const gridEnd = indexHtml.indexOf('</main>', gridStart);
  const prefix = indexHtml.substring(0, gridStart);
  const afterGrid = indexHtml.substring(gridEnd);
  indexHtml = prefix + `<div id="deals-grid" class="deals-grid">\n${dealsCardsHtml}\n </div>` + afterGrid;

  await fs.writeFile(INDEX_PATH, indexHtml, 'utf-8');
  console.log('✅ Main index.html pre-rendered successfully.');

  // 3. Generate Deal Detail Pages
  const detailTemplate = await fs.readFile(TEMPLATE_PATH, 'utf-8');
  await fs.mkdir(DEALS_DIR, { recursive: true });

  for (const deal of deals) {
    const dealDir = path.join(DEALS_DIR, deal.id);
    await fs.mkdir(dealDir, { recursive: true });

    // Format tags
    const tagsHTML = deal.tags ? deal.tags.split(',').map(tag =>
      `<span class="detail-tag">${escapeHtml(tag.trim())}</span>`
    ).join('') : '';

    // Format badges
    const isRecommended = deal.tags && deal.tags.toLowerCase().includes('recommended');
    const recommendedBadge = isRecommended ? `<span class="deal-card-badge-recommended" style="margin-bottom:0;margin-right:12px"><svg class="icon icon-star" width="12" height="12"><use href="/images/icons.svg#icon-star"/></svg> Recommended</span>` : '';
    
    const isSpotlight = deal.tags && deal.tags.toLowerCase().includes('spotlight');
    const spotlightBadge = isSpotlight ? `<span class="deal-card-badge-spotlight" style="margin-bottom:0"><svg class="icon icon-spotlight" width="12" height="12"><use href="/images/icons.svg#icon-spotlight"/></svg> Spotlight</span>` : '';
    
    const badgesRow = `${recommendedBadge}${spotlightBadge}`;

    // Claim button
    const trackedUrl = buildTrackedUrl(deal);
    const claimButton = `<a href="${trackedUrl}" target="_blank" rel="noopener noreferrer" class="sidebar-btn sidebar-btn-primary">Claim Deal</a>`;

    // Coupon button
    const isPromoAutomatic = deal.code.toLowerCase().includes('automatic') || deal.code.toLowerCase().includes('link');
    const couponButton = isPromoAutomatic
      ? `<button class="sidebar-btn sidebar-btn-secondary" style="opacity:0.5;cursor:default" disabled><svg class="icon icon-chat" width="14" height="14"><use href="/images/icons.svg#icon-chat"/></svg> Automatic Discount</button>`
      : `<button id="copy-coupon-btn" class="sidebar-btn sidebar-btn-secondary" data-code="${escapeHtml(deal.code)}"><svg class="icon icon-copy" width="14" height="14"><use href="/images/icons.svg#icon-copy"/></svg> Copy Coupon (${escapeHtml(deal.code)})</button>`;

    // Related deals (3 deals in the same category, or fallback to any deals)
    let related = deals.filter(d => d.category === deal.category && d.id !== deal.id);
    if (related.length < 3) {
      const extra = deals.filter(d => d.category !== deal.category && d.id !== deal.id);
      related = [...related, ...extra].slice(0, 3);
    } else {
      related = related.slice(0, 3);
    }
    const relatedHtml = related.map(r => renderDealCard(r, true)).join('\n');

    // Breadcrumb JSON-LD
    const breadcrumbJson = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://devcheap.click/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": deal.category,
          "item": `https://devcheap.click/?category=${encodeURIComponent(deal.category.toLowerCase())}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": deal.name,
          "item": `https://devcheap.click/deals/${deal.id}/`
        }
      ]
    };
    const breadcrumbJsonHtml = `<script type="application/ld+json">\n${JSON.stringify(breadcrumbJson, null, 2)}\n</script>`;

    // Product JSON-LD
    const productJson = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": deal.name,
      "description": deal.desc,
      "image": "https://devcheap.click/images/og-image.svg",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD",
        "description": deal.deal,
        "itemCondition": "https://schema.org/NewCondition",
        "availability": "https://schema.org/InStock",
        "url": `https://devcheap.click/deals/${deal.id}/`
      }
    };
    const productJsonHtml = `<script type="application/ld+json">\n${JSON.stringify(productJson, null, 2)}\n</script>`;

    // Replace placeholders
    let populated = detailTemplate
      .replace(/{{DEAL_ID}}/g, escapeHtml(deal.id))
      .replace(/{{DEAL_NAME}}/g, escapeHtml(deal.name))
      .replace(/{{DEAL_OFFER}}/g, escapeHtml(deal.deal))
      .replace(/{{DEAL_DESC}}/g, escapeHtml(deal.desc))
      .replace(/{{DEAL_WHY}}/g, escapeHtml(deal.why || ''))
      .replace(/{{DEAL_CATEGORY}}/g, escapeHtml(deal.category))
      .replace(/{{DEAL_CATEGORY_SLUG}}/g, escapeHtml(deal.category.toLowerCase()))
      .replace(/{{DEAL_CATEGORY_ENCODED}}/g, encodeURIComponent(deal.category.toLowerCase()))
      .replace(/{{DEAL_BADGES}}/g, badgesRow)
      .replace(/{{DEAL_EXPIRES}}/g, escapeHtml(deal.expires || 'No Expiry'))
      .replace(/{{DEAL_TAGS}}/g, tagsHTML)
      .replace(/{{DEAL_CLAIM_BUTTON}}/g, claimButton)
      .replace(/{{DEAL_COUPON_BUTTON}}/g, couponButton)
      .replace(/{{RELATED_DEALS}}/g, relatedHtml)
      .replace(/{{BREADCRUMB_JSONLD}}/g, breadcrumbJsonHtml)
      .replace(/{{PRODUCT_JSONLD}}/g, productJsonHtml);

    await fs.writeFile(path.join(dealDir, 'index.html'), populated, 'utf-8');
  }

  console.log(`✅ Generated ${totalDeals} deal detail pages under /deals/[id]/index.html`);

// 4. Generate sitemap.xml
const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
const today = new Date().toISOString().split('T')[0];
let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://devcheap.click/</loc>
<lastmod>${today}</lastmod>
<changefreq>weekly</changefreq>
<priority>1.0</priority>
</url>
`;

for (const deal of deals) {
  if (!deal.url) continue;
  const lastmod = getDealLastMod(deal.id) || today;
  sitemapXml += ` <url>
 <loc>https://devcheap.click/deals/${deal.id}/</loc>
 <lastmod>${lastmod}</lastmod>
 <changefreq>weekly</changefreq>
 <priority>0.8</priority>
 </url>
`;
}

sitemapXml += `</urlset>\n`;
await fs.writeFile(sitemapPath, sitemapXml, 'utf-8');
console.log('✅ Generated sitemap.xml with all deal detail pages.');
  console.log('🎉 Build complete!');
}

main().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
