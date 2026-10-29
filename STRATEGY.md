# Strategy, Committee, and Voice

This is the canonical document for **why** DevCheap is built the way it is. It captures the 6-month strategy, the committee model, the editorial voice, and the plan of record. For **how** to make changes (file sync, build, tests), see [`AGENTS.md`](AGENTS.md). For **what** to write, see [`VOICE.md`](VOICE.md).

---

## 1. Strategic Frame

**Time-box:** 6 months. The domain `devcheap.click` is owned through Feb 2027. The decision to renew is data-driven, not hopeful.

**Brand posture:** Anonymous, product-first. No personal name, no face, no X/LinkedIn distribution. The site is the brand.

**Lead play:** Programmatic SEO + Affiliate compounder. **Newsletter is not a lead product.** It may exist later as a retention tool, but the compounding engine is search traffic and affiliate clicks.

**Success metrics (month 6):**

| Metric | Target | Why it matters |
|---|---|---|
| Top Picks CTR | ≥ 8% | Validates the 6-card curation. Below 8% means the picks aren't credible. |
| Organic sessions/day | 5,000 | The compounding engine is working. Without this, nothing else scales. |
| Total revenue (sponsor + affiliate + ads) | $1,000+ | The site is self-funding, the domain is worth renewing. |
| Indexed pages | ≥ 250 SEO pages | Quality of programmatic foundation. |

**Renewal decision (end of month 5):**

| Outcome | Action |
|---|---|
| $1,000+ revenue AND 5,000 sessions/day | Renew. Continue. |
| $200–$1,000 AND 1,000–5,000 sessions/day | Renew if trajectory is strong. |
| < $200 OR < 1,000 sessions/day | Let lapse. Take what was learned. |

The audience (newsletter list, build pipeline, content) is portable. If the site lapses, the next domain starts with momentum.

---

## 2. The Committee

The committee is an advisory model. The site is solo-operated. The committee's job is to make sure every decision reflects a full-stack lens: engineering, SEO, conversion, design, content. Each member is a named persona with a specific scope and veto.

### Mitchell Hashimoto — Engineering & Architecture

**Owns:** Build pipeline, deployment, observability, performance, secret management, AI-search surface.

**Mantra:** *"Without measurement, every bet is a guess."*

**Why he's here:** HashiCorp co-founder. Built Vagrant, Terraform, Vault, Consul. Thinks in systems. The current devcheap build is a DAG of scripts (`build.js`, `generate-feed.ps1`, `generate-llmstxt.js`, validators, tests); Mitchell keeps that DAG honest.

**His veto:** Anything that ships without instrumentation. No "ship it, measure later." Measure first, then ship.

### Dharmesh Shah — Distribution & SEO

**Owns:** Programmatic SEO templates, link-building strategy, partnership outreach, search intent coverage.

**Mantra:** *"Programmatic SEO is the only anonymous compounding engine."*

**Why he's here:** HubSpot co-founder. 15 years proving that free, useful content compounds into a moat. Devcheap is exactly that shape — a structured database of 197 deals, ready to be sliced into 250+ SEO pages.

**His veto:** Any "1,000 thin pages" play. Quality cap = 437 pages across three template types. Beyond that, we dilute.

### Lenny Rachitsky — Conversion & Product

**Owns:** Funnel metrics, A/B tests, claim-button copy, email conversion, affiliate disclosure UX, the experiment backlog.

**Mantra:** *"A click you don't get to make is a click wasted."*

**Why he's here:** 14 years at Airbnb, Facebook, Twitter. Wrote the book on product growth. Knows that a deals site has 3 conversion events: search → category filter → claim. Each one needs a number.

**His veto:** Any "let's add another card" move that isn't backed by a CTR measurement. The Top Picks section needs to beat 8% CTR or the picks are wrong.

### Bret Taylor — Design & Product Taste

**Owns:** Homepage visual hierarchy, per-deal page template, the magazine-cover feel, the email design (when it exists), OG card design.

**Mantra:** *"The homepage is one big deal. It should feel like the front page of a magazine."*

**Why he's here:** Co-founder of Sierra, former co-CEO of Salesforce, co-created Google Maps. Rare engineer-founder with Jobs-era design taste. The Top Picks strip we shipped is the right primitive, but it needs typographic weight and a real signature.

**His veto:** Any "ship the feature" move that ignores the visual hierarchy. The user lands, sees 212 cards in a generic grid, and leaves in 4 seconds. That's the design problem to solve.

### Sahil Bloom — Editorial Voice

**Owns:** Voice, tone, content quality, the use-case page generator, the long-form pillar articles.

**Mantra:** *"Specific beats generic. Numbers beat adjectives. You beats developers."*

**Why he's here:** 1M-subscriber newsletter, single voice, weekly cadence. The reason devcheap's content doesn't sound like an aggregator is because Sahil's voice is the house style. AI-generated use-case pages are written *in this voice* — the persona system is what stops the output from reading like an LLM.

**His veto:** Any copy that reads like marketing. "Leverage," "synergy," "revolutionize," emoji in prose, "as an AI" hedges, generic claims. Reject. Rewrite. Ship.

---

## 3. The Editorial Voice

Use-case pages, pillar articles, and the eventual newsletter are all written *by the AI in Sahil's voice*. This is non-negotiable: the brand's product is trust, and trust is built on copy that sounds like a person, not a model.

Full operational rules: see [`VOICE.md`](VOICE.md). The summary:

- **First-person, casual authority.** "I tried X. Here's what worked."
- **Specifics over adjectives.** "I saved $200" beats "save money."
- **No marketing speak.** Banned words: leverage, synergy, revolutionize, unlock, supercharge, empower, transform, game-changer, ultimate, robust, seamless, cutting-edge.
- **No emoji in prose.**
- **No "as an AI" or "as a language model" hedges.** Speak as if you personally evaluated the deal.
- **Conversational transitions.** "Here's the thing," "But," "And," "Now."
- **End on the practical next step.** Not on a motivational platitude.

The persona prompt used to generate use-case pages is in `VOICE.md` §4. The prompt is part of the operational tooling, not the documentation.

---

## 4. Plan of Record (6-Month Cadence)

### Month 1 — Instrumentation + Programmatic SEO Foundation

**Week 1 (shipped Aug 29, 2026):**

- ✅ Click-tracking endpoint: `functions/api/track-click.js` (KV write, 90-day TTL)
- ✅ Frontend wiring: `js/affiliate.js` uses `sendBeacon` then `fetch({ keepalive: true })`
- ✅ Per-deal GA: `templates/deal-detail.html` now has gtag.js (`G-9QV2CZSZP4`)
- ✅ Search Console placeholder: `index.html` has `google-site-verification` meta tag (token replacement is out-of-band)
- ✅ Strategy doc: `STRATEGY.md` (this file)

**Week 2–3 (in progress):**

- Comparison template: `/deals/<id>/vs/<other-id>/` (200 pairs, same-category, similar rating)
- Alternatives template: `/alternatives/<tool-slug>/` (212 pages, 1 per deal)
- Use-case template: `/use-case/<slug>/` (25 hand-curated pages, AI-drafted in Sahil's voice)
- Internal link graph: every generated page links to ≥ 3 deal pages, ≥ 1 category page, ≥ 1 homepage anchor
- Sitemap update: `sitemap.xml` includes all new URLs at priority 0.6 (lower than deal pages, higher than archive)

**Week 4 (planned):**

- Search Console verification (user-side, out-of-band)
- Sitemap submit
- First GA4 review: traffic, top pages, top queries (after 7 days of data)
- First click-event review: Top Picks CTR baseline

### Month 2 — Content Velocity

- 2 new pillar articles (use existing 5 as templates, 2,000+ words each)
- 2–3 affiliate partnership outreach (Vercel, Neon, Resend, Sentry, Linear, PostHog, Groq)
- 20 new deals added (priority on affiliate-supported categories: AI & LLM, Hosting, Database, Dev Tools, Monitoring)
- Top Picks A/B test: order, copy, claim button wording

### Month 3 — SEO Maturation

- Search Console review: double down on what's ranking, de-prioritize what's not
- 10 more use-case pages based on actual search-query data from Search Console
- Above-the-fold claim button on every per-deal page (Lenny)
- Display ad slot (Carbon Ads, free to join, 50K sessions/mo minimum) — live but only loads ad if traffic threshold met
- Anonymous weekly digest to existing email list (Resend, ~2 hrs/week, low-stakes retention channel)

### Month 4 — Distribution

- Show HN submission: "Show: I indexed 215+ dev tool deals and built a programmatic comparison engine"
- 3 podcast pitches (anonymous, product-first)
- Cross-promo with 3 dev newsletters of similar size
- 30 more deals added

### Month 5 — Conversion Optimization

- Affiliate placement A/B test (Top Picks order, claim button copy, page layouts)
- Display ads live (if traffic crosses 5K sessions/mo threshold)
- 10 more use-case pages
- Final SEO audit: 90% of pages have unique title, meta description, schema markup, internal links
- Renewal decision matrix built from real data

### Month 6 — Decide

- Read the data. Apply the matrix from §1.
- If renewing: lock in next 6-month plan.
- If lapsing: archive the build pipeline, export the email list, document what was learned.

---

## 5. What's Shipped (Aug 29, 2026)

This is the cumulative shipped work. Updated each cycle.

**Measurement:**

- Google Analytics `G-9QV2CZSZP4` on `index.html` and all 212 `/deals/<id>/index.html` pages
- Click-tracking endpoint at `/api/track-click` (KV-backed, 90-day TTL)
- `link_type` taxonomy: `claim_deal` (regular grid), `top_picks_claim` (Top Picks strip), `coupon_copy` (code copies), `llm_provider` (LLM Providers directory outbound), `nav_click` (LLM Providers nav link CTR)
- Google Search Console placeholder ready for token claim

**Surfaces:**

- 197 per-deal pages
- 21 category landing pages
- 5 pillar articles
- 1 Top Picks strip (6 cards, computed at build time)
- 1 LLM Providers directory (`/llm-providers/`, 168 providers ranked by Ease, programmatic SEO hub with internal links to 40+ deal pages)
- Sitemap.xml, llms.txt, feed.xml (RSS), archive.html
- Newsletter form with Resend integration + Turnstile bot protection

**Build pipeline:**

- `scripts/build.js` (homepage + per-deal + category + article + sitemap + llms.txt)
- `scripts/generate-feed.ps1` (RSS feed, separate from build)
- `scripts/generate-llmstxt.js` (LLM-search surface)
- `scripts/validate-jsonl` (npm run validate:jsonl)
- 160 tests passing (Vitest: schema, UI, HTML, a11y, affiliate, build-freshness, llmstxt, well-known, spotlight-countdown, middleware, llm-providers)

**Decisions made:**

- D1 (Cloudflare SQL) rejected. Static HTML stays the rendering layer. KV handles dynamic state.
- Editorial voice: Sahil Bloom persona, codified in `VOICE.md`
- Committee: 5 named personas, each with scope and veto
- Top Picks filter: pinned slot for `minimax-week` while active, fill with high-rated affiliate deals, cap at 6

---

## 6. What This Plan Doesn't Need

- **No more money.** Zero budget. Cloudflare free tier, Resend free tier, GA4 free, Carbon Ads free to join.
- **No X/LinkedIn personal brand.** Anonymous.
- **No face/name disclosure.** Product-first.
- **No paid tools.** No Ahrefs, no Surfer, no Jasper, no premium newsletter platforms.
- **No third-party tracking.** GA4 is enough. Cloudflare Web Analytics is also available but GA covers it.

---

## 7. Time Budget

- **Target:** 15 hrs/week
- **Actual workload:** Front-loaded (Month 1 is heavy), Months 2–5 steady, Month 6 light
- **Solo operation.** The committee is advisory; all work is executed by the build pipeline and this assistant.

---

## 8. Change Log

| Date | Change | Author |
|---|---|---|
| 2026-08-29 | Strategy doc created (initial audit + Week 1 plan) | Committee |
| 2026-08-29 | Week 1 instrumentation shipped (track-click endpoint, GA on per-deal pages, Search Console placeholder) | Mitchell |
| 2026-08-29 | Top Picks strip shipped (6 cards, pinned slot for `minimax-week`) | Bret + Dharmesh |
| 2026-08-29 | D1 rejected; static HTML stays the rendering layer | Committee |
| 2026-08-29 | Sahil Bloom persona adopted as the editorial voice | Sahil |
| 2026-08-29 | 10 new deals added (Exa, Tavily, Chutes, Kiro, Devin Desktop, Sourcegraph Cody, Northflank, Shuttle, Plane, Kestra) — verified via fetched pricing pages, catalog now 197 deals | Committee |
