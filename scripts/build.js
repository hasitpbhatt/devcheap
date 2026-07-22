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

function categorySlug(category) {
  return category.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const categorySEO = {
  'hosting & cloud': { title: 'Best Hosting & Cloud Deals 2026 — Free Credits & Discounts for Developers', h1: 'Hosting & Cloud Deals for Developers', intro: 'Discover the best cloud hosting deals, free credits, and startup packages from AWS, Google Cloud, Cloudflare, DigitalOcean, and more. Save thousands on infrastructure with verified offers.', faqs: [{ q: 'Which cloud platform gives the most free credits for startups?', a: 'Cloudflare for Startups offers up to $250,000 in enterprise credits. Google Cloud for Startups provides up to $350,000 for AI-native companies. AWS Activate gives $1,000-$100,000 depending on VC backing.' }, { q: 'Can I get free cloud credits without VC funding?', a: "Yes! AWS Activate Founders tier ($1,000-$5,000) is automatic for any startup. Google Cloud Start ($1,000) and Microsoft Founders Hub ($5,000) also don't require VC backing." }, { q: 'How long are cloud startup credits valid?', a: 'Most cloud credits are valid for 1-2 years. AWS credits last 12 months, Google Cloud credits are valid for 2 years, and DigitalOcean credits last 12 months.' }] },
  'database': { title: 'Best Database Deals 2026 — Free Tiers & Startup Credits', h1: 'Database Deals for Developers', intro: 'Find the best free database tiers and startup credits for PostgreSQL, MySQL, MongoDB, and more. From serverless Postgres to managed SQL — get enterprise-grade databases for free.', faqs: [{ q: 'What is the best free PostgreSQL database?', a: 'Neon offers a generous free tier with serverless Postgres, branching, and scale-to-zero compute. For startups, they also provide up to $100,000 in credits.' }, { q: 'Which database has the best startup program?', a: 'Neon ($100K credits), CockroachDB (50M RUs free + 10GB storage), and Appwrite (75K MAU free BaaS) all offer exceptional startup programs.' }] },
  'ai & llm': { title: 'Best AI & LLM Deals 2026 — Free API Credits & Discounts', h1: 'AI & LLM Deals for Developers', intro: 'Get free API credits for GPT-4, Claude, Gemini, and open-source LLMs. Access $50K+ in AI credits from OpenAI, Anthropic, and Cloudflare — all verified and updated.', faqs: [{ q: 'How can I get free GPT-4/Claude API credits?', a: 'Anthropic offers up to $25,000 in Claude API credits for startups. OpenAI provides $5,000-$50,000+ for qualifying startups. GitHub Models gives free rate-limited access to 40+ models including GPT-4o.' }, { q: 'Are there free AI APIs that don\'t require a startup?', a: 'Yes! Cloudflare Workers AI gives 10,000 free neurons/day. GitHub Models offers free access to GPT-4o, DeepSeek-R1, and Llama 3.3. Cerebras provides 1M free tokens/day at 2,100 tok/s.' }] },
  'developer tools': { title: 'Best Developer Tools Deals 2026 — Free Tiers & Lifetime Licenses', h1: 'Developer Tools Deals for Developers', intro: 'Find the best free and discounted developer tools — from AI coding assistants and API clients to CI/CD and monitoring. Save hundreds on your dev stack with verified deals.', faqs: [{ q: 'What is the best free AI coding assistant?', a: 'GitHub Copilot Free gives 2,000 completions + 50 chat messages/month. Codeium offers unlimited free AI autocomplete. Cursor Pro provides 1 year free for startups through SaaSOffers.' }, { q: 'Are lifetime developer tools worth it?', a: 'Yes — tools like Bruno (free Postman alternative), Coolify (free Heroku alternative), and lifetime deals on AppSumo can save you $100+/year compared to subscription models.' }] },
  'apis & email': { title: 'Best API & Email Deals 2026 — Free Tiers & Transactional Email', h1: 'APIs & Email Deals for Developers', intro: 'Compare the best free email API tiers and transactional email services. SendGrid, Resend, Mailgun, and more — get reliable email delivery without breaking the bank.', faqs: [{ q: 'What is the best free transactional email service?', a: 'Resend offers a generous free tier with good deliverability. Twilio SendGrid has a free tier of 100 emails/day. Postmark has a free trial with 100 emails.' }, { q: 'How many free emails can I send per month?', a: 'Most email APIs offer 100-300 free emails per day on their free tiers. Brevo (formerly Sendinblue) offers 300 emails/day free with their marketing platform.' }] },
  'security': { title: 'Best Security Deals 2026 — Free VPN, Privacy & Security Tools', h1: 'Security Deals for Developers', intro: 'Protect your projects with free security tools — VPNs, password managers, GDPR compliance, and ad-blockers. Lifetime deals save you hundreds vs. monthly subscriptions.', faqs: [{ q: 'What is the best free VPN for developers?', a: 'Tailscale offers a generous free tier for personal use with unlimited devices. FastestVPN has a lifetime deal option. For privacy, AdGuard has a lifetime ad-blocking subscription.' }] },
  'monitoring': { title: 'Best Monitoring Deals 2026 — Free Uptime, APM & Error Tracking', h1: 'Monitoring Deals for Developers', intro: 'Keep your apps running with free monitoring tools — uptime checks, APM, error tracking, and log management. Get enterprise monitoring for free with verified startup deals.', faqs: [{ q: 'What is the best free uptime monitoring tool?', a: 'Better Stack offers free uptime monitoring with 100GB of log storage. Checkly provides Playwright-based browser monitoring. Both have generous free tiers.' }, { q: 'Which APM tool is free for startups?', a: 'New Relic offers startup credits through their startup program. Sentry provides $100/month free for startups with their error monitoring platform.' }] },
  'productivity': { title: 'Best Productivity Deals 2026 — Free Project Management & Scheduling', h1: 'Productivity Deals for Developers', intro: 'Boost your workflow with free productivity tools — project management, scheduling, and documentation platforms. Lifetime deals save you money on tools you use every day.', faqs: [{ q: 'What is the best free project management tool?', a: 'Asana is free for up to 15 teammates with unlimited tasks and projects. ClickUp offers a generous free tier. Airtable provides $2,000 in credits through partnerships.' }] },
  'design & collaboration': { title: 'Best Design & Collaboration Deals 2026 — Free UI/UX & Whiteboard Tools', h1: 'Design & Collaboration Deals for Developers', intro: 'Find free design tools, whiteboards, and collaboration platforms. Figma, Excalidraw, Miro — get premium design tools without the premium price tag.', faqs: [{ q: 'Is Figma really free?', a: 'Yes! Figma\'s Starter plan is forever-free with unlimited drafts, UI kits, 150 AI credits/day, and unlimited viewers. The free tier is very generous for individual developers.' }, { q: 'What is the best free whiteboard tool?', a: 'Excalidraw is completely free and open-source with end-to-end encryption. It has a hand-drawn feel and supports real-time collaboration. No account needed for the web version.' }] },
  'web analytics': { title: 'Best Web Analytics Deals 2026 — Free Product Analytics & Session Recording', h1: 'Web Analytics Deals for Developers', intro: 'Understand your users with free analytics tools — product analytics, session recording, A/B testing, and more. PostHog, Amplitude, and other top tools offer generous free tiers.', faqs: [{ q: 'What is the best free product analytics platform?', a: 'PostHog offers 1M events/month free with session recordings, feature flags, surveys, and error tracking — all open-source. Amplitude offers 1 year free Growth plan ($36K value) for startups.' }] },
  'ci/cd': { title: 'Best CI/CD Deals 2026 — Free Build Minutes & Compute Credits', h1: 'CI/CD Deals for Developers', intro: 'Speed up your development with free CI/CD pipelines. CircleCI, Buildkite, and other platforms offer free build minutes and startup credits worth thousands.', faqs: [{ q: 'What is the best free CI/CD platform?', a: 'CircleCI offers 6,000 free credits/week (Linux builds) and $20,000 in startup credits. Buildkite gives 5,000 free job minutes/month for 3 users. Both are excellent choices.' }] },
  'domains & hosting': { title: 'Best Domains & Hosting Deals 2026 — Cheap Domains & Web Hosting', h1: 'Domains & Hosting Deals for Developers', intro: 'Find the cheapest domain registration and web hosting deals. Cloudflare Registrar offers domains at cost, while IONOS and Namecheap provide deep discounts on hosting plans.', faqs: [{ q: 'Where is the cheapest place to buy domains?', a: 'Cloudflare Registrar sells domains at cost — typically $9.15/year for .com with no markup. Namecheap offers up to 50% off domains with free WHOIS privacy.' }] },
  'auth': { title: 'Best Auth Deals 2026 — Free Authentication & User Management', h1: 'Authentication Deals for Developers', intro: 'Add authentication to your apps for free. Auth0, Clerk, and other auth platforms offer generous free tiers with thousands of monthly active users included.', faqs: [{ q: 'What is the best free authentication provider?', a: 'Auth0 is free for 7,000 MAUs and Clerk is free for 10,000 MAUs. Both support social login, MFA, and modern auth flows. They save $25-30/month compared to paid plans.' }] },
  'storage & cloud': { title: 'Best Storage & Cloud Deals 2026 — Free Object Storage', h1: 'Storage & Cloud Deals for Developers', intro: 'Get free cloud storage for your projects. Backblaze B2 and MinIO offer S3-compatible object storage with generous free tiers — perfect for backups and media.', faqs: [{ q: 'What is the best free S3-compatible storage?', a: 'Backblaze B2 offers 10GB free storage with affordable egress pricing (cheaper than AWS). MinIO is open-source and self-hostable for unlimited storage.' }] },
  'media & images': { title: 'Best Media & Image Deals 2026 — Free Image Optimization & CDN', h1: 'Media & Images Deals for Developers', intro: 'Optimize and deliver images and video for free. Cloudinary, ImageKit, and other media tools offer free monthly credits for transformations and CDN delivery.', faqs: [{ q: 'What is the best free image optimization service?', a: 'Cloudinary offers 25 free monthly credits for image and video transformations with CDN delivery. ImageKit has similar capabilities with a free tier.' }] },
  'testing & qa': { title: 'Best Testing & QA Deals 2026 — Free Cross-Browser & E2E Testing', h1: 'Testing & QA Deals for Developers', intro: 'Test your apps across browsers and devices for free. Cypress, BrowserStack, and other QA tools offer free tiers and trials for cross-browser and end-to-end testing.', faqs: [{ q: 'What is the best free end-to-end testing tool?', a: 'Cypress is free and open-source with time-travel debugging, automatic waiting, and real-time reloads. It\'s the industry standard for front-end testing.' }] },
  'apis & payments': { title: 'Best Payments & API Deals 2026 — Free Payment Processing', h1: 'APIs & Payments Deals for Developers', intro: 'Start accepting payments for free with Stripe and other payment APIs. Get free processing credits and startup programs worth thousands.', faqs: [{ q: 'How can I get free Stripe processing?', a: 'Stripe offers $100 in free processing credits for new accounts. Stripe Atlas provides additional benefits for startups looking to incorporate.' }] },
  'api & search': { title: 'Best Search API Deals 2026 — Free Search & Discovery', h1: 'Search API Deals for Developers', intro: 'Add powerful search to your apps with free search APIs. Algolia and other search platforms offer free tiers with thousands of records included.', faqs: [{ q: 'What is the best free search API?', a: 'Algolia offers a free tier with 10,000 records and typo-tolerant search. Their startup program provides $10,000 in API credits for qualifying startups.' }] },
  'customer support': { title: 'Best Customer Support Deals 2026 — Free Helpdesk & Support Tools', h1: 'Customer Support Deals for Developers', intro: 'Provide great customer support without the cost. Intercom, Zendesk, and other support platforms offer free startup programs and generous free tiers.', faqs: [{ q: 'What is the best free customer support platform?', a: 'Intercom offers startup credits through their early-stage program. Zendesk provides free tiers for small teams. Both offer substantial discounts for startups.' }] },
  'sales & marketing': { title: 'Best Sales & Marketing Deals 2026 — Free Marketing Tools', h1: 'Sales & Marketing Deals for Developers', intro: 'Grow your startup with free sales and marketing tools. Get CRM, email marketing, and analytics platforms at no cost through generous free tiers and startup programs.' },
  'services': { title: 'Best Developer Services Deals 2026 — Free Consulting & Support', h1: 'Developer Services Deals', intro: 'Access free consulting, support, and professional services for your startup. Many cloud providers include technical guidance with their credit programs.' },
  'ai': { title: 'Best AI Tools Deals 2026 — Free AI Apps & Lifetime Licenses', h1: 'AI Tools Deals for Developers', intro: 'Discover the best deals on AI-powered tools — from presentations and content creation to multi-model chat interfaces. Lifetime licenses save you from monthly fees.', faqs: [{ q: 'What are the best lifetime AI tool deals?', a: '1minAI offers a lifetime license with GPT-4, Claude, Gemini, and Midjourney access. ChatPlayGround AI provides multi-model chat for a one-time fee. Gamma has a generous free tier for AI presentations.' }] },
  'social media': { title: 'Best Social Media Deals 2026 — Free Social Media Management', h1: 'Social Media Deals for Developers', intro: 'Manage your social media presence for less with discounted and lifetime social media management tools.' },
  'seo': { title: 'Best SEO Deals 2026 — Free SEO Tools & Discounts', h1: 'SEO Deals for Developers', intro: 'Improve your search rankings with discounted SEO tools. Get site audits, keyword research, and optimization tools through exclusive developer deals.' },
};

const defaultSEO = {
  title: 'Best Deals for Developers — Free Credits & Discounts | DevCheap',
  h1: 'Developer Tool Deals',
  intro: 'Curated deals on developer tools, APIs, hosting, and AI services. Free credits, lifetime licenses, and exclusive discounts verified and updated regularly.',
  faqs: [{ q: 'How are deals verified?', a: 'Every deal on DevCheap is manually reviewed, rated 1-10, and categorized. We verify each offer\'s terms, pricing, and expiration date before listing.' }, { q: 'Do deals require a startup?', a: 'Some deals require startup status or VC backing, but many are available to all developers. Use the "startup-only" tag filter to distinguish. Free tiers and lifetime deals typically have no requirements.' }]
};

async function generateCategoryPages(ROOT_DIR, deals) {
  const templatePath = path.join(ROOT_DIR, 'templates', 'category.html');
  const template = await fs.readFile(templatePath, 'utf-8');
  const categoryDir = path.join(ROOT_DIR, 'category');
  await fs.mkdir(categoryDir, { recursive: true });

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
      .replace('{{CATEGORY_JSONLD}}', jsonLdHtml);

    await fs.writeFile(path.join(pageDir, 'index.html'), html, 'utf-8');
  });

  await Promise.all(promises);
  console.log(`✅ Generated ${cats.length} category SEO pages under /category/[slug]/`);
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

  // 4. Generate Category SEO Pages
  await generateCategoryPages(ROOT_DIR, deals);

  // 5. Generate sitemap.xml
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

  // Add category SEO pages to sitemap
  const cats = [...new Set(deals.map(d => d.category))].sort();
  for (const cat of cats) {
    const slug = categorySlug(cat);
    sitemapXml += `<url>\n  <loc>https://devcheap.click/category/${slug}/</loc>\n  <lastmod>${globalLastMod}</lastmod>\n  <changefreq>weekly</changefreq>\n  <priority>0.7</priority>\n</url>\n`;
  }

  sitemapXml += `</urlset>\n`;
  await fs.writeFile(sitemapPath, sitemapXml, 'utf-8');

  // 6. Generate sitemap_index.xml
  const sitemapIndexPath = path.join(ROOT_DIR, 'sitemap_index.xml');
  const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<sitemap>\n  <loc>https://devcheap.click/sitemap.xml</loc>\n  <lastmod>${today}</lastmod>\n</sitemap>\n</sitemapindex>\n`;
  await fs.writeFile(sitemapIndexPath, sitemapIndexXml, 'utf-8');
  
  console.log('✅ Generated sitemap.xml with all deal detail pages.');
  console.log('✅ Generated sitemap_index.xml.');

  // 7. Generate archive.html — low-value deals kept linkable but off the homepage
  await generateArchive(ROOT_DIR, deals, getFileLastMod);

  console.log('✨ Build complete! Time to deploy.');
}

main().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
