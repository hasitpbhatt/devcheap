import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { sanitizeDealValue } from '../js/sanitize-deal-value.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DEALS_PATH = path.join(ROOT_DIR, 'data', 'deals.jsonl');
const FAQ_PATH = path.join(ROOT_DIR, 'data', 'deal-faqs.json');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'templates', 'deal-detail.html');
const DEALS_DIR = path.join(ROOT_DIR, 'deals');

const AFFILIATE_DISCLOSURE_URL = '/disclosure/';

function renderAffiliateDisclosure() {
  return `<p class="footer-disclosure">Some links on this page are affiliate links. DevCheap may earn a commission if you sign up through them, at no extra cost to you. <a href="${AFFILIATE_DISCLOSURE_URL}">Read our full disclosure</a>.</p>`;
}

let dealFaqCache = null;
async function loadDealFaqs() {
  if (dealFaqCache) return dealFaqCache;
  try {
    const raw = await fs.readFile(FAQ_PATH, 'utf-8');
    dealFaqCache = JSON.parse(raw);
    return dealFaqCache;
  } catch {
    dealFaqCache = {};
    return dealFaqCache;
  }
}

function getDealOfferPrice(deal) {
  const dealStr = deal.deal || '';
  if (deal.pricing === 'free' || deal.pricing === 'trial') {
    return { price: '0', priceCurrency: 'USD' };
  }
  const usdMatch = dealStr.match(/\$(\d+(?:\.\d{1,2})?)/);
  if (usdMatch) return { price: usdMatch[1], priceCurrency: 'USD' };
  const eurMatch = dealStr.match(/[€€](\d+(?:\.\d{1,2})?)/);
  if (eurMatch) return { price: eurMatch[1], priceCurrency: 'EUR' };
  return { price: '0', priceCurrency: 'USD' };
}

function generateFallbackFaqs(deal) {
  const faqs = [];
  const pricing = (deal.pricing || '').toLowerCase();
  const dealDesc = (deal.deal || '');
  const isFree = pricing === 'free';
  const isLifetime = pricing === 'lifetime';
  const isTrial = pricing === 'trial';
  const hasExpiry = !!deal.expires;
  const needsCoupon = deal.code && !deal.code.toLowerCase().includes('automatic') && !deal.code.toLowerCase().includes('link');
  const needsStartup = deal.tags && deal.tags.toLowerCase().includes('startup-only');
  const needsCC = deal.tags && deal.tags.toLowerCase().includes('cc-required');

  if (isFree) {
    faqs.push({
      q: `Is ${deal.name} really free?`,
      a: `Yes, ${deal.name} offers a free tier. ${dealDesc}${deal.desc ? ' ' + deal.desc : ''}${hasExpiry ? ` This offer is valid until ${deal.expires}.` : ''} Check the official website for the most current terms and availability in your region.`
    });
  } else if (isLifetime) {
    faqs.push({
      q: `Is the ${deal.name} lifetime deal a one-time payment?`,
      a: `Yes, this is a one-time payment of ${dealDesc.replace(/^.*?(\$[\d.]+).*$/, '$1')}. There are no recurring subscription fees. ${deal.why || ''}${hasExpiry ? ` This lifetime offer expires ${deal.expires}.` : ''}`
    });
  } else if (isTrial) {
    faqs.push({
      q: `What does the ${deal.name} free trial include?`,
      a: `${dealDesc}${deal.desc ? ' ' + deal.desc : ''} After the trial ends, you'll need to upgrade to a paid plan to continue using the service.`
    });
  } else {
    faqs.push({
      q: `What is the ${deal.name} deal?`,
      a: `${dealDesc} ${deal.why || ''}${hasExpiry ? ` This offer expires ${deal.expires}.` : ''}`
    });
  }

  if (needsCoupon) {
    faqs.push({
      q: `How do I use the ${deal.name} coupon code?`,
      a: `Visit the ${deal.name} website, create an account (or sign in), and enter the code ${deal.code} at checkout or in the billing/promotions section. Make sure to apply the code before completing your purchase.`
    });
  } else if (needsStartup) {
    faqs.push({
      q: `Does my startup qualify for this ${deal.name} deal?`,
      a: `This deal requires startup status. Apply through ${deal.name}'s startup program page to check eligibility. Many programs accept companies without VC backing — requirements vary by provider. Most require a company website, business email, and proof of being an early-stage company.`
    });
  } else {
    faqs.push({
      q: `How do I get started with ${deal.name}?`,
      a: `Visit the ${deal.name} website and sign up.${deal.code && deal.code.toLowerCase().includes('automatic') ? ' The discount is applied automatically via the link.' : ''}${!needsCC ? ' No credit card is required to start.' : ''}`
    });
  }

  if (needsCC) {
    faqs.push({
      q: `Does ${deal.name} require a credit card?`,
      a: `Yes, ${deal.name} requires a credit card to sign up. You won't be charged as long as you stay within the free tier limits. Set up budget alerts or spending limits to avoid surprise charges.`
    });
  }

  if (isLifetime && !needsCC) {
    faqs.push({
      q: `Is the ${deal.name} lifetime deal worth it?`,
      a: `A one-time payment of ${dealDesc.replace(/^.*?(\$[\d.]+).*$/, '$1')} breaks even against typical monthly subscriptions ($10-30/month) in just a few months. If you need the tool for more than 3-6 months, the lifetime deal provides significant long-term savings.`
    });
  }

  if (isFree && hasExpiry) {
    faqs.push({
      q: `What happens after the ${deal.name} offer expires?`,
      a: `After the offer expires on ${deal.expires}, the standard pricing applies. Check the ${deal.name} website for current pricing tiers and consider upgrading before the expiration date to ensure uninterrupted service.`
    });
  }

  return faqs.slice(0, 4);
}

function generateDealFaqHtml(deal, dealFaqData) {
  const faqs = dealFaqData[deal.id] || generateFallbackFaqs(deal);
  const faqHtml = faqs.map((faq, i) => `
    <div class="faq-item">
      <button class="faq-question" aria-expanded="${i === 0 ? 'true' : 'false'}">${escapeHtml(faq.q)}</button>
      <div class="faq-answer" aria-hidden="${i === 0 ? 'false' : 'true'}">${escapeHtml(faq.a)}</div>
    </div>`).join('\n');
  return faqHtml;
}

function generateDealFaqJsonld(deal, dealFaqData) {
  const faqs = dealFaqData[deal.id] || generateFallbackFaqs(deal);
  if (!faqs || faqs.length === 0) return '';
  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };
  return `<script type="application/ld+json">\n${JSON.stringify(faqJson, null, 2)}\n</script>`;
}

// 🚀 OPTIMIZATION 1: Fetch global file modification date ONCE
function getFileLastMod(filePath) {
  try {
    const raw = execSync(
      `git log -1 --format="%ad" --date=short -- "${filePath}"`,
      { encoding: 'utf-8', cwd: ROOT_DIR, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    if (raw.trim()) return raw.trim();
  } catch {
    console.warn(
      `[build] git log failed for ${filePath}; using current date for lastmod. ` +
      `If running outside a git checkout, sitemap lastmod will be inaccurate.`
    );
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
    console.warn(`[build] Cannot parse ${targetUrl} as a URL; returning raw targetUrl.`);
    return targetUrl;
  }
}

function renderDealCard(deal, isNested = false) {
  const prefix = isNested ? '../../' : '';
  const folderPrefix = isNested ? '../' : 'deals/';
  const trackedUrl = buildTrackedUrl(deal);
  const isPromoAutomatic = deal.code ? (deal.code.toLowerCase().includes('automatic') || deal.code.toLowerCase().includes('link')) : false;

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

  const programLabel = deal.requiresProgram === 'startup' ? 'Requires startup status' : deal.requiresProgram === 'student' ? 'Requires student status' : deal.requiresProgram === 'accelerator' ? 'Requires accelerator status' : '';
  const programHTML = programLabel ? `<span class="deal-card-tag-program deal-card-tag-program-${escapeHtml(String(deal.requiresProgram))}">${programLabel}</span>` : '';

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
        <div class="deal-card-tags">${programHTML}${tagsHTML}${expiresHTML}</div>
        <div class="deal-card-footer">
          <a href="${trackedUrl}" target="_blank" rel="noopener noreferrer" class="deal-card-btn deal-card-btn-primary" data-deal-id="${deal.id}">Claim Deal</a>
          ${couponBtn}
        </div>
      </div>`;
}

function renderTopPickCard(deal) {
  const trackedUrl = buildTrackedUrl(deal);
  const isPromoAutomatic = deal.code ? (deal.code.toLowerCase().includes('automatic') || deal.code.toLowerCase().includes('link')) : false;
  const affiliateClass = deal.has_affiliate ? ' top-picks-card--affiliate' : '';
  const couponBtn = isPromoAutomatic
    ? `<button class="deal-card-btn deal-card-btn-code" style="opacity:0.5;cursor:default" disabled>${escapeHtml(deal.code)}</button>`
    : `<button class="deal-card-btn deal-card-btn-code" data-deal-id="${deal.id}">Copy Code</button>`;
  const expiresHTML = deal.expires ? `<span class="top-picks-card-expires">Ends ${escapeHtml(deal.expires)}</span>` : '';
  return `
      <article class="top-picks-card${affiliateClass}">
        <div class="top-picks-card-rank">
          <svg class="icon icon-star" width="14" height="14" aria-hidden="true"><use href="/images/icons.svg#icon-star"/></svg>
          <span>Editor's Pick</span>
        </div>
        <div class="top-picks-card-body">
          <span class="top-picks-card-cat">${escapeHtml(deal.category)}</span>
          <h3 class="top-picks-card-title"><a href="deals/${deal.id}/">${escapeHtml(deal.name)}</a></h3>
          <div class="top-picks-card-deal">${escapeHtml(sanitizeDealValue(deal.deal))}</div>
          ${deal.why ? `<p class="top-picks-card-why">${escapeHtml(deal.why)}</p>` : ''}
        </div>
        <div class="top-picks-card-footer">
          <a href="${trackedUrl}" target="_blank" rel="noopener noreferrer" class="deal-card-btn deal-card-btn-primary" data-deal-id="${deal.id}">Claim Deal</a>
          ${couponBtn}
          ${expiresHTML}
        </div>
      </article>`;
}

// Deals with rating below this threshold are demoted from the homepage grid.
// Must stay in sync with FEATURED_RATING_MIN in js/search.js.
const FEATURED_RATING_MIN = 8.0;

function categorySlug(category) {
  return category.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toolSlug(name, id) {
  const base = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return base || String(id);
}

// Deterministic, collision-free slug map for /alternatives/<slug>/ pages.
function computeAlternativeSlugs(deals) {
  const map = new Map();
  const used = new Set();
  for (const d of deals) {
    let s = toolSlug(d.name, d.id);
    if (used.has(s)) s = `${s}-${d.id}`;
    used.add(s);
    map.set(d.id, s);
  }
  return map;
}

// Category SEO copy and long-form article copy live in JSON so they can be
// linted by scripts/check-voice.js and edited without touching build logic.
// See scripts/extract-copy.js for how they were migrated out of this file.
const CATEGORY_SEO_PATH = path.join(ROOT_DIR, 'data', 'category-seo.json');
const ARTICLES_PATH = path.join(ROOT_DIR, 'data', 'articles.json');

let categorySEOCache = null;
async function loadCategorySEO() {
  if (categorySEOCache) return categorySEOCache;
  try {
    const raw = await fs.readFile(CATEGORY_SEO_PATH, 'utf-8');
    categorySEOCache = JSON.parse(raw);
    return categorySEOCache;
  } catch {
    categorySEOCache = {};
    return categorySEOCache;
  }
}

let articlesCache = null;
async function loadArticles() {
  if (articlesCache) return articlesCache;
  try {
    const raw = await fs.readFile(ARTICLES_PATH, 'utf-8');
    articlesCache = JSON.parse(raw);
    return articlesCache;
  } catch {
    articlesCache = [];
    return articlesCache;
  }
}

const defaultSEO = {
  title: 'Best Deals for Developers — Free Credits & Discounts | DevCheap',
  h1: 'Developer Tool Deals',
  intro: 'Curated deals on developer tools, APIs, hosting, and AI services. Free credits, lifetime licenses, and exclusive discounts verified and updated regularly.',
  faqs: [{ q: 'How are deals verified?', a: 'Every deal on DevCheap is manually reviewed, rated 1-10, and categorized. We verify each offer\'s terms, pricing, and expiration date before listing.' }, { q: 'Do deals require a startup?', a: 'Some deals require startup status or VC backing, but many are available to all developers. Use the "startup-only" tag filter to distinguish. Free tiers and lifetime deals typically have no requirements.' }]
};

async function generateAggregatePages(ROOT_DIR, deals) {
  const articlesDir = path.join(ROOT_DIR, 'articles');
  await fs.mkdir(articlesDir, { recursive: true });

  const articles = await loadArticles();
  const articlePromises = articles.map(async (article) => {
    const articleDir = path.join(articlesDir, article.slug);
    await fs.mkdir(articleDir, { recursive: true });

    const sectionsHtml = article.sections.map(s => `
      <section class="article-section">
        <h2>${escapeHtml(s.h2)}</h2>
        <p>${escapeHtml(s.content)}</p>
      </section>`).join('\n');

    // Collect relevant deal links for this article
    const articleDealSlugs = {
      'best-free-cloud-credits': ['aws-activate','google-cloud-startups','microsoft-for-startups','cloudflare-for-startups','digitalocean-startups','netlify','vercel','flyio','cloudflare'],
      'best-free-ai-apis': ['github-models','google-ai-studio','cloudflare-workers-ai','openrouter','groq','cerebras','sambanova-cloud','together-ai','deepgram','assemblyai','openai-startup-credits','anthropic-claude-startups'],
      'how-to-pick-free-llm-api': ['google-ai-studio','groq','openrouter','cerebras','huggingface-providers','together-ai'],
      'free-developer-tools-2026': ['github-copilot','codeium','bruno','hoppscotch','posthog','grafana-cloud','better-stack','neon','supabase','appwrite','launchdarkly','retool'],
      'startup-credit-programs': ['aws-activate','google-cloud-startups','microsoft-for-startups','cloudflare-for-startups','digitalocean-startups','openai-startup-credits','anthropic-claude-startups','neon-startup-credits','circleci-startup','credit-for-startups','saasoffers','fin-ai-startup-pack','kong-for-startups'],
      'best-lifetime-deals-developers': ['polypane','n8nitiator','screpy','fastestvpn','stickypassword','adguard','sendfox','emailit','tidycal','rocketscrape','senderstack','teable'],
      'saas-zero-budget': ['aws-activate','google-cloud-startups','microsoft-for-startups','cloudflare-for-startups','digitalocean-startups','neon','neon-startup-credits','supabase','cockroachdb-cloud','planetscale','turso','auth0','clerk','posthog','sentry','netlify','vercel'],
      'auth-database-setup': ['neon','supabase','planetscale','upstash','redis-cloud','cockroachdb-cloud','appwrite','pocketbase','auth0','clerk','turso'],
      'ai-feature-cheap': ['github-models','openrouter','groq','cerebras','together-ai','anthropic-claude-startups','openai-startup-credits','cloudflare-workers-ai','deepgram','elevenlabs']
    };

    const relatedDealIds = articleDealSlugs[article.slug] || [];
    const relatedDeals = deals.filter(d => relatedDealIds.includes(d.id));
    const relatedDealsCards = relatedDeals.map(d => renderDealCard(d)).join('\n')
      .replace(/href="deals\//g, 'href="/deals/');
    const articleHasAffiliate = relatedDeals.some(d => d.has_affiliate);
    const articleDisclosure = articleHasAffiliate ? renderAffiliateDisclosure() : '';

    const pageHtml = `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="canonical" href="https://devcheap.click/articles/${article.slug}/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>${escapeHtml(article.title)} | DevCheap</title>
  <meta name="description" content="${escapeHtml(article.metaDesc)}">
  <meta property="og:title" content="${escapeHtml(article.title)} | DevCheap">
  <meta property="og:description" content="${escapeHtml(article.metaDesc)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://devcheap.click/articles/${article.slug}/">
  <meta property="og:site_name" content="DevCheap">
  <meta property="og:image" content="https://devcheap.click/images/og-image.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(article.title)} | DevCheap">
  <meta name="twitter:description" content="${escapeHtml(article.metaDesc)}">
  <meta name="twitter:image" content="https://devcheap.click/images/og-image.svg">
  <link rel="stylesheet" href="/css/style.css">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-9QV2CZSZP4"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-9QV2CZSZP4');</script>
  <style>
    .article-page { padding-top: var(--nav-height); min-height: 100vh; display: flex; flex-direction: column; }
    .article-page main { flex: 1; }
    .article-hero { padding: 48px 0 24px; }
    .article-hero h1 { font-size: 36px; font-weight: 800; letter-spacing: -1px; line-height: 1.15; margin-bottom: 12px; color: var(--text); }
    .article-hero p { font-size: 16px; color: var(--text-secondary); line-height: 1.6; max-width: 720px; }
    .article-section { margin-top: 32px; padding: 24px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
    .article-section h2 { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: var(--text); letter-spacing: -0.3px; }
    .article-section p { font-size: 15px; color: var(--text-secondary); line-height: 1.7; }
    .article-deals { margin-top: 48px; padding-top: 32px; border-top: 1px solid var(--border); }
    .article-deals h2 { font-size: 24px; font-weight: 700; margin-bottom: 24px; color: var(--text); letter-spacing: -0.4px; }
    .breadcrumb { font-size: 13px; font-weight: 500; color: var(--text-tertiary); margin-bottom: 24px; }
    .breadcrumb a { color: var(--text-secondary); text-decoration: none; }
    .breadcrumb a:hover { color: var(--accent); }
    .breadcrumb .sep { margin: 0 8px; color: var(--text-tertiary); }
  </style>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${escapeHtml(article.title)}",
    "description": "${escapeHtml(article.metaDesc)}",
    "url": "https://devcheap.click/articles/${article.slug}/",
    "publisher": { "@type": "Organization", "name": "DevCheap" }
  }
  </script>
</head>
<body>
  <div class="article-page">
    <nav class="nav" aria-label="Main navigation">
      <div class="nav-inner">
        <a href="/" class="nav-logo"><span class="nav-logo-badge">devcheap</span></a>
        <div class="nav-links">
          <a href="/#deals" class="nav-link">All Deals</a>
          <a href="/#newsletter" class="nav-link">Newsletter</a>
        </div>
      </div>
    </nav>
    <main class="container">
      <div class="breadcrumb">
        <a href="/">Home</a><span class="sep">/</span><span>${escapeHtml(article.h1)}</span>
      </div>
      <div class="article-hero">
        <h1>${escapeHtml(article.h1)}</h1>
        <p>${escapeHtml(article.intro)}</p>
      </div>
      ${sectionsHtml}
      ${['best-free-ai-apis', 'how-to-pick-free-llm-api'].includes(article.slug) ? `<p style="margin-top:28px;font-size:14.5px;color:var(--text-secondary)">Want the same providers ranked by how fast you actually get a key — no credit card, no KYC paths flagged? See our <a href="/llm-providers/">LLM Providers directory</a>, which ranks 168 providers by signup friction.</p>` : ''}
      <section class="article-deals">
        <h2>Relevant Deals</h2>
        <div class="deals-grid">${relatedDealsCards}</div>
      </section>
    </main>
    <footer class="footer" role="contentinfo" aria-label="Site footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <span class="nav-logo-badge">devcheap</span>
          <p class="footer-text">Verified developer deals, curated weekly.</p>
        </div>
        <div class="footer-links">
          <a href="https://github.com/hasitpbhatt/devcheap" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub</a>
          <a href="/#newsletter" class="nav-link">Newsletter</a>
        </div>
      </div>
      ${articleDisclosure}
    </footer>
  </div>
</body>
</html>`;
    await fs.writeFile(path.join(articleDir, 'index.html'), pageHtml, 'utf-8');
  });

  await Promise.all(articlePromises);
  console.log(`✅ Generated ${articles.length} aggregate article pages under /articles/[slug]/`);
}

async function generateCategoryPages(ROOT_DIR, deals) {
  const templatePath = path.join(ROOT_DIR, 'templates', 'category.html');
  const template = await fs.readFile(templatePath, 'utf-8');
  const categoryDir = path.join(ROOT_DIR, 'category');
  await fs.mkdir(categoryDir, { recursive: true });

  const categorySEO = await loadCategorySEO();
  const cats = [...new Set(deals.map(d => d.category))].sort();

  const promises = cats.map(async (cat) => {
    const slug = categorySlug(cat);
    const seo = categorySEO[cat.toLowerCase()] || defaultSEO;
    const catDeals = deals.filter(d => d.category === cat)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const freeCount = catDeals.filter(d => d.pricing === 'free').length;
    const lifetimeCount = catDeals.filter(d => d.pricing === 'lifetime').length;
    const paidCount = catDeals.filter(d => d.pricing === 'paid' || d.pricing === 'trial').length;

    // Generate a clean meta description from intro
    const dealLabel = catDeals.length === 1 ? 'verified deal' : 'verified deals';
    const metaDesc = `${seo.intro} ${catDeals.length} ${dealLabel} — free credits, lifetime licenses, and startup packages.`;

    const dealCards = catDeals.map(d => renderDealCard(d)).join('\n');
    const categoryHasAffiliate = catDeals.some(d => d.has_affiliate);
    const categoryDisclosure = categoryHasAffiliate ? renderAffiliateDisclosure() : '';

    const faqs = (seo.faqs || defaultSEO.faqs).map((faq, i) => `
    <div class="faq-item">
      <button class="faq-question" aria-expanded="false">${escapeHtml(faq.q)}</button>
      <div class="faq-answer" aria-hidden="true">${escapeHtml(faq.a)}</div>
    </div>`).join('\n');

    // JSON-LD structured data
    const itemListJson = {
      "@context": "https://schema.org",
      "@type": ["CollectionPage", "ItemList"],
      "@id": `https://devcheap.click/category/${slug}/`,
      "name": seo.h1,
      "description": metaDesc,
      "url": `https://devcheap.click/category/${slug}/`,
      "numberOfItems": catDeals.length,
      "itemListElement": catDeals.map((d, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://devcheap.click/deals/${d.id}/`
      })),
      "isPartOf": { "@id": "https://devcheap.click/#website" },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devcheap.click/" },
          { "@type": "ListItem", "position": 2, "name": cat, "item": `https://devcheap.click/category/${slug}/` }
        ]
      }
    };

    // FAQ structured data
    if (faqs.length > 0) {
      const faqJson = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": (seo.faqs || defaultSEO.faqs).map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
      };
      itemListJson.mainEntity = faqJson.mainEntity;
    }

    const hubLinkHtml = cat.toLowerCase() === 'ai & llm' || cat.toLowerCase() === 'ai'
      ? `<p style="margin-top:14px;font-size:14px;color:var(--text-secondary)">Prefer to compare providers by signup friction instead of category? See our <a href="/llm-providers/">LLM Providers directory</a> — 168 providers ranked by how fast you get an API key.</p>`
      : '';

    const jsonLdHtml = `<script type="application/ld+json">\n${JSON.stringify(itemListJson, null, 2)}\n</script>`;

    const pageDir = path.join(categoryDir, slug);
    await fs.mkdir(pageDir, { recursive: true });

    let html = template
      .replace(/{{CATEGORY_SLUG}}/g, slug)
      .replace(/{{CATEGORY_NAME}}/g, escapeHtml(cat))
      .replace(/{{CATEGORY_TITLE}}/g, escapeHtml(seo.title || defaultSEO.title))
      .replace(/{{CATEGORY_H1}}/g, escapeHtml(seo.h1 || defaultSEO.h1))
      .replace(/{{CATEGORY_INTRO}}/g, escapeHtml(seo.intro || defaultSEO.intro))
      .replace(/{{CATEGORY_META_DESC}}/g, escapeHtml(metaDesc))
      .replace(/{{DEAL_COUNT}}/g, catDeals.length)
      .replace(/{{FREE_COUNT}}/g, freeCount)
      .replace(/{{LIFETIME_COUNT}}/g, lifetimeCount)
      .replace(/{{PAID_COUNT}}/g, paidCount)
      .replace('{{CATEGORY_DEAL_CARDS}}', dealCards)
      .replace('{{CATEGORY_FAQ}}', faqs)
      .replace('{{CATEGORY_JSONLD}}', jsonLdHtml)
      .replace('{{CATEGORY_HUB_LINK}}', hubLinkHtml)
      .replace('{{AFFILIATE_DISCLOSURE}}', categoryDisclosure);

    await fs.writeFile(path.join(pageDir, 'index.html'), html, 'utf-8');
  });

  await Promise.all(promises);
  console.log(`✅ Generated ${cats.length} category SEO pages under /category/[slug]/`);
}

async function generateAlternativePages(ROOT_DIR, deals) {
  const templatePath = path.join(ROOT_DIR, 'templates', 'alternative.html');
  const template = await fs.readFile(templatePath, 'utf-8');
  const altDir = path.join(ROOT_DIR, 'alternatives');
  await fs.mkdir(altDir, { recursive: true });

  const altSlugs = computeAlternativeSlugs(deals);

  // Remove orphaned alternative directories (deal removed from deals.jsonl).
  const existingDirs = await fs.readdir(altDir, { withFileTypes: true });
  const removalPromises = existingDirs
    .filter(entry => entry.isDirectory() && !altSlugs.has(entry.name))
    .map(async (entry) => {
      await fs.rm(path.join(altDir, entry.name), { recursive: true, force: true });
      console.log(`🗑️  Removed orphaned alternative directory: alternatives/${entry.name}/`);
    });
  await Promise.all(removalPromises);

  const promises = deals.map(async (deal) => {
    // Alternatives = same-category deals (exclude self), capped at 10.
    // Fall back to other categories if fewer than 3 share the category.
    let alts = deals.filter(d => d.category === deal.category && d.id !== deal.id);
    if (alts.length < 3) {
      const extra = deals.filter(d => d.category !== deal.category && d.id !== deal.id);
      alts = [...alts, ...extra].slice(0, 10);
    } else {
      alts = alts.slice(0, 10);
    }

    const altCards = alts.map(d => renderDealCard(d)).join('\n')
      .replace(/href="deals\//g, 'href="/deals/');
    const slug = altSlugs.get(deal.id);
    const catSlug = categorySlug(deal.category);

    const intro = `Looking for ${escapeHtml(deal.name)} alternatives? We ranked ${alts.length} verified ${escapeHtml(deal.category)} options developers actually ship with — free tiers, startup credits, and pricing that won't surprise you at renewal.`;
    const metaDesc = `Best ${escapeHtml(deal.name)} alternatives in ${escapeHtml(deal.category)} (2026). ${alts.length} verified developer deals with free tiers, credits, and honest pricing.`;
    const title = `${escapeHtml(deal.name)} Alternatives — ${escapeHtml(deal.category)} Deals (2026) | DevCheap`;

    const topThree = alts.slice(0, 3).map(d => d.name).join(', ');
    const faqs = [
      {
        q: `What is the best ${deal.name} alternative?`,
        a: `It depends on your stack. The highest-rated options here are ${topThree}. Each lists verified pricing and free-tier details so you can compare without leaving the page.`
      },
      {
        q: `Is ${deal.name} free?`,
        a: deal.pricing === 'free'
          ? `${deal.name} has a free tier. If you need more, the alternatives below include similar free plans and startup credits.`
          : `${deal.name} is ${deal.pricing}. The alternatives on this page show exactly what is free, trial, or paid so you can pick a cheaper fit.`
      },
      {
        q: `How do I compare ${deal.name} with these alternatives?`,
        a: `Start with the free tiers listed above, then export your data and import into the tool that matches your usage. Most list a migration guide on their deal page.`
      }
    ];

    const faqHtml = faqs.map(f => `<div class="faq-item"><button class="faq-question" aria-expanded="false">${escapeHtml(f.q)}</button><div class="faq-answer" aria-hidden="true">${escapeHtml(f.a)}</div></div>`).join('\n');

    const faqJson = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } }))
    };
    const faqJsonHtml = `<script type="application/ld+json">\n${JSON.stringify(faqJson, null, 2)}\n</script>`;

    const breadcrumbJson = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devcheap.click/" },
        { "@type": "ListItem", "position": 2, "name": deal.category, "item": `https://devcheap.click/category/${catSlug}/` },
        { "@type": "ListItem", "position": 3, "name": `${deal.name} Alternatives`, "item": `https://devcheap.click/alternatives/${slug}/` }
      ]
    };
    const breadcrumbJsonHtml = `<script type="application/ld+json">\n${JSON.stringify(breadcrumbJson, null, 2)}\n</script>`;

    const hasAffiliate = deal.has_affiliate || alts.some(d => d.has_affiliate);
    const disclosure = hasAffiliate ? renderAffiliateDisclosure() : '';

    let html = template
      .replace(/{{TOOL_SLUG}}/g, slug)
      .replace(/{{TOOL_TITLE}}/g, title)
      .replace(/{{TOOL_META_DESC}}/g, metaDesc)
      .replace(/{{TOOL_NAME}}/g, escapeHtml(deal.name))
      .replace(/{{TOOL_CATEGORY}}/g, escapeHtml(deal.category))
      .replace(/{{TOOL_CATEGORY_SLUG}}/g, catSlug)
      .replace(/{{INTRO}}/g, intro)
      .replace(/{{ALT_COUNT}}/g, alts.length)
      .replace('{{ALTERNATIVE_CARDS}}', altCards)
      .replace('{{BREADCRUMB_JSONLD}}', breadcrumbJsonHtml)
      .replace('{{FAQ_HTML}}', faqHtml)
      .replace('{{FAQ_JSONLD}}', faqJsonHtml)
      .replace('{{AFFILIATE_DISCLOSURE}}', disclosure);

    const pageDir = path.join(altDir, slug);
    await fs.mkdir(pageDir, { recursive: true });
    await fs.writeFile(path.join(pageDir, 'index.html'), html, 'utf-8');
  });

  await Promise.all(promises);
  console.log(`✅ Generated ${deals.length} alternative pages under /alternatives/[slug]/`);
}

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
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-9QV2CZSZP4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-9QV2CZSZP4');
</script>
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

async function generateRedirectPages(ROOT_DIR, deals) {
  const redirectsDir = path.join(ROOT_DIR, 'r');
  await fs.mkdir(redirectsDir, { recursive: true });

  const promises = deals.map(async (deal) => {
    if (!deal.url) return;
    const trackedUrl = buildTrackedUrl(deal);
    const pageHtml = `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=${escapeHtml(trackedUrl)}">
  <link rel="canonical" href="https://devcheap.click/deals/${escapeHtml(deal.id)}/">
  <title>Redirecting to ${escapeHtml(deal.name)} — DevCheap</title>
  <meta name="robots" content="noindex, follow">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0; }
    .box { text-align: center; padding: 32px; }
    a { color: #38bdf8; }
  </style>
  <script>
    window.location.replace(${JSON.stringify(trackedUrl)});
  </script>
</head>
<body>
  <div class="box">
    <p>Redirecting to <strong>${escapeHtml(deal.name)}</strong>…</p>
    <p><a href="${escapeHtml(trackedUrl)}">Click here if you are not redirected automatically.</a></p>
  </div>
</body>
</html>`;
    const dealDir = path.join(redirectsDir, deal.id);
    await fs.mkdir(dealDir, { recursive: true });
    await fs.writeFile(path.join(dealDir, 'index.html'), pageHtml, 'utf-8');
  });

  await Promise.all(promises);
  console.log(`✅ Generated ${deals.length} redirect pages under /r/[id]/`);
}

async function generateLlmProviderPages(ROOT_DIR) {
  const templatePath = path.join(ROOT_DIR, 'templates', 'llm-provider-hub.html');
  let template;
  try {
    template = await fs.readFile(templatePath, 'utf-8');
  } catch {
    console.log('⚠️ LLM provider hub template not found, skipping.');
    return;
  }
  const dataPath = path.join(ROOT_DIR, 'data', 'llm-providers.json');
  let providers = [];
  try {
    providers = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
  } catch {
    console.log('⚠️ data/llm-providers.json not found, skipping LLM hub.');
    return;
  }

  const hubDir = path.join(ROOT_DIR, 'llm-providers');
  await fs.mkdir(hubDir, { recursive: true });

  const easeClass = (e) => e >= 90 ? 'ease-90' : e >= 80 ? 'ease-80' : e >= 70 ? 'ease-70' : e >= 60 ? 'ease-60' : 'ease-low';
  const statusClass = (s) => ({ active: 'st-active', gated: 'st-gated', trial: 'st-trial', beta: 'st-beta', retired: 'st-retired', warning: 'st-warning' }[s] || 'st-active');
  const gateChips = (gates) => (gates.length === 1 && gates[0] === 'none')
    ? '<span class="gate-chip gate-none">No gate</span>'
    : gates.map((g) => `<span class="gate-chip">${escapeHtml(g)}</span>`).join('');

  const rows = providers.map((d, i) => {
    const nameCell = d.dealId
      ? `<a class="hub-prov" href="/deals/${escapeHtml(d.dealId)}/">${escapeHtml(d.name)}</a>`
      : `<a class="hub-prov" href="${escapeHtml(d.signupUrl)}" target="_blank" rel="noopener noreferrer" data-llm="${escapeHtml(d.id)}">${escapeHtml(d.name)}<span class="ext">↗</span></a>`;
    return `          <tr data-name="${escapeHtml(d.name.toLowerCase())}" data-type="${escapeHtml(d.type)}" data-ease="${d.ease}" data-isllm="${d.isLLM ? 1 : 0}" data-gates="${escapeHtml(d.gates.join(','))}">
            <td>${i + 1}</td>
            <td>${nameCell}</td>
            <td class="hub-type">${escapeHtml(d.type)}</td>
            <td><span class="ease-badge ${easeClass(d.ease)}">${d.ease}</span></td>
            <td>${gateChips(d.gates)}</td>
            <td>${escapeHtml(d.freeTier || '—')}</td>
            <td>${escapeHtml(d.rpm || '—')}</td>
            <td>${escapeHtml(d.context || '—')}</td>
            <td><span class="status-pill ${statusClass(d.status)}">${escapeHtml(d.status)}</span></td>
          </tr>`;
  }).join('\n');

  const buildJsonLd = (list, url, name, desc) => {
    const itemList = {
      '@context': 'https://schema.org',
      '@type': ['CollectionPage', 'ItemList'],
      '@id': url,
      'name': name,
      'description': desc,
      'url': url,
      'numberOfItems': list.length,
      'itemListElement': list.map((d, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'url': d.dealId ? `https://devcheap.click/deals/${d.dealId}/` : d.signupUrl,
        'name': d.name
      })),
      'isPartOf': { '@id': 'https://devcheap.click/#website' },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://devcheap.click/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'LLM Providers', 'item': 'https://devcheap.click/llm-providers/' }
        ]
      }
    };
    return `<script type="application/ld+json">\n${JSON.stringify(itemList, null, 2)}\n</script>`;
  };

  const renderRows = (list) => list.map((d, i) => {
    const nameCell = d.dealId
      ? `<a class="hub-prov" href="/deals/${escapeHtml(d.dealId)}/">${escapeHtml(d.name)}</a>`
      : `<a class="hub-prov" href="${escapeHtml(d.signupUrl)}" target="_blank" rel="noopener noreferrer" data-llm="${escapeHtml(d.id)}">${escapeHtml(d.name)}<span class="ext">↗</span></a>`;
    return `          <tr data-name="${escapeHtml(d.name.toLowerCase())}" data-type="${escapeHtml(d.type)}" data-ease="${d.ease}" data-isllm="${d.isLLM ? 1 : 0}" data-gates="${escapeHtml(d.gates.join(','))}">
            <td>${i + 1}</td>
            <td>${nameCell}</td>
            <td class="hub-type">${escapeHtml(d.type)}</td>
            <td><span class="ease-badge ${easeClass(d.ease)}">${d.ease}</span></td>
            <td>${gateChips(d.gates)}</td>
            <td>${escapeHtml(d.freeTier || '—')}</td>
            <td>${escapeHtml(d.rpm || '—')}</td>
            <td>${escapeHtml(d.context || '—')}</td>
            <td><span class="status-pill ${statusClass(d.status)}">${escapeHtml(d.status)}</span></td>
          </tr>`;
  }).join('\n');

  const lastVerified = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const buildTop5 = (list) => {
    const top = [...list].sort((a, b) => b.ease - a.ease).slice(0, 5);
    return `<div class="hub-top5">${top.map((d, i) => {
      const href = d.dealId ? `/deals/${escapeHtml(d.dealId)}/` : escapeHtml(d.signupUrl);
      const target = d.dealId ? '' : ' target="_blank" rel="noopener noreferrer"';
      return `<a class="hub-top5-card" href="${href}"${target} data-llm="${escapeHtml(d.id)}">
        <div class="rank">#${i + 1}</div>
        <div class="name">${escapeHtml(d.name)}</div>
        <div class="ease"><span class="ease-badge ${easeClass(d.ease)}">${d.ease}</span></div>
        <div class="ft">${escapeHtml(d.freeTier || '—')}</div>
      </a>`;
    }).join('')}</div>`;
  };

  const buildHtml = (list, meta) => template
    .replaceAll('{{HUB_TITLE}}', escapeHtml(meta.title))
    .replaceAll('{{HUB_META_DESC}}', escapeHtml(meta.metaDesc))
    .replaceAll('{{HUB_H1}}', escapeHtml(meta.h1))
    .replaceAll('{{HUB_INTRO}}', escapeHtml(meta.intro))
    .replaceAll('{{HUB_COUNT}}', String(list.length))
    .replace('{{HUB_TABLE_ROWS}}', renderRows(list))
    .replace('{{HUB_DATA_JSON}}', JSON.stringify(list))
    .replace('{{HUB_JSONLD}}', buildJsonLd(list, meta.canonical, meta.jsonName, meta.jsonDesc))
    .replace('{{HUB_CANONICAL}}', meta.canonical)
    .replace('{{HUB_OG_URL}}', meta.canonical)
    .replaceAll('{{HUB_OG_IMAGE}}', 'https://devcheap.click/images/og-llm-providers.svg')
    .replace('{{HUB_TOP5}}', buildTop5(list))
    .replace('{{HUB_LAST_VERIFIED}}', lastVerified)
    .replace('{{HUB_BREADCRUMB_TAIL}}', meta.breadcrumbTail || '')
    .replace('{{HUB_TABLE_HEADING}}', meta.tableHeading)
    .replace('{{HUB_CLICK_CATEGORY}}', meta.clickCategory || 'LLM Providers')
    .replace('{{HUB_SKIP_GATE_CTA}}', meta.skipGate ? `<a class="btn-ghost" href="${escapeHtml(meta.skipGate.href)}">${escapeHtml(meta.skipGate.label)}</a>` : '');

  const hubMeta = {
    title: 'LLM Providers Compared — Free Tiers, Rate Limits & Ease of Signup (2026) | DevCheap',
    metaDesc: `${providers.length} LLM, image, speech & embedding API providers ranked by ease of signup — no credit card and no KYC paths flagged. Free-tier value, RPM rate limits, context windows, OpenRouter alternatives, and signup gates (card, phone, KYC, captcha) for each.`,
    h1: 'LLM Providers, ranked by how fast you get a key',
    intro: `Most "free" LLM APIs make you fight a Cloudflare challenge, hand over a credit card, or pass KYC before you get a key. We ranked ${providers.length} providers by an Ease score — how fast you actually reach your first API call with just an email. Filter by gate, type, or free-tier rate limits and skip the ones that waste your afternoon.`,
    canonical: 'https://devcheap.click/llm-providers/',
    jsonName: 'LLM Providers — Ranked by How Easy They Are to Use (Free Tiers, Rate Limits, Gates)',
    jsonDesc: 'A directory of LLM, image, speech, and embedding API providers ranked by an Ease score (how fast you get an API key with just email), with free-tier value, rate limits, and signup gates.',
    breadcrumbTail: '',
    tableHeading: '<h2 class="hub-section-title" id="all-providers">All providers, ranked by Ease score</h2>',
    clickCategory: 'LLM Providers',
    skipGate: { href: '/llm-providers/no-credit-card/', label: 'Skip the gate: no-card APIs →' }
  };
  await fs.writeFile(path.join(hubDir, 'index.html'), buildHtml(providers, hubMeta), 'utf-8');
  console.log(`✅ Generated LLM Providers hub with ${providers.length} providers at /llm-providers/`);

  const subPages = [
    {
      slug: 'no-credit-card',
      name: 'No Credit Card',
      filter: (p) => !p.gates.includes('card'),
      title: 'LLM & AI APIs With No Credit Card — Free Tiers, No Billing (2026) | DevCheap',
      metaDesc: 'Free LLM, image, speech, and embedding APIs that need no credit card — just an email. Ranked by Ease score with free-tier value and rate limits for each.',
      h1: 'Free LLM & AI APIs with no credit card',
      intro: 'Every provider below issues a key with just an email — no billing, no $0 pre-auth hold. We filtered the full directory down to the zero-card set so you can start building today.',
      jsonName: 'No-Credit-Card LLM & AI APIs — Ranked by Ease',
      jsonDesc: 'Free LLM, image, speech, and embedding API providers that require no credit card, ranked by Ease score.',
      tableHeading: '<h2 class="hub-section-title" id="no-card">No-credit-card providers, ranked by Ease score</h2>',
      clickCategory: 'LLM Providers / No Credit Card',
      skipGate: { href: '/llm-providers/', label: 'Browse all providers →' }
    },
    {
      slug: 'media-apis',
      name: 'Image, Speech & Embedding APIs',
      filter: (p) => ['Image', 'Speech', 'Embeddings'].includes(p.type),
      title: 'Free Image, Speech & Embedding APIs (No-Card Options) 2026 | DevCheap',
      metaDesc: 'Free image generation, speech-to-text, text-to-speech, and embedding APIs ranked by Ease score. No credit card options flagged for each provider.',
      h1: 'Free image, speech & embedding APIs',
      intro: 'Not every AI call is a chat completion. This slice ranks the image, speech, and embedding providers from the directory by how fast you get a key — with no-card options flagged.',
      jsonName: 'Free Image, Speech & Embedding APIs — Ranked by Ease',
      jsonDesc: 'Free image, speech, and embedding API providers ranked by Ease score, with no-credit-card options flagged.',
      tableHeading: '<h2 class="hub-section-title" id="media">Image, speech & embedding APIs, ranked by Ease score</h2>',
      clickCategory: 'LLM Providers / Media APIs',
      skipGate: { href: '/llm-providers/no-credit-card/', label: 'Skip the gate: no-card APIs →' }
    },
    {
      slug: 'openrouter-alternatives',
      name: 'OpenRouter Alternatives',
      filter: (p) => p.type === 'LLM-Gateway',
      title: 'OpenRouter Alternatives — 40+ LLM Gateways With Free Tiers (2026) | DevCheap',
      metaDesc: 'OpenRouter is not the only LLM gateway. Compare 40+ alternatives — one API key, many models, each with a free tier. Ranked by Ease score and free-tier value.',
      h1: 'OpenRouter alternatives: one key, many models',
      intro: 'OpenRouter puts 25+ free models behind one key. These gateways do the same — and several add their own free tiers. Ranked by how fast you get a working key.',
      jsonName: 'OpenRouter Alternatives — LLM Gateways Ranked by Ease',
      jsonDesc: 'LLM gateway providers (OpenRouter alternatives) ranked by Ease score, each with a free tier.',
      tableHeading: '<h2 class="hub-section-title" id="gateways">LLM gateways (OpenRouter alternatives), ranked by Ease score</h2>',
      clickCategory: 'LLM Providers / OpenRouter Alternatives',
      skipGate: { href: '/llm-providers/no-credit-card/', label: 'Skip the gate: no-card APIs →' }
    }
  ];

  for (const sub of subPages) {
    const list = providers.filter(sub.filter);
    const meta = { ...sub, canonical: `https://devcheap.click/llm-providers/${sub.slug}/`, breadcrumbTail: ` <span class="sep">/</span><span>${sub.name}</span>` };
    const dir = path.join(hubDir, sub.slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'index.html'), buildHtml(list, meta), 'utf-8');
    console.log(`✅ Generated LLM sub-page /llm-providers/${sub.slug}/ with ${list.length} providers`);
  }
}

async function generateStartupProgramsPage(ROOT_DIR, deals) {
  const buckets = {
    startup: deals.filter(d => d.requiresProgram === 'startup'),
    student: deals.filter(d => d.requiresProgram === 'student'),
    accelerator: deals.filter(d => d.requiresProgram === 'accelerator'),
  };
  const total = buckets.startup.length + buckets.student.length + buckets.accelerator.length;
  const today = new Date().toISOString().slice(0, 10);
  const url = 'https://devcheap.click/startup-programs/';
  const title = 'Startup Programs & Credits for Developers — Verified $1K–$350K+ in Cloud, AI & Infra';
  const desc = `${total} verified startup, student, and accelerator programs for developers: AWS Activate, Google Cloud for Startups, Microsoft for Startups, Anthropic, OpenAI, and more. Each card is honest about who qualifies.`;

  const sectionHTML = (key, heading, blurb, emptyMsg) => {
    const list = buckets[key];
    const body = list.length
      ? `<div class="sp-grid">${list.map(d => renderDealCard(d, true)).join('\n')}</div>`
      : `<p class="sp-empty">${emptyMsg}</p>`;
    return `<section class="sp-section" id="${key}">
      <h2 class="section-title">${heading}</h2>
      <p class="sp-blurb">${blurb}</p>
      ${body}
    </section>`;
  };

  const startupSection = sectionHTML(
    'startup',
    'Startup programs',
    'Credits and free tiers for qualifying early-stage startups. Most require being a registered, funded, or formally-incorporated company (YC, VC, or accelerator affiliation opens the bigger tiers).',
    ''
  );
  const studentSection = sectionHTML(
    'student',
    'Student programs',
    'Deals that require verified student status (typically a .edu email or GitHub Student Developer Pack).',
    'No student-only deals in the directory right now. For general student perks, see the GitHub Student Developer Pack.'
  );
  const acceleratorSection = sectionHTML(
    'accelerator',
    'Accelerator-exclusive',
    'Deals gated to current members or alumni of a named accelerator (e.g. Y Combinator).',
    ''
  );

  const itemList = [
    ...buckets.startup,
    ...buckets.student,
    ...buckets.accelerator,
  ].map((d, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: d.name,
    url: `https://devcheap.click/deals/${d.id}/`
  }));

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': ['CollectionPage', 'ItemList'],
    name: title,
    description: desc,
    url: url,
    numberOfItems: total,
    itemListElement: itemList,
    isPartOf: { '@id': 'https://devcheap.click/#website' },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://devcheap.click/' },
        { '@type': 'ListItem', position: 2, name: 'Startup programs', item: url }
      ]
    }
  });

  const html = `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <link rel="canonical" href="${url}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="DevCheap">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="/css/style.css">
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    .sp-hero { padding: 56px 24px 24px; max-width: 1100px; margin: 0 auto; }
    .sp-hero h1 { font-size: 30px; line-height: 1.2; margin: 0 0 12px; color: var(--text); letter-spacing: -0.6px; }
    .sp-hero p { font-size: 15px; color: var(--text-secondary); margin: 0 0 8px; max-width: 720px; line-height: 1.6; }
    .sp-meta { font-size: 12px; color: var(--text-tertiary); font-family: var(--font-mono); margin-top: 12px; }
    .sp-section { padding: 32px 24px; max-width: 1100px; margin: 0 auto; border-top: 1px solid var(--border); }
    .sp-section .section-title { font-size: 22px; margin: 0 0 8px; }
    .sp-blurb { font-size: 14px; color: var(--text-secondary); margin: 0 0 20px; max-width: 760px; line-height: 1.6; }
    .sp-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .sp-grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1000px) { .sp-grid { grid-template-columns: 1fr 1fr 1fr; } }
    .sp-empty { font-size: 14px; color: var(--text-tertiary); padding: 16px 0; }
    .sp-back { padding: 24px; max-width: 1100px; margin: 0 auto; font-size: 14px; }
  </style>
</head>
<body>
  <header class="sp-hero">
    <p style="font-size:12px;letter-spacing:0.6px;color:var(--text-tertiary);text-transform:uppercase;margin:0 0 8px;">DevCheap</p>
    <h1>Startup programs &amp; credits for developers</h1>
    <p>${total} verified programs from AWS, Google Cloud, Microsoft, Anthropic, OpenAI, Cloudflare, and 35+ more. Each deal card is honest about who qualifies &mdash; we do not pretend a startup-gated credit is open to everyone.</p>
    <p>Comparing LLM API providers for your stack? See the <a href="/llm-providers/">LLM Providers directory</a> (168 providers ranked by how fast you get a key).</p>
    <p class="sp-meta">Last verified ${today}</p>
  </header>
  <main>
    ${startupSection}
    ${studentSection}
    ${acceleratorSection}
  </main>
  <p class="sp-back"><a href="/">&larr; Back to all deals</a></p>
</body>
</html>`;

  const outDir = path.join(ROOT_DIR, 'startup-programs');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf-8');
  console.log(`✅ Generated /startup-programs/ with ${total} program-only deals (${buckets.startup.length} startup, ${buckets.student.length} student, ${buckets.accelerator.length} accelerator)`);
}

async function generateTransparencyPage(ROOT_DIR, deals) {
  const templatePath = path.join(ROOT_DIR, 'templates', 'transparency.html');
  const template = await fs.readFile(templatePath, 'utf-8');
  const today = new Date().toISOString().split('T')[0];

  const affiliateDeals = deals.filter(d => d.has_affiliate);
  const affiliateCount = affiliateDeals.length;
  const nonAffiliateCount = deals.length - affiliateCount;
  const runCost = '$0 (Cloudflare free tier)';
  const domainCost = '~$12/yr (devcheap.click)';
  const affiliateShare = affiliateCount > 0 ? `${Math.round((affiliateCount / deals.length) * 100)}%` : '0%';
  const teamTestedCount = deals.filter(d => d.verified_by_use).length;

  const affiliateRows = affiliateDeals.map(d => `
    <tr>
      <td><a href="/deals/${escapeHtml(d.id)}/">${escapeHtml(d.name)}</a></td>
      <td>${escapeHtml(d.category)}</td>
      <td>${escapeHtml(d.deal)}</td>
      <td>${d.rating}</td>
      <td><a href="${escapeHtml(d.affiliate_url || d.url)}" target="_blank" rel="noopener noreferrer">outbound →</a></td>
    </tr>`).join('\n');

  const html = template
    .replace('{{AFFILIATE_COUNT}}', String(affiliateCount))
    .replace('{{DEAL_COUNT}}', String(deals.length))
    .replace('{{NON_AFFILIATE_COUNT}}', String(nonAffiliateCount))
    .replace('{{RUN_COST}}', runCost)
    .replace('{{DOMAIN_COST}}', domainCost)
    .replace('{{AFFILIATE_SHARE}}', affiliateShare)
    .replace('{{TEAM_TESTED_COUNT}}', String(teamTestedCount))
    .replace('{{LAST_UPDATED}}', today)
    .replace('{{AFFILIATE_ROWS}}', affiliateRows);

  const outDir = path.join(ROOT_DIR, 'transparency');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf-8');
  console.log(`✅ Generated /transparency/ ledger (${affiliateCount} affiliate deals, ${nonAffiliateCount} non-affiliate)`);
}

async function generateVoicePage(ROOT_DIR) {
  const templatePath = path.join(ROOT_DIR, 'templates', 'voice.html');
  const template = await fs.readFile(templatePath, 'utf-8');
  const outDir = path.join(ROOT_DIR, 'voice');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'index.html'), template, 'utf-8');
  console.log(`✅ Generated /voice/ page`);
}

async function generateRatingRubricPage(ROOT_DIR) {
  const templatePath = path.join(ROOT_DIR, 'templates', 'rating-rubric.html');
  const template = await fs.readFile(templatePath, 'utf-8');
  const outDir = path.join(ROOT_DIR, 'rating-rubric');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'index.html'), template, 'utf-8');
  console.log(`✅ Generated /rating-rubric/ page`);
}

async function generateStackPage(ROOT_DIR) {
  const templatePath = path.join(ROOT_DIR, 'templates', 'stack.html');
  const template = await fs.readFile(templatePath, 'utf-8');
  const outDir = path.join(ROOT_DIR, 'stack');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'index.html'), template, 'utf-8');
  console.log(`✅ Generated /stack/ page`);
}

async function generateSponsorsPage(ROOT_DIR, deals) {
  const templatePath = path.join(ROOT_DIR, 'templates', 'sponsors.html');
  const template = await fs.readFile(templatePath, 'utf-8');
  const categories = [...new Set(deals.map(d => d.category))].sort();

  const html = template
    .replace('{{SESSIONS_DAY}}', '~100')
    .replace('{{DEAL_COUNT}}', String(deals.length))
    .replace('{{CATEGORY_COUNT}}', String(categories.length))
    .replace('{{LLM_PROVIDER_COUNT}}', '168');

  const outDir = path.join(ROOT_DIR, 'sponsors');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf-8');
  console.log(`✅ Generated /sponsors/ page`);
}

async function generateComparisonPages(ROOT_DIR, deals) {
  const templatePath = path.join(ROOT_DIR, 'templates', 'comparison.html');
  const template = await fs.readFile(templatePath, 'utf-8');
  const compDir = path.join(ROOT_DIR, 'deals');
  await fs.mkdir(compDir, { recursive: true });

  // Generate ~200 pairs: same category, similar rating (diff <= 1.5), both featured (rating >= 8 or affiliate)
  const featuredDeals = deals.filter(d => {
    if (d.requiresProgram) return false;
    if (d.has_affiliate) return true;
    if (d.expires && new Date(d.expires).getTime() < Date.now()) return false;
    return (d.rating || 0) >= 8.0;
  });

  const pairs = [];
  for (const cat of [...new Set(featuredDeals.map(d => d.category))]) {
    const catDeals = featuredDeals.filter(d => d.category === cat).sort((a, b) => (b.rating || 0) - (a.rating || 0));
    for (let i = 0; i < catDeals.length - 1 && pairs.length < 200; i++) {
      for (let j = i + 1; j < catDeals.length && pairs.length < 200; j++) {
        const a = catDeals[i];
        const b = catDeals[j];
        const diff = Math.abs((a.rating || 0) - (b.rating || 0));
        if (diff <= 1.5) pairs.push([a, b]);
      }
    }
  }

  console.log(`📊 Generating ${pairs.length} comparison pages…`);

  const promises = pairs.map(async ([a, b]) => {
    const catSlug = categorySlug(a.category);
    const metaDesc = `Compare ${escapeHtml(a.name)} vs ${escapeHtml(b.name)} — ${a.category}. Verified pricing, free tiers, ratings, and verdict.`;
    const intro = `Comparing ${escapeHtml(a.name)} and ${escapeHtml(b.name)}? Both are ${escapeHtml(a.category)} tools with verified free tiers. Here's the side-by-side.`;

    const winner = a.rating >= b.rating ? a : b;
    const winnerBadge = `<span class="cmp-badge cmp-badge--winner">Our pick: ${escapeHtml(winner.name)} (${winner.rating})</span>`;

    const dealACard = `
      <article class="cmp-card ${a === winner ? 'cmp-card--winner' : ''}">
        <div class="cmp-card-header">
          <div class="cmp-title-row">
            <h2>${escapeHtml(a.name)}</h2>
            <span class="cmp-cat">${escapeHtml(a.category)}</span>
          </div>
          <div class="cmp-rating">${a.rating}<span>/10</span></div>
        </div>
        <div class="cmp-offer">${escapeHtml(sanitizeDealValue(a.deal))}</div>
        <p class="cmp-why">${escapeHtml(a.why || 'No summary available.')}</p>
        <div class="cmp-meta">
          <div class="cmp-meta-item"><span class="cmp-meta-label">Pricing</span><span class="cmp-meta-value">${escapeHtml(a.pricing)}</span></div>
          <div class="cmp-meta-item"><span class="cmp-meta-label">Expires</span><span class="cmp-meta-value">${escapeHtml(a.expires || 'No expiry')}</span></div>
          <div class="cmp-meta-item"><span class="cmp-meta-label">Code</span><span class="cmp-meta-value">${escapeHtml(a.code)}</span></div>
        </div>
      </article>`;

    const dealBCard = `
      <article class="cmp-card ${b === winner ? 'cmp-card--winner' : ''}">
        <div class="cmp-card-header">
          <div class="cmp-title-row">
            <h2>${escapeHtml(b.name)}</h2>
            <span class="cmp-cat">${escapeHtml(b.category)}</span>
          </div>
          <div class="cmp-rating">${b.rating}<span>/10</span></div>
        </div>
        <div class="cmp-offer">${escapeHtml(sanitizeDealValue(b.deal))}</div>
        <p class="cmp-why">${escapeHtml(b.why || 'No summary available.')}</p>
        <div class="cmp-meta">
          <div class="cmp-meta-item"><span class="cmp-meta-label">Pricing</span><span class="cmp-meta-value">${escapeHtml(b.pricing)}</span></div>
          <div class="cmp-meta-item"><span class="cmp-meta-label">Expires</span><span class="cmp-meta-value">${escapeHtml(b.expires || 'No expiry')}</span></div>
          <div class="cmp-meta-item"><span class="cmp-meta-label">Code</span><span class="cmp-meta-value">${escapeHtml(b.code)}</span></div>
        </div>
      </article>`;

    const verdict = `${winner.name} wins for most developers: ${winner.why}. Choose ${a.name} if you need ${a.why.slice(0,80)}… Choose ${b.name} if you need ${b.why.slice(0,80)}…`;

    const faqs = [
      { q: `Which is better, ${a.name} or ${b.name}?`, a: `${winner.name} edges it for most: ${winner.why}. But ${(winner === a ? b : a).name} is better if you need ${(winner === a ? b : a).why.slice(0,100)}…` },
      { q: `Are both free?`, a: `${a.name} is ${a.pricing}; ${b.name} is ${b.pricing}. Both have usable free tiers.${a.pricing === 'free' && b.pricing === 'free' ? ' You can use both at $0.' : ''}` },
      { q: `Can I use both?`, a: `Yes. Many teams use ${a.name} for ${a.why.slice(0,60)}… and ${b.name} for ${b.why.slice(0,60)}…` },
    ];

    const faqHtml = faqs.map(f => `<div class="faq-item"><button class="faq-question" aria-expanded="false">${escapeHtml(f.q)}</button><div class="faq-answer" aria-hidden="true">${escapeHtml(f.a)}</div></div>`).join('\n');

    const faqJson = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
    const faqJsonHtml = `<script type="application/ld+json">\n${JSON.stringify(faqJson, null, 2)}\n</script>`;

    const breadcrumbJson = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://devcheap.click/" },
        { "@type": "ListItem", position: 2, name: a.category, item: `https://devcheap.click/category/${catSlug}/` },
        { "@type": "ListItem", position: 3, name: `${a.name} vs ${b.name}`, item: `https://devcheap.click/deals/${a.id}/vs/${b.id}/` }
      ]
    };
    const breadcrumbJsonHtml = `<script type="application/ld+json">\n${JSON.stringify(breadcrumbJson, null, 2)}\n</script>`;

    const hasAffiliate = a.has_affiliate || b.has_affiliate;
    const disclosure = hasAffiliate ? renderAffiliateDisclosure() : '';

    const pageDir = path.join(compDir, a.id, 'vs', b.id);
    await fs.mkdir(pageDir, { recursive: true });

    let html = template
      .replace(/{{DEAL_A_ID}}/g, escapeHtml(a.id))
      .replace(/{{DEAL_B_ID}}/g, escapeHtml(b.id))
      .replace(/{{DEAL_A_NAME}}/g, escapeHtml(a.name))
      .replace(/{{DEAL_B_NAME}}/g, escapeHtml(b.name))
      .replace(/{{CATEGORY_NAME}}/g, escapeHtml(a.category))
      .replace(/{{CATEGORY_SLUG}}/g, escapeHtml(catSlug))
      .replace(/{{META_DESC}}/g, escapeHtml(metaDesc))
      .replace(/{{INTRO}}/g, escapeHtml(intro))
      .replace(/{{WINNER_BADGE}}/g, winnerBadge)
      .replace('{{DEAL_A_CARD}}', dealACard)
      .replace('{{DEAL_B_CARD}}', dealBCard)
      .replace('{{VERDICT}}', escapeHtml(verdict))
      .replace('{{FAQ_HTML}}', faqHtml)
      .replace('{{FAQ_JSONLD}}', faqJsonHtml)
      .replace('{{BREADCRUMB_JSONLD}}', breadcrumbJsonHtml)
      .replace(/{{DEAL_A_PRICING}}/g, escapeHtml(a.pricing))
      .replace(/{{DEAL_B_PRICING}}/g, escapeHtml(b.pricing))
      .replace('{{AFFILIATE_DISCLOSURE}}', disclosure);

    await fs.writeFile(path.join(pageDir, 'index.html'), html, 'utf-8');
  });

  await Promise.all(promises);
  console.log(`✅ Generated ${pairs.length} comparison pages under /deals/<a>/vs/<b>/`);
}

async function generateLlmProviderDetailPages(ROOT_DIR) {
  const providersPath = path.join(ROOT_DIR, 'data', 'llm-providers.json');
  let providers = [];
  try {
    providers = JSON.parse(await fs.readFile(providersPath, 'utf-8'));
  } catch {
    console.log('⚠️ No llm-providers.json, skipping detail pages');
    return;
  }

  const templatePath = path.join(ROOT_DIR, 'templates', 'llm-provider-detail.html');
  let template;
  try {
    template = await fs.readFile(templatePath, 'utf-8');
  } catch {
    console.log('⚠️ No llm-provider-detail.html template, skipping detail pages');
    return;
  }

  const detailDir = path.join(ROOT_DIR, 'llm-providers');
  await fs.mkdir(detailDir, { recursive: true });

  for (const p of providers) {
    if (!p.dealId) continue; // only generate for providers that link to our deal pages
    const cat = p.category || 'LLM';
    const catSlug = categorySlug(cat);

    const html = template
      .replace(/{{PROVIDER_NAME}}/g, escapeHtml(p.name))
      .replace(/{{PROVIDER_SLUG}}/g, escapeHtml(p.id))
      .replace(/{{PROVIDER_CATEGORY}}/g, escapeHtml(cat))
      .replace(/{{PROVIDER_EASE}}/g, String(p.ease))
      .replace(/{{PROVIDER_FREE_TIER}}/g, escapeHtml(p.freeTier || '—'))
      .replace(/{{PROVIDER_RPM}}/g, escapeHtml(p.rpm || '—'))
      .replace(/{{PROVIDER_CONTEXT}}/g, escapeHtml(p.context || '—'))
      .replace(/{{PROVIDER_GATES}}/g, escapeHtml((p.gates || ['none']).join(', ')))
      .replace(/{{PROVIDER_SIGNUP_URL}}/g, escapeHtml(p.signupUrl))
      .replace(/{{PROVIDER_DEAL_URL}}/g, `/deals/${escapeHtml(p.dealId)}/`)
      .replace(/{{PROVIDER_TYPE}}/g, escapeHtml(p.type || 'LLM'))
      .replace(/{{PROVIDER_STATUS}}/g, escapeHtml(p.status || 'active'));

    const pageDir = path.join(detailDir, p.id);
    await fs.mkdir(pageDir, { recursive: true });
    await fs.writeFile(path.join(pageDir, 'index.html'), html, 'utf-8');
  }
  console.log(`✅ Generated ${providers.filter(p => p.dealId).length} LLM provider detail pages under /llm-providers/<slug>/`);
}

async function main() {
  console.log('🏁 Starting build process...');

  // 1. Load Deals Data
  const rawData = await fs.readFile(DEALS_PATH, 'utf-8').then(s => s.replace(/^\uFEFF/, ''));
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

  // Load LLM Providers hub deal ids for reciprocal internal links (Dharmesh: tighten the web)
  let llmHubDealIds = new Set();
  try {
    const llmRaw = await fs.readFile(path.join(ROOT_DIR, 'data', 'llm-providers.json'), 'utf-8');
    llmHubDealIds = new Set(JSON.parse(llmRaw).map((p) => p.dealId).filter(Boolean));
  } catch {}

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
  // Program-only deals (startup/student/accelerator) are excluded from the
  // default homepage featured set; they live on /startup-programs/.
  const featuredDeals = deals.filter(deal => {
    if (deal.requiresProgram) return false;
    if (deal.has_affiliate) return true;
    if (deal.expires && new Date(deal.expires).getTime() < Date.now()) return false;
    const r = typeof deal.rating === 'number' ? deal.rating : 0;
    return r >= FEATURED_RATING_MIN;
  });
  const featuredCards = featuredDeals.map(d => renderDealCard(d)).join('\n');
  indexHtml = indexHtml.replace('{{DEAL_CARDS}}', featuredCards);

  // Top Picks: 6 hand-curated deals for the homepage hero strip.
  // Selection rules:
  //   1. Pin the "minimax-week" deal while it is still active (campaign ends 2026-09-06).
  //   2. Fill remaining slots with active, high-rated affiliate deals.
  //   3. If fewer than 6 affiliate deals qualify, top up with highest-rated non-affiliate.
  //   4. Cap at 6.
  const TOP_PICKS_LIMIT = 6;
  const isActive = (deal) => !deal.expires || new Date(deal.expires).getTime() >= Date.now();
  const topPicksPicks = [];
  const topPicksUsed = new Set();
  const pinned = featuredDeals.find(d => d.id === 'minimax-week' && isActive(d));
  if (pinned) {
    topPicksPicks.push(pinned);
    topPicksUsed.add(pinned.id);
  }
  const affiliatePool = featuredDeals
    .filter(d => d.has_affiliate && isActive(d) && !topPicksUsed.has(d.id))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  for (const d of affiliatePool) {
    if (topPicksPicks.length >= TOP_PICKS_LIMIT) break;
    topPicksPicks.push(d);
    topPicksUsed.add(d.id);
  }
  if (topPicksPicks.length < TOP_PICKS_LIMIT) {
    const topupPool = featuredDeals
      .filter(d => isActive(d) && !topPicksUsed.has(d.id))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    for (const d of topupPool) {
      if (topPicksPicks.length >= TOP_PICKS_LIMIT) break;
      topPicksPicks.push(d);
      topPicksUsed.add(d.id);
    }
  }
  const topPicksCards = topPicksPicks.map(d => renderTopPickCard(d)).join('\n');
  indexHtml = indexHtml.replace('{{TOP_PICKS}}', topPicksCards);

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

  // Load FAQ data for injection
  const dealFaqData = await loadDealFaqs();

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
    const claimButton = `<a href="${trackedUrl}" target="_blank" rel="noopener noreferrer" class="sidebar-btn sidebar-btn-primary" aria-label="Claim ${escapeHtml(deal.name)} deal - opens in new tab">Claim Deal</a>`;

    const isPromoAutomatic = deal.code ? (deal.code.toLowerCase().includes('automatic') || deal.code.toLowerCase().includes('link')) : false;
    const couponButton = isPromoAutomatic
      ? `<button class="sidebar-btn sidebar-btn-secondary" style="opacity:0.5;cursor:default" disabled aria-label="${escapeHtml(deal.name)} discount is automatic, no code needed"><svg class="icon icon-chat" width="14" height="14"><use href="/images/icons.svg#icon-chat"/></svg> Automatic Discount</button>`
      : `<button id="copy-coupon-btn" class="sidebar-btn sidebar-btn-secondary" data-code="${escapeHtml(deal.code)}" aria-label="Copy coupon code ${escapeHtml(deal.code)} for ${escapeHtml(deal.name)}"><svg class="icon icon-copy" width="14" height="14"><use href="/images/icons.svg#icon-copy"/></svg> Copy Coupon (${escapeHtml(deal.code)})</button>`;

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

const { price, priceCurrency } = getDealOfferPrice(deal);
const productJson = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": deal.name,
  "description": deal.desc,
  "image": "https://devcheap.click/images/og-image.svg",
  "dateModified": dealLastMod,
  "offers": {
    "@type": "Offer",
    "price": price,
    "priceCurrency": priceCurrency,
    "availability": deal.expires ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
    "description": deal.deal,
    "url": `https://devcheap.click/deals/${deal.id}/`
  }
};
    const productJsonHtml = `<script type="application/ld+json">\n${JSON.stringify(productJson, null, 2)}\n</script>`;

    // Generate per-deal FAQ content
    const dealFaqHtml = generateDealFaqHtml(deal, dealFaqData);
    const dealFaqJsonld = generateDealFaqJsonld(deal, dealFaqData);

    const dealNameEncoded = encodeURIComponent(deal.name);
    const dealDescEncoded = encodeURIComponent(deal.desc.substring(0, 120));

    const llmHubLinkHtml = llmHubDealIds.has(deal.id)
      ? `<p style="margin-top:18px;font-size:13.5px;color:var(--text-secondary)">This provider is also in our <a href="/llm-providers/">LLM Providers directory</a> — 168 APIs ranked by how fast you get a key, with free-tier rate limits and gate analysis.</p>`
      : '';

    let populated = detailTemplate
      .replace(/{{DEAL_ID}}/g, escapeHtml(deal.id))
      .replace(/{{DEAL_NAME}}/g, escapeHtml(deal.name))
      .replace(/{{DEAL_NAME_ENCODED}}/g, dealNameEncoded)
      .replace(/{{DEAL_OFFER}}/g, escapeHtml(sanitizeDealValue(deal.deal)))
      .replace(/{{DEAL_DESC}}/g, escapeHtml(deal.desc))
      .replace(/{{DEAL_DESC_ENCODED}}/g, dealDescEncoded)
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
      .replace(/{{PRODUCT_JSONLD}}/g, productJsonHtml)
      .replace(/{{DEAL_FAQ_HTML}}/g, dealFaqHtml)
      .replace(/{{DEAL_FAQ_JSONLD}}/g, dealFaqJsonld)
      .replace('{{LLM_HUB_LINK}}', llmHubLinkHtml)
      .replace('{{AFFILIATE_DISCLOSURE}}', deal.has_affiliate ? renderAffiliateDisclosure() : '');

    // This await happens inside the mapped function context concurrently
    await fs.writeFile(path.join(dealDir, 'index.html'), populated, 'utf-8');
  });

  // Execute all page generation promises simultaneously
  await Promise.all(generatePagePromises);
  
  console.log(`✅ Generated ${totalDeals} deal detail pages under /deals/[id]/index.html`);

  // 4. Generate Redirect Pages
  await generateRedirectPages(ROOT_DIR, deals);

  // 5. Generate Category SEO Pages
  await generateCategoryPages(ROOT_DIR, deals);

  // 5b. Generate Alternatives Pages
  await generateAlternativePages(ROOT_DIR, deals);

  // 6. Generate sitemap.xml
  const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch file date ONCE (Optimization 1 executed)
  const globalLastMod = getFileLastMod('data/deals.jsonl');

  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  sitemapXml += `<url>\n  <loc>https://devcheap.click/</loc>\n  <lastmod>${today}</lastmod>\n  <changefreq>weekly</changefreq>\n  <priority>1.0</priority>\n</url>\n`;

  for (const deal of deals) {
    if (!deal.url) continue;
    sitemapXml += `<url>\n  <loc>https://devcheap.click/deals/${deal.id}/</loc>\n  <lastmod>${globalLastMod}</lastmod>\n  <changefreq>weekly</changefreq>\n  <priority>0.8</priority>\n</url>\n`;
    sitemapXml += `<url>\n  <loc>https://devcheap.click/r/${deal.id}/</loc>\n  <lastmod>${globalLastMod}</lastmod>\n  <changefreq>weekly</changefreq>\n  <priority>0.5</priority>\n</url>\n`;
  }

  // Add category SEO pages to sitemap
  const cats = [...new Set(deals.map(d => d.category))].sort();
  for (const cat of cats) {
    const slug = categorySlug(cat);
    sitemapXml += `<url>\n  <loc>https://devcheap.click/category/${slug}/</loc>\n  <lastmod>${globalLastMod}</lastmod>\n  <changefreq>weekly</changefreq>\n  <priority>0.7</priority>\n</url>\n`;
  }

  // Add alternatives pages to sitemap
  const altSlugs = computeAlternativeSlugs(deals);
  for (const deal of deals) {
    const slug = altSlugs.get(deal.id);
    sitemapXml += `<url>\n  <loc>https://devcheap.click/alternatives/${slug}/</loc>\n  <lastmod>${globalLastMod}</lastmod>\n  <changefreq>weekly</changefreq>\n  <priority>0.6</priority>\n</url>\n`;
  }

  // Add aggregate article pages to sitemap
  const articleSlugs = ['best-free-cloud-credits', 'best-free-ai-apis', 'how-to-pick-free-llm-api', 'free-developer-tools-2026', 'startup-credit-programs', 'best-lifetime-deals-developers', 'saas-zero-budget', 'auth-database-setup', 'ai-feature-cheap'];
  for (const slug of articleSlugs) {
    sitemapXml += `<url>\n  <loc>https://devcheap.click/articles/${slug}/</loc>\n  <lastmod>${today}</lastmod>\n  <changefreq>monthly</changefreq>\n  <priority>0.6</priority>\n</url>\n`;
  }

  // Add legal/affiliate disclosure page
  sitemapXml += `<url>\n  <loc>https://devcheap.click/disclosure/</loc>\n  <lastmod>${today}</lastmod>\n  <changefreq>monthly</changefreq>\n  <priority>0.3</priority>\n</url>\n`;

  // Add LLM Providers directory hub
  sitemapXml += `<url>\n  <loc>https://devcheap.click/llm-providers/</loc>\n  <lastmod>${today}</lastmod>\n  <changefreq>weekly</changefreq>\n  <priority>0.7</priority>\n</url>\n`;
  // Add LLM Providers sub-pages (filtered slices)
  for (const slug of ['no-credit-card', 'media-apis', 'openrouter-alternatives']) {
    sitemapXml += `<url>\n  <loc>https://devcheap.click/llm-providers/${slug}/</loc>\n  <lastmod>${today}</lastmod>\n  <changefreq>weekly</changefreq>\n  <priority>0.6</priority>\n</url>\n`;
  }

  sitemapXml += `<url>\n  <loc>https://devcheap.click/startup-programs/</loc>\n  <lastmod>${today}</lastmod>\n  <changefreq>weekly</changefreq>\n  <priority>0.7</priority>\n</url>\n`;
  sitemapXml += `</urlset>\n`;
  await fs.writeFile(sitemapPath, sitemapXml, 'utf-8');

  // 6. Generate sitemap_index.xml
  const sitemapIndexPath = path.join(ROOT_DIR, 'sitemap_index.xml');
  const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<sitemap>\n  <loc>https://devcheap.click/sitemap.xml</loc>\n  <lastmod>${today}</lastmod>\n</sitemap>\n</sitemapindex>\n`;
  await fs.writeFile(sitemapIndexPath, sitemapIndexXml, 'utf-8');
  
  console.log('✅ Generated sitemap.xml with all deal detail and redirect pages.');
  console.log('✅ Generated sitemap_index.xml.');

    // 7. Generate feed.xml from deals.jsonl
    try {
      execSync('pwsh -NoProfile -File scripts/generate-feed.ps1', { stdio: 'inherit' });
      console.log('✅ Generated feed.xml from deals.jsonl.');
    } catch (e) {
      console.warn('⚠️ feed.xml generation failed (will run via separate pwsh script):', e.message);
    }

    // 8. Generate archive.html — low-value deals kept linkable but off the homepage
  await generateArchive(ROOT_DIR, deals, getFileLastMod);

  // 8. Generate aggregate "best of" article pages
  await generateAggregatePages(ROOT_DIR, deals);

  // 8b. Generate LLM Providers directory hub
  await generateLlmProviderPages(ROOT_DIR);

  // 8c. Generate startup programs landing page
  await generateStartupProgramsPage(ROOT_DIR, deals);

  // 8d. Generate trust & utility pages
  await generateTransparencyPage(ROOT_DIR, deals);
  await generateVoicePage(ROOT_DIR);
  await generateRatingRubricPage(ROOT_DIR);
  await generateStackPage(ROOT_DIR);
  await generateSponsorsPage(ROOT_DIR, deals);
  await generateComparisonPages(ROOT_DIR, deals);
  await generateLlmProviderDetailPages(ROOT_DIR);

  console.log('✨ Build complete! Time to deploy.');
}

main().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
