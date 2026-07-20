import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { sanitizeDealValue } from '../js/sanitize-deal-value.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DEALS_PATH = path.join(ROOT_DIR, 'data', 'deals.jsonl');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'templates', 'deal-detail.html');
const DEALS_DIR = path.join(ROOT_DIR, 'deals');

// 🚀 OPTIMIZATION 1: Fetch global file modification date ONCE
function getFileLastMod(filePath) {
  try {
    const raw = execSync(
      `git log -1 --format="%ad" --date=short -- "${filePath}"`,
      { encoding: 'utf-8', cwd: ROOT_DIR, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    if (raw.trim()) return raw.trim();
  } catch {
    // fall through
  }
  return new Date().toISOString().split('T')[0];
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
        <div class="deal-card-deal">${escapeHtml(sanitizeDealValue(deal.deal))}</div>
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

// Deals with rating below this threshold are demoted from the homepage grid.
// Must stay in sync with FEATURED_RATING_MIN in js/search.js.
const FEATURED_RATING_MIN = 8.0;

async function generateArchive(ROOT_DIR, deals, getFileLastMod) {
  const archivePath = path.join(ROOT_DIR, 'archive.html');
  const lastMod = getFileLastMod('data/deals.jsonl');

const archived = deals
  .filter(d => {
    if (d.has_affiliate) return false;
    if (d.expires && new Date(d.expires).getTime() < Date.now()) return false;
    const r = typeof d.rating === 'number' ? d.rating : 0;
    return r < FEATURED_RATING_MIN;
  })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const cards = archived.map(d => renderDealCard(d)).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="canonical" href="https://devcheap.click/archive.html">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <title>Deal Archive — DevCheap</title>
  <meta name="description" content="All DevCheap developer deals, including community and lower-rated picks. Every deal stays directly linkable.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Deal Archive — DevCheap">
  <meta property="og:description" content="Every DevCheap deal, including lower-rated picks kept directly linkable.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://devcheap.click/archive.html">
  <meta property="og:site_name" content="DevCheap">
  <meta property="og:image" content="https://devcheap.click/images/og-image.svg">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <nav class="nav" aria-label="Main navigation">
    <div class="nav-inner">
      <a href="/" class="nav-logo"><span class="nav-logo-badge">devcheap</span></a>
      <div class="nav-links">
        <a href="/#deals" class="nav-link">Deals</a>
        <a href="/#newsletter" class="nav-link">Newsletter</a>
      </div>
    </div>
  </nav>
  <main class="container" style="padding-top:calc(var(--nav-height) + 32px); padding-bottom:64px;">
    <a href="/" class="breadcrumb" style="display:inline-block;margin-bottom:24px;color:var(--text-secondary);text-decoration:none;">&larr; Back to DevCheap</a>
    <h1 class="section-title">Deal Archive</h1>
    <p class="results-info" style="margin-bottom:24px;">
      ${archived.length} additional deal${archived.length === 1 ? '' : 's'} not shown on the homepage.
      These are still verified and directly linkable — share any <code>/deals/&lt;id&gt;/</code> page.
    </p>
    <div class="deals-grid">
${cards}
    </div>
  </main>
  <footer class="footer" role="contentinfo" aria-label="Site footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <span class="nav-logo-badge">devcheap</span>
        <p class="footer-text">Verified developer deals, curated weekly.</p>
      </div>
      <div class="footer-links">
        <a href="https://github.com/hasitpbhatt/devcheap" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub</a>
        <a href="/#newsletter" class="footer-link">Newsletter</a>
      </div>
    </div>
  </footer>
</body>
</html>
`;
  await fs.writeFile(archivePath, html, 'utf-8');
  console.log(`✅ Generated archive.html with ${archived.length} archived deals (rating < ${FEATURED_RATING_MIN}).`);
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

const dealLastMod = getFileLastMod(DEALS_PATH);

console.log(`📊 Loaded ${totalDeals} deals across ${totalCategories} categories. <~deals>`);

  // 2. Pre-render Main index.html
  let indexHtml = await fs.readFile(INDEX_PATH, 'utf-8');

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
    /<p id="deals-count"[^>]*>.*?<\/p>/,
    `<p id="deals-count" class="results-info" aria-live="polite">${totalDeals} active deals</p>`
  );

const categoryDisplayMap = {
  'hosting & cloud': 'Hosting & Cloud',
  'database': 'Database',
  'apis & email': 'APIs & Email',
  'apis & payments': 'APIs & Payments',
  'apis & search': 'APIs & Search',
  'ai & llm': 'AI & LLM',
  'auth': 'Auth',
  'developer tools': 'Developer Tools',
  'monitoring': 'Monitoring',
  'domains & hosting': 'Domains & Hosting',
  'storage & cloud': 'Storage & Cloud',
  'security': 'Security',
  'productivity': 'Productivity',
  'seo': 'SEO',
  'ai': 'AI',
  'social media': 'Social Media',
  'customer support': 'Customer Support',
  'sales & marketing': 'Sales & Marketing',
  'services': 'Services',
  'design & collaboration': 'Design & Collaboration',
  'web analytics': 'Web Analytics',
  'media & images': 'Media & Images',
  'ci/cd': 'CI/CD',
  'testing & qa': 'Testing & QA',
};

const allBtn = '<button type="button" class="cat-btn active" data-cat="all" role="tab" aria-selected="true">All</button>';

const added = new Set();
const categoryButtons = [
  allBtn,
  ...Object.entries(categoryDisplayMap)
    .filter(([slug, _]) => categories.some(c => c.toLowerCase() === slug))
    .map(([slug, label]) => {
      added.add(slug);
      return `<button type="button" class="cat-btn" data-cat="${escapeHtml(slug)}" role="tab" aria-selected="false">${escapeHtml(label)}</button>`;
    }),
  ...categories
    .filter(cat => !added.has(cat.toLowerCase()))
    .sort()
    .map(cat => `<button type="button" class="cat-btn" data-cat="${escapeHtml(cat.toLowerCase())}" role="tab" aria-selected="false">${escapeHtml(cat)}</button>`)
];

 indexHtml = indexHtml.replace(
   new RegExp('<div class="categories" id="categories-container" role="tablist">[\\s\\S]*?<\\/div>', 's'),
   `<div class="categories" id="categories-container" role="tablist">\n ${categoryButtons.join('\n ')}\n </div>`
 );

  // Render featured deal cards for SEO (rating >= 8.0 or has_affiliate)
  const featuredDeals = deals.filter(deal => {
    if (deal.has_affiliate) return true;
    if (deal.expires && new Date(deal.expires).getTime() < Date.now()) return false;
    const r = typeof deal.rating === 'number' ? deal.rating : 0;
    return r >= FEATURED_RATING_MIN;
  });
  const featuredCards = featuredDeals.map(d => renderDealCard(d)).join('\n');
  indexHtml = indexHtml.replace('{{DEAL_CARDS}}', featuredCards);

  // Update How It Works section counts
  indexHtml = indexHtml.replace(
    /<span id="how-it-works-count">.*?<\/span>/,
    `<span id="how-it-works-count">${totalDeals}</span>`
  );
  indexHtml = indexHtml.replace(
    /<span id="how-it-works-cats">.*?<\/span>/,
    `<span id="how-it-works-cats">${totalCategories}</span>`
  );
  await fs.writeFile(INDEX_PATH, indexHtml, 'utf-8');
console.log('✅ Main index.html updated.');

// 3. Generate Deal Detail Pages
  const detailTemplate = await fs.readFile(TEMPLATE_PATH, 'utf-8');
  await fs.mkdir(DEALS_DIR, { recursive: true });

  // Remove orphaned per-deal directories (deal removed from deals.jsonl but page left on disk)
  const validIds = new Set(deals.map(d => d.id));
  const existingDirs = await fs.readdir(DEALS_DIR, { withFileTypes: true });
  const removalPromises = existingDirs
    .filter(entry => entry.isDirectory() && !validIds.has(entry.name))
    .map(async (entry) => {
      await fs.rm(path.join(DEALS_DIR, entry.name), { recursive: true, force: true });
      console.log(`🗑️  Removed orphaned deal directory: deals/${entry.name}/`);
    });
  await Promise.all(removalPromises);

  // 🚀 OPTIMIZATION 2: Parallelize page generation with Promise.all
  const generatePagePromises = deals.map(async (deal) => {
    const dealDir = path.join(DEALS_DIR, deal.id);
    await fs.mkdir(dealDir, { recursive: true });

    const tagsHTML = deal.tags ? deal.tags.split(',').map(tag =>
      `<span class="detail-tag">${escapeHtml(tag.trim())}</span>`
    ).join('') : '';

    const isRecommended = deal.tags && deal.tags.toLowerCase().includes('recommended');
    const recommendedBadge = isRecommended ? `<span class="deal-card-badge-recommended" style="margin-bottom:0;margin-right:12px"><svg class="icon icon-star" width="12" height="12"><use href="/images/icons.svg#icon-star"/></svg> Recommended</span>` : '';
    
    const isSpotlight = deal.tags && deal.tags.toLowerCase().includes('spotlight');
    const spotlightBadge = isSpotlight ? `<span class="deal-card-badge-spotlight" style="margin-bottom:0"><svg class="icon icon-spotlight" width="12" height="12"><use href="/images/icons.svg#icon-spotlight"/></svg> Spotlight</span>` : '';
    
    const badgesRow = `${recommendedBadge}${spotlightBadge}`;

    const trackedUrl = buildTrackedUrl(deal);
    const claimButton = `<a href="${trackedUrl}" target="_blank" rel="noopener noreferrer" class="sidebar-btn sidebar-btn-primary">Claim Deal</a>`;

    const isPromoAutomatic = deal.code.toLowerCase().includes('automatic') || deal.code.toLowerCase().includes('link');
    const couponButton = isPromoAutomatic
      ? `<button class="sidebar-btn sidebar-btn-secondary" style="opacity:0.5;cursor:default" disabled><svg class="icon icon-chat" width="14" height="14"><use href="/images/icons.svg#icon-chat"/></svg> Automatic Discount</button>`
      : `<button id="copy-coupon-btn" class="sidebar-btn sidebar-btn-secondary" data-code="${escapeHtml(deal.code)}"><svg class="icon icon-copy" width="14" height="14"><use href="/images/icons.svg#icon-copy"/></svg> Copy Coupon (${escapeHtml(deal.code)})</button>`;

    let related = deals.filter(d => d.category === deal.category && d.id !== deal.id);
    if (related.length < 3) {
      const extra = deals.filter(d => d.category !== deal.category && d.id !== deal.id);
      related = [...related, ...extra].slice(0, 3);
    } else {
      related = related.slice(0, 3);
    }
    const relatedHtml = related.map(r => renderDealCard(r, true)).join('\n');

    const breadcrumbJson = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devcheap.click/" },
        { "@type": "ListItem", "position": 2, "name": deal.category, "item": `https://devcheap.click/?category=${encodeURIComponent(deal.category.toLowerCase())}` },
        { "@type": "ListItem", "position": 3, "name": deal.name, "item": `https://devcheap.click/deals/${deal.id}/` }
      ]
    };
    const breadcrumbJsonHtml = `<script type="application/ld+json">\n${JSON.stringify(breadcrumbJson, null, 2)}\n</script>`;

const productJson = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": deal.name,
  "description": deal.desc,
  "image": "https://devcheap.click/images/og-image.svg",
  "dateModified": dealLastMod,
  "offers": {
    "@type": "Offer",
    "description": deal.deal,
    "url": `https://devcheap.click/deals/${deal.id}/`
  }
};
    const productJsonHtml = `<script type="application/ld+json">\n${JSON.stringify(productJson, null, 2)}\n</script>`;

    let populated = detailTemplate
      .replace(/{{DEAL_ID}}/g, escapeHtml(deal.id))
      .replace(/{{DEAL_NAME}}/g, escapeHtml(deal.name))
      .replace(/{{DEAL_OFFER}}/g, escapeHtml(sanitizeDealValue(deal.deal)))
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

    // This await happens inside the mapped function context concurrently
    await fs.writeFile(path.join(dealDir, 'index.html'), populated, 'utf-8');
  });

  // Execute all page generation promises simultaneously
  await Promise.all(generatePagePromises);
  
  console.log(`✅ Generated ${totalDeals} deal detail pages under /deals/[id]/index.html`);

  // 4. Generate sitemap.xml
  const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch file date ONCE (Optimization 1 executed)
  const globalLastMod = getFileLastMod('data/deals.jsonl');

  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  sitemapXml += `<url>\n  <loc>https://devcheap.click/</loc>\n  <lastmod>${today}</lastmod>\n  <changefreq>weekly</changefreq>\n  <priority>1.0</priority>\n</url>\n`;

  for (const deal of deals) {
    if (!deal.url) continue;
    sitemapXml += `<url>\n  <loc>https://devcheap.click/deals/${deal.id}/</loc>\n  <lastmod>${globalLastMod}</lastmod>\n  <changefreq>weekly</changefreq>\n  <priority>0.8</priority>\n</url>\n`;
  }

  sitemapXml += `</urlset>\n`;
  await fs.writeFile(sitemapPath, sitemapXml, 'utf-8');
  
  // 5. Generate sitemap_index.xml
  const sitemapIndexPath = path.join(ROOT_DIR, 'sitemap_index.xml');
  const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<sitemap>\n  <loc>https://devcheap.click/sitemap.xml</loc>\n  <lastmod>${today}</lastmod>\n</sitemap>\n</sitemapindex>\n`;
  await fs.writeFile(sitemapIndexPath, sitemapIndexXml, 'utf-8');
  
  console.log('✅ Generated sitemap.xml with all deal detail pages.');
  console.log('✅ Generated sitemap_index.xml.');

  // 6. Generate archive.html — low-value deals kept linkable but off the homepage
  await generateArchive(ROOT_DIR, deals, getFileLastMod);

  console.log('✨ Build complete! Time to deploy.');
}

main().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
